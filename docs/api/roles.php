<?php
require __DIR__.'/comun.php';metodo(['GET']);exigirPermiso('usuarios.gestionar');responder(consulta('SELECT id,nombre,descripcion FROM roles ORDER BY id')->fetchAll());
