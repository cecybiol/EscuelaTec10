<?php
require __DIR__.'/comun.php';$m=metodo(['GET','POST','PUT']);exigirPermiso($m==='GET'?'objetos.ver':($m==='POST'?'objetos.crear':'objetos.editar'));
if($m==='GET') responder(consulta("SELECT e.id,e.objeto_id,o.nombre,e.ubicacion,e.estado,e.qr FROM detalle_objeto e JOIN objetos o ON o.id=e.objeto_id WHERE o.activo=1 AND e.estado='disponible' AND NOT EXISTS(SELECT 1 FROM detalle_prestamo d WHERE d.detalle_objeto_id=e.id AND d.fecha_devolucion IS NULL) ORDER BY o.nombre,e.id")->fetchAll());
$d=datos();$estado=opcion($d,'estado',['pendiente','disponible','en_reparacion','baja']);
if($m==='POST') {
 $oid=texto($d,'objeto_id',40);
 if(!consulta("SELECT id FROM objetos WHERE id=? AND activo=1 AND modo_control='individual'",[$oid])->fetch()) responder(['error'=>'Se requiere un objeto individual activo'],400);
 $id=idNuevo('UNI');validarCodigoQR($d,$id);consulta('INSERT INTO detalle_objeto(id,objeto_id,ubicacion,estado,qr,numero_serie,observaciones) VALUES(?,?,?,?,?,?,?)',[$id,$oid,texto($d,'ubicacion',180,false),$estado,texto($d,'qr',20,false),texto($d,'numero_serie',100,false),texto($d,'observaciones',5000,false)]);responder(['id'=>$id],201);
}
$id=texto($d,'id',40);$pdo->beginTransaction();validarCodigoQR($d,$id);
if(!consulta('SELECT id FROM detalle_objeto WHERE id=? FOR UPDATE',[$id])->fetch()){$pdo->rollBack();responder(['error'=>'Ejemplar inexistente'],404);}
if(consulta('SELECT id FROM detalle_prestamo WHERE detalle_objeto_id=? AND fecha_devolucion IS NULL',[$id])->fetch()){$pdo->rollBack();responder(['error'=>'Primero registrar la devolución'],409);}
consulta('UPDATE detalle_objeto SET ubicacion=?,estado=?,qr=?,numero_serie=?,observaciones=? WHERE id=?',[texto($d,'ubicacion',180,false),$estado,texto($d,'qr',20,false),texto($d,'numero_serie',100,false),texto($d,'observaciones',5000,false),$id]);$pdo->commit();responder(['id'=>$id]);

function validarCodigoQR(array $d,string $id): void {
 $qr=texto($d,'qr',20,false);
 if($qr===''||in_array(mb_strtoupper_seguro($qr),['SI','SÍ','NO','FALTO','FALTÓ'],true))return;
 if(consulta('SELECT id FROM detalle_objeto WHERE (qr=? OR id=?) AND id<>? LIMIT 1',[$qr,$qr,$id])->fetch())responder(['error'=>'Este código QR ya identifica otro ejemplar'],409);
}
function mb_strtoupper_seguro(string $valor): string {return function_exists('mb_strtoupper')?mb_strtoupper($valor,'UTF-8'):strtoupper($valor);}
