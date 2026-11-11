<?php
require __DIR__.'/comun.php';$m=metodo(['GET','PUT']);exigirPermiso('roles.gestionar');
$codigos=['objetos.ver','objetos.crear','objetos.editar','objetos.baja','stock.mover','prestamos.ver','prestamos.crear','prestamos.devolver','usuarios.ver','usuarios.gestionar','dashboard.ver','admin.ver','roles.gestionar','reportes.ver'];
if($m==='GET')responder(consulta('SELECT id,rol_id,codigo,alcance FROM permisos ORDER BY rol_id,codigo')->fetchAll());
$d=datos();$rid=texto($d,'rol_id',20);$lista=$d['permisos']??null;
if(!is_array($lista)||!array_is_list($lista))responder(['error'=>'Lista de permisos inválida'],400);
// Otra cuenta administradora gestiona los permisos de su rol.
if((string)usuarioActual()['rol_id']===$rid)responder(['error'=>'Usar otra cuenta administradora de otro rol para modificar este rol'],409);
$vistos=[];foreach($lista as $p){if(!is_array($p))responder(['error'=>'Permiso inválido'],400);$c=opcion($p,'codigo',$codigos);$a=opcion($p,'alcance',['todos','propios']);if($a==='propios'&&$c!=='prestamos.ver')responder(['error'=>'Propios se aplica a prestamos.ver en esta práctica'],400);if(isset($vistos[$c]))responder(['error'=>'Código duplicado'],400);$vistos[$c]=$a;}
$pdo->beginTransaction();if(!consulta('SELECT id FROM roles WHERE id=? FOR UPDATE',[$rid])->fetch()){$pdo->rollBack();responder(['error'=>'Rol inexistente'],404);}
consulta('DELETE FROM permisos WHERE rol_id=?',[$rid]);foreach($vistos as $c=>$a)consulta('INSERT INTO permisos(rol_id,codigo,alcance) VALUES(?,?,?)',[$rid,$c,$a]);$pdo->commit();responder(['ok'=>true]);
