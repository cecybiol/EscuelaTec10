<?php
require __DIR__.'/comun.php'; metodo(['GET']); usuarioActual(); responder(['ok'=>(int)consulta('SELECT 1')->fetchColumn()===1]);
