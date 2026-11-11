<?php
require __DIR__.'/comun.php';metodo(['POST']);$u=exigirPermiso('stock.mover');$d=datos();
$id=texto($d,'id',40);$tipo=opcion($d,'tipo',['ingreso','egreso']);$cant=numero($d,'cantidad',true);$motivo=texto($d,'motivo',180);
$pdo->beginTransaction();$o=consulta("SELECT stock_actual,unidad FROM objetos WHERE id=? AND activo=1 AND modo_control='cantidad' FOR UPDATE",[$id])->fetch();
if(!$o||!$o['unidad']){$pdo->rollBack();responder(['error'=>'Definir artículo y unidad de medida'],400);}
if($tipo==='egreso'&&$cant>(float)$o['stock_actual']){$pdo->rollBack();responder(['error'=>'Stock insuficiente'],409);}
$signo=$tipo==='ingreso'?'+':'-';consulta("UPDATE objetos SET stock_actual=stock_actual $signo ? WHERE id=?",[$cant,$id]);
consulta('INSERT INTO movimientos_stock(objeto_id,tipo,cantidad,operador_id,motivo) VALUES(?,?,?,?,?)',[$id,$tipo,$cant,$u['id'],$motivo]);
$saldo=consulta('SELECT stock_actual FROM objetos WHERE id=?',[$id])->fetchColumn();$pdo->commit();responder(['stock'=>(float)$saldo],201);
