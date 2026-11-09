<?php
// Ejecutar por SSH, fuera del directorio público. La clave se lee por stdin.
if (PHP_SAPI!=='cli') {http_response_code(404);exit;}
$pdo=require __DIR__ . '/../privado/db.php';
$id=$argv[1]??''; $clave=rtrim(stream_get_contents(STDIN),"\r\n");
if ($id==='' || strlen($clave)<12) exit("Uso: leer clave por stdin, al menos 12 caracteres; indicar ID existente\n");
$s=$pdo->prepare('UPDATE usuarios SET password_hash=? WHERE id=?');
$s->execute([password_hash($clave,PASSWORD_DEFAULT),$id]);
echo $s->rowCount() ? "Clave configurada\n" : "ID no encontrado\n";
