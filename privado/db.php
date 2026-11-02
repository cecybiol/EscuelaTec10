<?php
// Copiar como db.php dentro de esta carpeta privado, junto a public.
// Apache publica solo public. No subir privado/db.php a Git.
return new PDO(
 'mysql:host=localhost;dbname=escuelatec10_objetos_lab;charset=utf8mb4',
 'root', 'root1234',
 [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
  PDO::ATTR_EMULATE_PREPARES=>false]
);
