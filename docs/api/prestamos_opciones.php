<?php
// Datos mínimos necesarios para registrar un préstamo, sin exponer gestión de usuarios.
require __DIR__.'/comun.php';
metodo(['GET']);
$operador=exigirPermiso('prestamos.crear');
$solicitantes=consulta('SELECT id,alias FROM usuarios WHERE activo=1 ORDER BY alias,id')->fetchAll();
$ejemplares=consulta("SELECT e.id,e.objeto_id,o.nombre,e.ubicacion,e.estado,e.qr,e.numero_serie,e.observaciones,
 EXISTS(SELECT 1 FROM detalle_prestamo d WHERE d.detalle_objeto_id=e.id AND d.fecha_devolucion IS NULL) AS prestado
 FROM detalle_objeto e JOIN objetos o ON o.id=e.objeto_id
 WHERE o.activo=1 AND o.modo_control='individual' ORDER BY o.nombre,e.id")->fetchAll();
$puedeRevisar=(int)consulta("SELECT COUNT(DISTINCT codigo) FROM permisos WHERE rol_id=? AND codigo IN ('objetos.ver','objetos.editar')",[$operador['rol_id']])->fetchColumn()===2;
$diagnostico=['catalogos'=>(int)consulta("SELECT COUNT(*) FROM objetos WHERE activo=1 AND modo_control='individual'")->fetchColumn(),
 'ejemplares'=>count($ejemplares),'disponibles'=>0,'prestados'=>0,'pendientes'=>0,'en_reparacion'=>0,'baja'=>0];
$disponibles=[];$revision=[];
foreach($ejemplares as $e){
 if((int)$e['prestado']===1){$diagnostico['prestados']++;continue;}
 if($e['estado']==='disponible'){
  $diagnostico['disponibles']++;
  $disponibles[]=['id'=>$e['id'],'objeto_id'=>$e['objeto_id'],'nombre'=>$e['nombre'],'ubicacion'=>$e['ubicacion']];
 }else{
  $clave=$e['estado']==='pendiente'?'pendientes':$e['estado'];
  if(isset($diagnostico[$clave]))$diagnostico[$clave]++;
  // Solo un usuario con permiso de catálogo y edición recibe los campos de revisión.
  if($puedeRevisar && $e['estado']==='pendiente' && count($revision)<100){unset($e['prestado']);$revision[]=$e;}
 }
}
responder(['solicitantes'=>$solicitantes,'unidades'=>$disponibles,'diagnostico'=>$diagnostico,'revision'=>$revision]);
