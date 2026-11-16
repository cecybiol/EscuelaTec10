<?php
// Todas las respuestas de la API tienen formato JSON.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
ini_set('display_errors', '0');
set_exception_handler(function(Throwable $e) {
 global $pdo;
 if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
 error_log((string)$e);
 $status = $e instanceof PDOException && $e->getCode()==='23000' ? 409 : 500;
 responder(['error'=>$status===409 ? 'El registro ya existe o tiene relaciones que lo impiden' : 'Error del servidor. Revisar el registro de PHP'], $status);
});
session_set_cookie_params(['httponly'=>true,'samesite'=>'Strict','secure'=>!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS']!=='off']);
session_start();
$pdo = require __DIR__ . '/../../privado/db.php';
// Fechas de las operaciones expresadas en hora de San Luis.
$pdo->exec("SET time_zone='-03:00'");
function responder($datos, int $estado=200): never {
 http_response_code($estado);
 echo json_encode($datos, JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR); exit;
}
function datos(): array {
 try { $d=json_decode(file_get_contents('php://input'),true,512,JSON_THROW_ON_ERROR); }
 catch(JsonException $e) { responder(['error'=>'JSON inválido'],400); }
 if (!is_array($d) || array_is_list($d)) responder(['error'=>'Se espera un objeto JSON'],400);
 return $d;
}
function texto(array $d, string $k, int $max=160, bool $obligatorio=true): string {
 $v=$d[$k]??'';
 if (!is_string($v)) responder(['error'=>"Campo inválido: $k"],400);
 $v=trim($v);
 if (($obligatorio && $v==='') || preg_match_all('/./us',$v)>$max) responder(['error'=>"Revisar campo: $k"],400);
 return $v;
}
function opcion(array $d,string $k,array $opciones): string {
 $v=texto($d,$k); if (!in_array($v,$opciones,true)) responder(['error'=>"Opción inválida: $k"],400); return $v;
}
function numero(array $d,string $k,bool $positivo=false): float {
 $v=$d[$k]??null;
 if (!is_numeric($v) || !is_finite((float)$v) || (float)$v<0 || ($positivo && (float)$v<=0) || (float)$v>999999999.999 || abs(round((float)$v,3)-(float)$v)>0.0000001)
  responder(['error'=>"Cantidad inválida: $k"],400);
 return (float)$v;
}
function consulta(string $sql,array $p=[]): PDOStatement {
 global $pdo; $s=$pdo->prepare($sql); $s->execute($p); return $s;
}
function usuarioActual(): array {
 $u=consulta('SELECT u.id,u.alias,u.rol_id,r.nombre AS rol FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE u.id=? AND u.activo=1',[$_SESSION['usuario_id']??''])->fetch();
 if (!$u) responder(['error'=>'Iniciar sesión'],401);
 return $u;
}
function exigirPermiso(string $codigo): array {
 $u=usuarioActual();
 $p=consulta('SELECT alcance FROM permisos WHERE rol_id=? AND codigo=?',[$u['rol_id'],$codigo])->fetch();
 if (!$p) responder(['error'=>'Sin permiso'],403);
 if ($_SERVER['REQUEST_METHOD']!=='GET' && !hash_equals($_SESSION['csrf']??'',$_SERVER['HTTP_X_CSRF_TOKEN']??'')) responder(['error'=>'Token inválido'],403);
 $u['alcance']=$p['alcance']; return $u;
}
function permisosActuales(array $u): array {
 return consulta('SELECT codigo,alcance FROM permisos WHERE rol_id=?',[$u['rol_id']])->fetchAll();
}
function metodo(array $permitidos): string {
 $m=$_SERVER['REQUEST_METHOD'];
 if (!in_array($m,$permitidos,true)) {header('Allow: '.implode(', ',$permitidos)); responder(['error'=>'Método no permitido'],405);}
 return $m;
}
function existe(string $tabla,string $id): void {
 // tabla siempre proviene de constantes del servidor.
 if (!consulta("SELECT id FROM $tabla WHERE id=? AND activo=1",[$id])->fetch()) responder(['error'=>'Registro no encontrado'],404);
}
function idNuevo(string $prefijo): string {return $prefijo.'-'.bin2hex(random_bytes(8));}
