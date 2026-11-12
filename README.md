# EscuelaTEC10 · Inventario del taller

Versión integrada para PHP 8.1 o superior y MariaDB/MySQL con PDO MySQL. El navegador usa exclusivamente la API del mismo servidor para los datos del inventario. No necesita Internet para cargar los módulos ni para generar/decodificar QR.

## Puesta en marcha en el servidor escolar

1. Antes de actualizar, respaldar la base y conservar la configuración privada actual **fuera del repositorio y de la carpeta publicada**. El antiguo `privado/db.php` estaba versionado; esta actualización lo convierte en un cargador sin credenciales.
2. Actualizar la rama `Deploy` y conservar la base existente. **No volver a importar los SQL de apertura.**
3. Copiar `privado/config.local.php.example` como `privado/config.local.php` y completar host, puerto, nombre de base, usuario SQL y contraseña del servidor. Para XAMPP comprobar el puerto real de su MariaDB. La cuenta necesita SELECT, INSERT, UPDATE y DELETE sobre la base del inventario. El archivo está excluido de Git.
4. Verificar que PHP tenga `PDO` y `pdo_mysql`. Puede usarse el PHP de XAMPP, por ejemplo `/opt/lampp/bin/php` si esa es su instalación.
5. El VirtualHost o Alias de Apache debe publicar **solo `docs/`**. Conservar el dominio, otros sitios y manejador de PHP existentes. No publicar la raíz del repositorio. Ejemplo de rutas, a adaptar:

```apache
DocumentRoot /var/www/EscuelaTec10/docs
<Directory /var/www/EscuelaTec10/docs>
    Options -Indexes
    AllowOverride None
    Require all granted
</Directory>
```

Ejecutar `apache2ctl configtest` y recargar Apache solo si responde `Syntax OK`. En XAMPP aplicar el cambio mediante su Apache, sin iniciar otro servidor sobre el mismo puerto.

6. Ejecutar `php cli/diagnostico.php`. Comprueba conexión y las ocho tablas; no modifica registros ni muestra contraseñas.
7. Las cuentas SQL y las cuentas del sitio son distintas. Elegir un administrador activo de `usuarios` y configurar su contraseña por terminal:

```bash
read -r -s -p 'Contraseña del sitio (mínimo 12 caracteres): ' et10_clave
printf '\n'
printf '%s' "$et10_clave" | php cli/clave.php USR-003
unset et10_clave
```

`USR-003` es la cuenta del SQL de laboratorio; reemplazar por el ID real si la base escolar usa otro. Ejecutar con una cuenta que pueda leer la configuración privada. No hay contraseña predeterminada en el código. Después del primer acceso pueden crearse usuarios y claves desde Administración.

8. Abrir `http://DIRECCION_DEL_SERVIDOR/pages/login.html`. Ingresar por ID o por alias exacto. Si hay alias duplicados, usar el ID. Consultar `api/conexion.php` con sesión: debe devolver `{"ok":true}`.

## Recorrido para la exposición

- Iniciar sesión con una cuenta del sitio. El menú muestra los módulos permitidos.
- Herramientas: crear una ficha, entrar en Ver / QR y agregar uno o más ejemplares. Solo los revisados como **disponible** pueden prestarse. Los ejemplares pendientes del relevamiento inicial conservan su estado hasta ser revisados.
- Insumos: crear la ficha con unidad y mínimo, registrar un ingreso con motivo y después un egreso. No se edita el saldo directamente. El historial registra el operador.
- Préstamos: seleccionar solicitante, fecha y ejemplares. La devolución se registra por unidad. Un ejemplar ya prestado no se puede volver a prestar.
- Panel: consultar indicadores y movimientos. Usar Actualizar para traer cambios hechos desde otra PC. Un préstamo de dos unidades cuenta una entrega.
- Administración: crear usuarios, asignar rol y contraseña o dejarlos como solicitantes sin acceso. Permite editar, desactivar, exportar CSV y conservar permisos por rol. Para cambiar el propio usuario o permisos del propio rol debe intervenir otra cuenta administradora habilitada.

## QR

Desde Ver / QR se imprime la etiqueta del catálogo o de cada ejemplar. Las nuevas etiquetas contienen `pages/qr.html?id=IDENTIFICADOR`. Al abrirlas sin sesión, el sistema pide acceso y conserva el destino.

**Generar las etiquetas desde la dirección definitiva del servidor accesible por los teléfonos**, por ejemplo su IP de la red escolar o un nombre que los celulares resuelvan. No imprimir enlaces con `localhost` o `127.0.0.1`, que en otro dispositivo apuntan al propio teléfono.

El módulo Consultar QR permite:

- Cámara del navegador cuando el sitio usa HTTPS válido o localhost y el usuario concede acceso.
- Cargar una imagen/foto del QR, también en HTTP.
- Ingresar el código o pegar el enlace manualmente.
- Escanear con la cámara propia del teléfono para abrir directamente el enlace de una etiqueta en la red escolar.

En HTTP por IP local los navegadores de celulares suelen impedir la cámara **dentro de la página**. La consulta por enlace, imagen y código continúa disponible. No hay que conceder permisos de cámara si se usa una de esas opciones. La cámara física debe probarse en el dispositivo de exposición.

Los valores históricos `SI` y `FALTO` del campo `qr` indican relevamiento y no identifican objetos. Las etiquetas nuevas usan el ID único. Verificar el contenido de los QR físicos anteriores antes de reutilizarlos.

## Estructura y datos

- `docs/`: única carpeta publicada; HTML, CSS, JS, bibliotecas locales y endpoints PHP.
- `privado/db.php`: cargador de conexión sin credenciales.
- `privado/config.local.php`: credenciales locales, no versionadas. Alternativa: variables de entorno `ET10_DB_HOST`, `ET10_DB_PORT`, `ET10_DB_NAME`, `ET10_DB_USER`, `ET10_DB_PASSWORD`.
- `cli/`: diagnóstico y configuración de contraseña, fuera del acceso web.
- `privado/sql/`: modelo y datos de apertura para una **base nueva**.
- `tests/http_integration.py`: aceptación contra una base aislada. Crea registros y no debe ejecutarse sobre la base escolar.

Las ocho tablas son roles, permisos, usuarios, objetos, detalle_objeto, prestamos, detalle_prestamo y movimientos_stock. La API devuelve campos compatibles con ese modelo, usa sesiones PHP y tokens CSRF y rechaza operaciones sin permiso.

El SQL de apertura corrige ocho filas por cantidad cuyo saldo NULL violaba el esquema: utiliza cero de apertura y una nota de relevamiento pendiente. Esto no afirma que no existan unidades físicas. No aplicar automáticamente esa apertura a la base existente.

Los controladores JS anteriores se conservan como historial del trabajo estudiantil, pero las páginas integradas cargan `js/api.js` y `js/gestion.js`. No volver a cargar en paralelo `storage.js`, `repositorio.js` o JSON como scripts.

## Validación de esta entrega

28 controles HTTP pasaron con PHP 8.4 / MariaDB 11.8 en una base descartable. Incluyen login correcto e incorrecto, sesión, permisos, CSRF, CRUD, QR, saldo insuficiente, préstamo duplicado, devolución parcial y baja protegida. Las pruebas también verifican restricciones de lector y préstamos propios.

En navegador se comprobó alta de herramienta, alta de ejemplar, selección de esa unidad para préstamo, consulta del estado prestado y lectura desde una imagen QR. La revisión visual utilizó una sesión preparada solo en el entorno de QA; el login real se probó por HTTP. Esa fixture, las credenciales y la base de QA no forman parte del proyecto.

**Pendiente en el entorno escolar:** aplicar la configuración privada, comprobar el acceso real a la base existente, probar desde una segunda PC y verificar el teléfono/cámara de exposición. Esta entrega no cambia Apache ni los datos del servidor escolar a distancia.
