<?php
require __DIR__.'/comun.php';metodo(['GET']);exigirPermiso('objetos.ver');
$id=texto($_GET,'id',100);
$unidad=consulta("SELECT e.*, EXISTS(SELECT 1 FROM detalle_prestamo p WHERE p.detalle_objeto_id=e.id AND p.fecha_devolucion IS NULL) AS prestado FROM detalle_objeto e JOIN objetos o ON o.id=e.objeto_id WHERE e.id=? AND o.activo=1",[$id])->fetch();
$oid=$unidad?$unidad['objeto_id']:$id;
$o=consulta('SELECT id,nombre,tipo,modo_control,categoria,ubicacion,unidad,stock_actual AS stock,stock_minimo AS stockMinimo,notas FROM objetos WHERE id=? AND activo=1',[$oid])->fetch();
if(!$o) responder(['error'=>'No se encontró un insumo o herramienta activo con ese código'],404);
$o['unidades']=consulta("SELECT e.id,e.ubicacion,e.estado,e.numero_serie,e.observaciones, EXISTS(SELECT 1 FROM detalle_prestamo p WHERE p.detalle_objeto_id=e.id AND p.fecha_devolucion IS NULL) AS prestado FROM detalle_objeto e WHERE e.objeto_id=? ORDER BY e.id",[$oid])->fetchAll();
responder(['objeto'=>$o,'ejemplar'=>$unidad?:null]);
