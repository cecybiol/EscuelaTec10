<?php
require __DIR__.'/comun.php';metodo(['GET']);exigirPermiso('prestamos.crear');
$codigo=texto($_GET,'codigo',2048);
// Las etiquetas pueden contener el ID directamente o el enlace de una ficha de ejemplar.
if(preg_match('~^https?://~i',$codigo)){
 $url=parse_url($codigo);$query=[];parse_str($url['query']??'',$query);
 $extraido=$query['id']??$query['ejemplar_id']??$query['unidad']??$query['codigo']??null;
 if(!is_string($extraido)||$extraido==='')responder(['error'=>'El enlace QR no identifica un ejemplar. Vinculá su código en Herramientas → Ejemplares / QR'],400);
 $codigo=trim($extraido);
}
if(strlen($codigo)>160)responder(['error'=>'Código QR no reconocido'],400);
$filas=consulta("SELECT e.id,e.objeto_id,o.nombre,e.ubicacion,e.estado,e.numero_serie,
 EXISTS(SELECT 1 FROM detalle_prestamo d WHERE d.detalle_objeto_id=e.id AND d.fecha_devolucion IS NULL) AS prestado
 FROM detalle_objeto e JOIN objetos o ON o.id=e.objeto_id
 WHERE o.activo=1 AND o.modo_control='individual' AND
 (e.id=? OR (e.qr=? AND UPPER(TRIM(e.qr)) NOT IN ('SI','SÍ','NO','FALTO','FALTÓ'))) LIMIT 2",[$codigo,$codigo])->fetchAll();
if(count($filas)>1)responder(['error'=>'Código asociado a más de un ejemplar. Corregir la vinculación QR antes de prestar'],409);
if(!$filas){
 if(consulta('SELECT id FROM objetos WHERE id=? AND activo=1',[$codigo])->fetch())responder(['error'=>'Este QR identifica el catálogo. Escaneá el QR de la unidad física que se presta'],409);
 responder(['error'=>'No se encontró un ejemplar con ese QR. Verificá su ID o vinculá la etiqueta en Herramientas → Ejemplares / QR'],404);
}
$e=$filas[0];
if((int)$e['prestado']===1)responder(['error'=>'El ejemplar '.$e['id'].' ya está prestado. Registrar su devolución antes de volver a entregarlo'],409);
if($e['estado']!=='disponible')responder(['error'=>'El ejemplar '.$e['id'].' está '.$e['estado'].'. Debe revisarse y estar disponible antes del préstamo'],409);
responder(['ejemplar'=>['id'=>$e['id'],'objeto_id'=>$e['objeto_id'],'nombre'=>$e['nombre'],'ubicacion'=>$e['ubicacion'],'numero_serie'=>$e['numero_serie']]]);
