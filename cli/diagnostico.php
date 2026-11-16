<?php
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
try {
 if(!extension_loaded('pdo_mysql'))throw new RuntimeException('Falta la extensión pdo_mysql en este PHP');
 $pdo=require __DIR__.'/../privado/db.php';
 foreach(['roles','permisos','usuarios','objetos','detalle_objeto','prestamos','detalle_prestamo','movimientos_stock'] as $tabla){
  $n=$pdo->query("SELECT COUNT(*) FROM $tabla")->fetchColumn();
  echo "$tabla: accesible ($n registros)\n";
 }
 echo "Conexión y tablas OK. Comprobar después login y permisos desde Apache.\n";
} catch(Throwable $e){fwrite(STDERR,"No se pudo completar el diagnóstico. Revisar PDO MySQL, configuración local, permisos SQL y esquema.\n");exit(1);}
