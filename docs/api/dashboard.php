<?php
require __DIR__.'/comun.php';metodo(['GET']);exigirPermiso('dashboard.ver');
$prestamos=consulta("SELECT p.id,CASE WHEN NOT EXISTS(SELECT 1 FROM detalle_prestamo d WHERE d.prestamo_id=p.id AND d.fecha_devolucion IS NULL) THEN 'devuelto' WHEN p.fecha_prevista<CURDATE() THEN 'vencido' ELSE 'activo' END AS estado FROM prestamos p")->fetchAll();
responder([
 'herramientas'=>consulta("SELECT id FROM objetos WHERE tipo='herramienta' AND activo=1")->fetchAll(),
 'insumos'=>array_map(function($o){$o['stock']=(float)$o['stock'];$o['stockMinimo']=$o['stockMinimo']===null?null:(float)$o['stockMinimo'];return $o;},consulta("SELECT id,nombre,stock_actual AS stock,stock_minimo AS stockMinimo FROM objetos WHERE tipo='insumo' AND modo_control='cantidad' AND activo=1")->fetchAll()),
 'prestamos'=>$prestamos
]);
