<?php
// Compatibility entry point. Private values live in ignored config.local.php or environment.
$configFile=__DIR__.'/config.local.php';
$c=is_file($configFile) ? require $configFile : [];
$host=getenv('ET10_DB_HOST') ?: ($c['host'] ?? '127.0.0.1');
$port=getenv('ET10_DB_PORT') ?: ($c['port'] ?? '3306');
$db=getenv('ET10_DB_NAME') ?: ($c['database'] ?? 'escuelatec10_objetos_lab');
$user=getenv('ET10_DB_USER') ?: ($c['user'] ?? '');
$password=getenv('ET10_DB_PASSWORD') ?: ($c['password'] ?? '');
if ($user==='') throw new RuntimeException('Configurar privado/config.local.php o ET10_DB_USER');
return new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4",$user,$password,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
