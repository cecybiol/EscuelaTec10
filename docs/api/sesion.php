<?php
require __DIR__.'/comun.php';
$m=metodo(['GET','POST','DELETE']);
if ($m==='DELETE') {
 usuarioActual();
 if (!hash_equals($_SESSION['csrf']??'',$_SERVER['HTTP_X_CSRF_TOKEN']??'')) responder(['error'=>'Token inválido'],403);
 $_SESSION=[]; session_destroy(); responder(['ok'=>true]);
}
if ($m==='POST') {
 $d=datos(); $id=texto($d,'id',40); $clave=$d['clave']??null;
 if (!is_string($clave)||strlen($clave)>200) responder(['error'=>'Clave inválida'],400);
 $fila=consulta('SELECT id,password_hash FROM usuarios WHERE id=? AND activo=1',[$id])->fetch();
 if (!$fila || !$fila['password_hash'] || !password_verify($clave,$fila['password_hash'])) responder(['error'=>'Credenciales inválidas'],401);
 session_regenerate_id(true); $_SESSION['usuario_id']=$fila['id']; $_SESSION['csrf']=bin2hex(random_bytes(32));
}
$u=usuarioActual(); responder(['usuario'=>$u,'permisos'=>permisosActuales($u),'csrf'=>$_SESSION['csrf']]);
