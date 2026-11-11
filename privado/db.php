<?php
// Copiar como db.php dentro de esta carpeta privado, junto a public.
// Apache publica solo public. No subir privado/db.php a Git.
return new PDO(
 'mysql:host=192.168.112.128;dbname=inventario;charset=utf8mb4',
 'root', '2026guemes',
 [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
  PDO::ATTR_EMULATE_PREPARES=>false]
);
