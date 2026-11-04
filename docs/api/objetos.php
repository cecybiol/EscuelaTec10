<?php
require __DIR__.'/comun.php';
$m=metodo(['GET','POST','PUT','DELETE']);
$accion=['GET'=>'ver','POST'=>'crear','PUT'=>'editar','DELETE'=>'baja'][$m];
exigirPermiso('objetos.'.$accion);
if ($m==='GET') {
 $tipo=$_GET['tipo']??''; $q=$_GET['q']??'';
 if (!is_string($q)||!in_array($tipo,['','herramienta','insumo','repuesto'],true)) responder(['error'=>'Filtro inválido'],400);
 $filas=consulta("SELECT id,id AS codigo,nombre,tipo,modo_control,categoria,ubicacion,unidad,stock_actual AS stock,stock_minimo AS stockMinimo,notas,fecha_creacion AS fechaCreacion FROM objetos WHERE activo=1 AND (?='' OR tipo=?) AND nombre LIKE ? ORDER BY nombre",[$tipo,$tipo,'%'.$q.'%'])->fetchAll();
 foreach($filas as &$o) {
  $o['stock']=$o['stock']===null?null:(float)$o['stock']; $o['stockMinimo']=$o['stockMinimo']===null?null:(float)$o['stockMinimo'];
  $o['unidades']=consulta('SELECT id,ubicacion,estado,qr,numero_serie FROM detalle_objeto WHERE objeto_id=?',[$o['id']])->fetchAll();
  $o['cantidadTotal']=count($o['unidades']);
  $libres=(int)consulta("SELECT COUNT(*) FROM detalle_objeto e WHERE e.objeto_id=? AND e.estado='disponible' AND NOT EXISTS(SELECT 1 FROM detalle_prestamo d WHERE d.detalle_objeto_id=e.id AND d.fecha_devolucion IS NULL)",[$o['id']])->fetchColumn();
  $o['estado']=$libres>0?'disponible':'sin_disponibilidad';
  $o['cantidad']=$o['modo_control']==='individual'?$o['cantidadTotal']:$o['stock'];
 }
 responder($filas);
}
$d=datos(); $id=$m==='POST'?idNuevo('OBJ'):texto($d,'id',40);
if($m!=='POST') existe('objetos',$id);
if($m==='DELETE') {
 $pdo->beginTransaction();consulta('SELECT id FROM objetos WHERE id=? FOR UPDATE',[$id]);
 if(consulta('SELECT d.id FROM detalle_prestamo d JOIN detalle_objeto e ON e.id=d.detalle_objeto_id WHERE e.objeto_id=? AND d.fecha_devolucion IS NULL',[$id])->fetch()) {$pdo->rollBack();responder(['error'=>'Objeto con ejemplares prestados'],409);}
 consulta('UPDATE objetos SET activo=0 WHERE id=?',[$id]);$pdo->commit();responder(['ok'=>true]);
}
$nombre=texto($d,'nombre'); $tipo=opcion($d,'tipo',['herramienta','insumo','repuesto']);
$modo=opcion($d,'modo_control',['individual','cantidad']);
$cat=texto($d,'categoria',80,false)?:'General';$ubicacion=texto($d,'ubicacion',180,false);
$unidad=texto($d,'unidad',40,false)?:null;$min=isset($d['stockMinimo'])?numero($d,'stockMinimo'):null;$notas=texto($d,'notas',5000,false);
if($m==='POST') {
 consulta('INSERT INTO objetos(id,nombre,tipo,modo_control,categoria,ubicacion,unidad,stock_actual,stock_minimo,notas) VALUES(?,?,?,?,?,?,?,?,?,?)',[$id,$nombre,$tipo,$modo,$cat,$ubicacion,$unidad,$modo==='cantidad'?0:null,$min,$notas]);responder(['id'=>$id],201);
}
$original=consulta('SELECT modo_control FROM objetos WHERE id=?',[$id])->fetchColumn();
if($original!==$modo) responder(['error'=>'El modo de control se acuerda al crear el objeto'],409);
consulta('UPDATE objetos SET nombre=?,tipo=?,categoria=?,ubicacion=?,unidad=?,stock_minimo=?,notas=? WHERE id=?',[$nombre,$tipo,$cat,$ubicacion,$unidad,$min,$notas,$id]);responder(['id'=>$id]);
