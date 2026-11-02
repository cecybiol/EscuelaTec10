CREATE DATABASE escuelatec10_objetos_lab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE escuelatec10_objetos_lab;
CREATE TABLE roles (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 nombre VARCHAR(40) NOT NULL UNIQUE, descripcion VARCHAR(180) NOT NULL
) ENGINE=InnoDB;
-- Cada fila es un permiso ASIGNADO a un rol. No existe un catálogo separado.
CREATE TABLE permisos (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 rol_id INT UNSIGNED NOT NULL, codigo VARCHAR(60) NOT NULL,
 alcance ENUM('todos','propios') NOT NULL DEFAULT 'todos',
 UNIQUE(rol_id,codigo), FOREIGN KEY(rol_id) REFERENCES roles(id)
) ENGINE=InnoDB;
CREATE TABLE usuarios (
 id VARCHAR(40) PRIMARY KEY, alias VARCHAR(160) NOT NULL,
 rol_id INT UNSIGNED NOT NULL, activo TINYINT NOT NULL DEFAULT 1 CHECK(activo IN(0,1)),
 password_hash VARCHAR(255) NULL,
 FOREIGN KEY(rol_id) REFERENCES roles(id)
) ENGINE=InnoDB;
CREATE TABLE objetos (
 id VARCHAR(40) PRIMARY KEY, nombre VARCHAR(160) NOT NULL,
 tipo ENUM('herramienta','insumo','repuesto') NOT NULL,
 modo_control ENUM('individual','cantidad') NOT NULL,
 categoria VARCHAR(80) NOT NULL DEFAULT 'General', ubicacion VARCHAR(180) NOT NULL DEFAULT '',
 unidad VARCHAR(40) NULL, stock_actual DECIMAL(12,3) NULL,
 stock_minimo DECIMAL(12,3) NULL CHECK(stock_minimo >= 0),
 notas TEXT NOT NULL, activo TINYINT NOT NULL DEFAULT 1 CHECK(activo IN(0,1)),
 fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK((modo_control='individual' AND stock_actual IS NULL) OR (modo_control='cantidad' AND stock_actual IS NOT NULL AND stock_actual>=0))
) ENGINE=InnoDB;
CREATE TABLE detalle_objeto (
 id VARCHAR(40) PRIMARY KEY, objeto_id VARCHAR(40) NOT NULL,
 ubicacion VARCHAR(180) NOT NULL DEFAULT '', estado ENUM('pendiente','disponible','en_reparacion','baja') NOT NULL DEFAULT 'pendiente',
 qr VARCHAR(20) NULL, numero_serie VARCHAR(100) NULL, observaciones TEXT NOT NULL,
 FOREIGN KEY(objeto_id) REFERENCES objetos(id)
) ENGINE=InnoDB;
CREATE TABLE prestamos (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 solicitante_id VARCHAR(40) NOT NULL, operador_id VARCHAR(40) NOT NULL,
 fecha_prestamo DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, fecha_prevista DATE NOT NULL,
 observaciones TEXT NOT NULL,
 FOREIGN KEY(solicitante_id) REFERENCES usuarios(id), FOREIGN KEY(operador_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;
CREATE TABLE detalle_prestamo (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 prestamo_id BIGINT UNSIGNED NOT NULL, detalle_objeto_id VARCHAR(40) NOT NULL,
 fecha_devolucion DATETIME NULL, receptor_id VARCHAR(40) NULL,
 unidad_abierta VARCHAR(40) AS (CASE WHEN fecha_devolucion IS NULL THEN detalle_objeto_id ELSE NULL END) STORED,
 UNIQUE(unidad_abierta), UNIQUE(prestamo_id,detalle_objeto_id),
 FOREIGN KEY(prestamo_id) REFERENCES prestamos(id), FOREIGN KEY(detalle_objeto_id) REFERENCES detalle_objeto(id),
 FOREIGN KEY(receptor_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;
CREATE TABLE movimientos_stock (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, objeto_id VARCHAR(40) NOT NULL,
 tipo ENUM('ingreso','egreso') NOT NULL, cantidad DECIMAL(12,3) NOT NULL CHECK(cantidad>0),
 operador_id VARCHAR(40) NOT NULL, fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 motivo VARCHAR(180) NOT NULL,
 FOREIGN KEY(objeto_id) REFERENCES objetos(id), FOREIGN KEY(operador_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;
