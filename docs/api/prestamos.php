<?php
require __DIR__.'/comun.php';
$m=metodo(['GET','POST','PUT']); $u=exigirPermiso($m==='GET'?'prestamos.ver':($m==='POST'?'prestamos.crear':'prestamos.devolver'));
if ($m==='GET') {
 // Una fila por ejemplar. Devuelve IDs para que el botón actúe sobre la fila correcta.
 $filtro=$u['alcance']==='propios'?' WHERE p.solicitante_id=?':'';
 $parametros=$u['alcance']==='propios'?[$u['id']]:[];
 $filas=consulta("SELECT p.id,p.solicitante_id,s.alias AS solicitante,h.nombre AS item,h.id AS herramientaId,
 d.id AS detalle_id,d.detalle_objeto_id,1 AS cantidad,p.observaciones,
 p.fecha_prestamo AS fechaPrestamo,p.fecha_prevista AS fechaPrevista,d.fecha_devolucion AS fechaDevolucion,
 CASE WHEN d.fecha_devolucion IS NOT NULL THEN 'devuelto' WHEN p.fecha_prevista<CURDATE() THEN 'vencido' ELSE 'activo' END AS estado
 FROM prestamos p JOIN usuarios s ON s.id=p.solicitante_id JOIN detalle_prestamo d ON d.prestamo_id=p.id
 JOIN detalle_objeto u ON u.id=d.detalle_objeto_id JOIN objetos h ON h.id=u.objeto_id {$filtro} ORDER BY p.id DESC,d.id",$parametros)->fetchAll();
 responder($filas);
}
$d=datos();
if ($m==='PUT') {
 $id=texto($d,'detalle_id',40);
 // Solo actualiza si aún estaba abierto. Un segundo clic no duplica la devolución.
 $n=consulta('UPDATE detalle_prestamo SET fecha_devolucion=NOW(),receptor_id=? WHERE id=? AND fecha_devolucion IS NULL',[$u['id'],$id])->rowCount();
 if (!$n) responder(['error'=>'Detalle inexistente o ya devuelto'],409);
 responder(['ok'=>true]);
}
$sid=texto($d,'solicitante_id',40); $fecha=texto($d,'fecha_prevista',10); $notas=texto($d,'observaciones',5000,false);
$dt=DateTimeImmutable::createFromFormat('!Y-m-d',$fecha,new DateTimeZone('America/Argentina/San_Luis'));
if (!$dt || $dt->format('Y-m-d')!==$fecha || $fecha<(new DateTimeImmutable('now',new DateTimeZone('America/Argentina/San_Luis')))->format('Y-m-d')) responder(['error'=>'Fecha prevista inválida'],400);
$ids=$d['unidades']??null;
if (!is_array($ids) || !array_is_list($ids) || count($ids)<1 || count($ids)>100) responder(['error'=>'Seleccionar entre 1 y 100 unidades'],400);
foreach($ids as $id) if(!is_string($id)||strlen($id)>40||$id==='') responder(['error'=>'ID de unidad inválido'],400);
if(count(array_unique($ids))!==count($ids)) responder(['error'=>'Unidad repetida'],400);
sort($ids); $pdo->beginTransaction();
if (!consulta('SELECT id FROM usuarios WHERE id=? AND activo=1 FOR UPDATE',[$sid])->fetch()) {$pdo->rollBack(); responder(['error'=>'Solicitante inactivo o inexistente'],409);}
foreach($ids as $id) {
 $unidad=consulta("SELECT u.id FROM detalle_objeto u JOIN objetos h ON h.id=u.objeto_id WHERE u.id=? AND u.estado='disponible' AND h.activo=1 FOR UPDATE",[$id])->fetch();
 if (!$unidad || consulta('SELECT id FROM detalle_prestamo WHERE detalle_objeto_id=? AND fecha_devolucion IS NULL',[$id])->fetch()) {$pdo->rollBack(); responder(['error'=>'Unidad no disponible: '.$id],409);}
}
consulta('INSERT INTO prestamos(solicitante_id,operador_id,fecha_prevista,observaciones) VALUES(?,?,?,?)',[$sid,$u['id'],$fecha,$notas]); $pid=$pdo->lastInsertId();
foreach($ids as $id) consulta('INSERT INTO detalle_prestamo(prestamo_id,detalle_objeto_id) VALUES(?,?)',[$pid,$id]);
$pdo->commit(); responder(['id'=>$pid],201);
