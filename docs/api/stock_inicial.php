<?php
// Recuento inicial por ficha. No requiere migraciones ni modifica préstamos históricos.
require __DIR__.'/comun.php';metodo(['POST']);usuarioActual();$d=datos();
$id=texto($d,'id',40);$cantidad=numero($d,'cantidad');
if(($d['confirmado']??false)!==true)responder(['error'=>'Confirmar el recuento físico del stock inicial'],400);
$pdo->beginTransaction();
$o=consulta('SELECT * FROM objetos WHERE id=? AND activo=1 FOR UPDATE',[$id])->fetch();
if(!$o){$pdo->rollBack();responder(['error'=>'Ficha inexistente o inactiva'],404);}
if($o['modo_control']==='cantidad'){
 $u=exigirPermiso('stock.mover');
 if(consulta("SELECT id FROM movimientos_stock WHERE objeto_id=? AND motivo NOT LIKE 'APERTURA: %' LIMIT 1",[$id])->fetch()){
  $pdo->rollBack();responder(['error'=>'Este artículo ya tiene movimientos de uso. Corregir el saldo mediante un ingreso o egreso con motivo, conservando su historial'],409);
 }
 $unidad=texto($d,'unidad',40);
 if($unidad!==($o['unidad']??''))exigirPermiso('objetos.editar');
 $diferencia=round($cantidad-(float)$o['stock_actual'],3);
 consulta('UPDATE objetos SET stock_actual=?,unidad=? WHERE id=?',[$cantidad,$unidad,$id]);
 if($diferencia!==0.0)consulta('INSERT INTO movimientos_stock(objeto_id,tipo,cantidad,operador_id,motivo) VALUES(?,?,?,?,?)',[$id,$diferencia>0?'ingreso':'egreso',abs($diferencia),$u['id'],'APERTURA: recuento inicial confirmado']);
 $pdo->commit();responder(['id'=>$id,'cantidad'=>$cantidad,'unidad'=>$unidad,'diferencia'=>$diferencia]);
}
$u=exigirPermiso('objetos.editar');
if($cantidad!==floor($cantidad)||$cantidad>500){$pdo->rollBack();responder(['error'=>'El stock individual debe ser un entero entre 0 y 500 ejemplares'],400);}
if(consulta('SELECT d.id FROM detalle_prestamo d JOIN detalle_objeto e ON e.id=d.detalle_objeto_id WHERE e.objeto_id=? LIMIT 1',[$id])->fetch()){
 $pdo->rollBack();responder(['error'=>'Esta herramienta ya tiene historial de préstamos. Gestionar sus ejemplares individualmente para conservar la trazabilidad'],409);
}
$unidades=consulta("SELECT * FROM detalle_objeto WHERE objeto_id=? AND estado<>'baja' ORDER BY id FOR UPDATE",[$id])->fetchAll();
$actual=count($unidades);$objetivo=(int)$cantidad;$retirar=$d['retirar']??[];
if(!is_array($retirar)||!array_is_list($retirar)||count(array_unique($retirar,SORT_REGULAR))!==count($retirar))responder(['error'=>'Lista de ejemplares a retirar inválida'],400);
foreach($retirar as $rid)if(!is_string($rid)||!in_array($rid,array_column($unidades,'id'),true))responder(['error'=>'Seleccionar solo ejemplares activos de esta ficha'],400);
if(count($retirar)!==max(0,$actual-$objetivo))responder(['error'=>'Para reducir el stock, seleccionar exactamente los ejemplares que se retiran: '.max(0,$actual-$objetivo)],400);
$estado=opcion($d,'estado_nuevos',['pendiente','disponible']);
$habilitar=($d['habilitar_pendientes']??false)===true;
$ubicacion=texto($d,'ubicacion',180,false)?:$o['ubicacion'];
$nota='[Apertura '.(new DateTimeImmutable('now',new DateTimeZone('America/Argentina/San_Luis')))->format('Y-m-d H:i').' · operador '.$u['id'].']';
foreach($retirar as $rid)consulta("UPDATE detalle_objeto SET estado='baja',observaciones=CONCAT(observaciones,?) WHERE id=?",["\n".$nota.' Retirado en recuento inicial',$rid]);
$creadas=[];
if($objetivo>$actual){
 exigirPermiso('objetos.crear');
 for($i=0;$i<$objetivo-$actual;$i++){$nid=idNuevo('UNI');consulta('INSERT INTO detalle_objeto(id,objeto_id,ubicacion,estado,qr,numero_serie,observaciones) VALUES(?,?,?,?,NULL,NULL,?)',[$nid,$id,$ubicacion,$estado,$nota.' Alta por recuento inicial']);$creadas[]=$nid;}
}
if($habilitar)consulta("UPDATE detalle_objeto SET estado='disponible',observaciones=CONCAT(observaciones,?) WHERE objeto_id=? AND estado='pendiente'",["\n".$nota.' Revisión física confirmada: apto',$id]);
$disponibles=(int)consulta("SELECT COUNT(*) FROM detalle_objeto WHERE objeto_id=? AND estado='disponible'",[$id])->fetchColumn();
$pdo->commit();responder(['id'=>$id,'cantidad'=>$objetivo,'disponibles'=>$disponibles,'creadas'=>$creadas,'retiradas'=>$retirar]);
