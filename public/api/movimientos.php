<?php
require __DIR__.'/comun.php';metodo(['GET']);exigirPermiso('dashboard.ver');
responder(consulta("SELECT * FROM (
 SELECT m.id,o.nombre AS elemento,m.tipo,u.alias AS responsable,m.fecha FROM movimientos_stock m JOIN objetos o ON o.id=m.objeto_id JOIN usuarios u ON u.id=m.operador_id
 UNION ALL SELECT d.id,o.nombre,'prestamo',u.alias,p.fecha_prestamo FROM detalle_prestamo d JOIN prestamos p ON p.id=d.prestamo_id JOIN usuarios u ON u.id=p.operador_id JOIN detalle_objeto e ON e.id=d.detalle_objeto_id JOIN objetos o ON o.id=e.objeto_id
 UNION ALL SELECT d.id,o.nombre,'devolucion',u.alias,d.fecha_devolucion FROM detalle_prestamo d JOIN usuarios u ON u.id=d.receptor_id JOIN detalle_objeto e ON e.id=d.detalle_objeto_id JOIN objetos o ON o.id=e.objeto_id WHERE d.fecha_devolucion IS NOT NULL
) eventos ORDER BY fecha DESC LIMIT 100")->fetchAll());
