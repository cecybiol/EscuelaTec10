<?php
require __DIR__.'/comun.php';$m=metodo(['GET','POST','PUT','DELETE']);exigirPermiso($m==='GET'?'usuarios.ver':'usuarios.gestionar');
if($m==='GET') {
 $filas=consulta('SELECT u.id,u.alias,u.rol_id,r.nombre AS rol,u.activo FROM usuarios u JOIN roles r ON r.id=u.rol_id ORDER BY u.alias')->fetchAll();
 foreach($filas as &$f)$f['activo']=(bool)$f['activo'];responder($filas);
}
$d=datos();$id=$m==='POST'?idNuevo('USR'):texto($d,'id',40);
if($m!=='POST'){existe('usuarios',$id);if($id===$_SESSION['usuario_id'])responder(['error'=>'Otra cuenta administradora debe modificar este usuario'],409);}
if($m==='DELETE'){consulta('UPDATE usuarios SET activo=0 WHERE id=?',[$id]);responder(['ok'=>true]);}
$alias=texto($d,'alias');$rol=texto($d,'rol_id',20);
if(!consulta('SELECT id FROM roles WHERE id=?',[$rol])->fetch())responder(['error'=>'Rol inexistente'],400);
if($m==='POST'){consulta('INSERT INTO usuarios(id,alias,rol_id) VALUES(?,?,?)',[$id,$alias,$rol]);responder(['id'=>$id],201);}
consulta('UPDATE usuarios SET alias=?,rol_id=? WHERE id=?',[$alias,$rol,$id]);responder(['id'=>$id]);
