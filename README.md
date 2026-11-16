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
- Herramientas: usar el formulario original de Nueva herramienta, guardar la ficha y entrar en Ejemplares / QR para agregar unidades. Solo los revisados como **disponible** pueden prestarse. Los ejemplares pendientes del relevamiento inicial conservan su estado hasta ser revisados.
- Insumos: crear la ficha con unidad y mínimo, registrar un ingreso con motivo y después un egreso. No se edita el saldo directamente. El historial registra el operador.
- Préstamos: seleccionar solicitante, fecha y ejemplares. La devolución se registra por unidad. Un ejemplar ya prestado no se puede volver a prestar.
- Panel: consultar indicadores y movimientos. Usar Actualizar para traer cambios hechos desde otra PC. Un préstamo de dos unidades cuenta una entrega.
- Administración: crear usuarios, asignar rol y contraseña o dejarlos como solicitantes sin acceso. Permite editar, desactivar, exportar CSV y conservar permisos por rol. Para cambiar el propio usuario o permisos del propio rol debe intervenir otra cuenta administradora habilitada.

## QR

En Herramientas, abrir una ficha y elegir Ejemplares / QR para imprimir la etiqueta del catálogo o de cada unidad. En Insumos, usar el botón QR de su fila. La consulta general por QR y la salida están en el icono de perfil; en Herramientas se accede desde Sesión / consultar QR. Las nuevas etiquetas contienen `pages/qr.html?id=IDENTIFICADOR`. Al abrirlas sin sesión, el sistema pide acceso y conserva el destino.

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

Los módulos conservan el cuerpo HTML de la versión estudiantil `b7eabcb` y sus cinco hojas de estilo originales. Solo se corrigió una etiqueta mal formada del encabezado de Insumos. Las tarjetas, las tablas, los menús y los contenedores originales se completan mediante sus controladores `dashboard.js`, `herramientas.js`, `insumos.js`, `prestamos.js` y `admin.js`, conectados a `api.js`.

`bd-ui.js` contiene los adaptadores funcionales compartidos. La hoja adicional `bd-ui.css` solo da soporte a formularios nuevos de login, QR y diálogos, sin sustituir los estilos de los alumnos. Login y QR reutilizan el encabezado y los componentes originales. No cargar en paralelo `storage.js`, `repositorio.js` o JSON como scripts.

Los selectores de solicitante y ejemplares y la fecha prevista se adaptan en JavaScript sobre el formulario original de Préstamos. El estado físico corresponde a cada ejemplar; el selector de estado del catálogo muestra su disponibilidad y los cambios se hacen desde Ejemplares / QR. Las cantidades y mínimos ausentes no se inventan.

## Validación de esta entrega

28 controles HTTP pasaron con PHP 8.4 / MariaDB 11.8 en una base descartable. Incluyen login correcto e incorrecto, sesión, permisos, CSRF, CRUD, QR, saldo insuficiente, préstamo duplicado, devolución parcial y baja protegida. Las pruebas también verifican restricciones de lector y préstamos propios.

En navegador se comprobó alta de herramienta, alta de ejemplar, selección de esa unidad para préstamo, consulta del estado prestado y lectura desde una imagen QR. La revisión visual utilizó una sesión preparada solo en el entorno de QA; el login real se probó por HTTP. Esa fixture, las credenciales y la base de QA no forman parte del proyecto.

**Pendiente en el entorno escolar:** aplicar la configuración privada, comprobar el acceso real a la base existente, probar desde una segunda PC y verificar el teléfono/cámara de exposición. Esta entrega no cambia Apache ni los datos del servidor escolar a distancia.


### Comprobación de la restauración visual

Se compararon los cuerpos HTML de los cinco módulos contra `b7eabcb` y se verificó que las cinco hojas CSS originales permanecen idénticas. Se repitieron los 28 controles HTTP en la base aislada. En las pantallas originales se probaron alta de herramienta y ejemplar, préstamo y devolución, alta de insumo, ingreso de stock, búsqueda, QR, administración, gráfico y salida. La pantalla de login conserva la paleta, tipografía, encabezado y componentes del sitio estudiantil. No se requieren migraciones SQL ni cambios de credenciales para aplicar esta restauración.


### Si no se puede registrar un préstamo

La apertura inicial conserva los ejemplares como `pendiente`: no deben aparecer como disponibles sin una revisión. El formulario muestra cuántos ejemplares están pendientes, prestados, en reparación o de baja y bloquea el registro cuando no hay unidades disponibles.

Con permisos de catálogo y edición se puede usar **Revisar ejemplares pendientes** en Préstamos. Seleccionar una unidad, confirmar que se revisó y está apta, y guardar. Esa unidad queda disponible y seleccionada para el préstamo. También se puede hacer la revisión desde Herramientas → Ejemplares / QR. No se aplica un UPDATE masivo ni se cambia el estado de otras unidades.

`api/prestamos_opciones.php` requiere `prestamos.crear` y devuelve solo solicitantes activos, unidades disponibles y un resumen de disponibilidad. Así un operador puede registrar entregas sin acceso al endpoint de administración `usuarios.php` ni al catálogo general. Los campos de revisión se entregan únicamente a quien ya tiene `objetos.ver` y `objetos.editar`. El historial mantiene su permiso y alcance propios.

La fecha prevista se inicializa al día de San Luis y la cantidad se calcula según los ejemplares seleccionados. Los errores quedan visibles junto al formulario. Si la escritura se confirma pero falla una consulta posterior, se informa que el préstamo fue registrado y se ofrece Actualizar, sin sugerir repetir la entrega.

Esta corrección se verificó con 37 controles HTTP en una base aislada, incluyendo operador sin permisos de administración, revisión de una unidad, exclusión de prestadas, devolución y rechazo de duplicados. En navegador se reprodujo la apertura con 56 pendientes y cero disponibles, se revisó una unidad, se registró su préstamo y devolución y se registró otra entrega con el operador limitado. El HTML y las hojas CSS originales no cambian.


### Stock inicial y préstamo por QR de cada unidad

En Herramientas, abrir la herramienta y elegir **Stock inicial**. Ingresar el total físico, revisar la ubicación y confirmar el recuento. Al aumentar el total se crean solo los ejemplares faltantes; cada uno recibe su ID y etiqueta desde **Ejemplares / QR**. Las unidades existentes conservan sus códigos. Para reducir el total hay que seleccionar expresamente cuáles quedan de baja. Solo marcar disponibles los ejemplares revisados y aptos.

En Insumos, usar **Stock inicial** para establecer el saldo y su unidad de medida. Repetir el mismo total no suma cantidades. Cada diferencia queda auditada en movimientos con prefijo reservado `APERTURA:`. Después del primer ingreso/egreso de uso, las correcciones se hacen con movimientos normales y su motivo. Las herramientas con historial de préstamos se gestionan por ejemplar. No se requieren migraciones SQL.

En Préstamos: elegir el solicitante, escanear el QR de cada unidad, completar la fecha prevista y registrar. El campo acepta lector USB, código escrito, cámara o foto del QR. Enter agrega la unidad sin enviar el formulario. Cada lectura consulta MariaDB mediante `prestamo_qr.php`, completa nombre/ID/serie/ubicación y suma una única unidad a la selección. Las lecturas repetidas no duplican unidades; los QR de catálogo, unidades pendientes, en reparación, de baja o prestadas se rechazan. Al guardar se vuelve a validar disponibilidad dentro de la transacción.

Si una etiqueta existente contiene un código distinto al ID del ejemplar, vincularlo desde **Ejemplares / QR → Editar → Código de la etiqueta QR existente** (máximo 20 caracteres, según el esquema existente). Un código no puede vincularse a dos unidades. El préstamo acepta códigos directos y enlaces a la ficha de una unidad.

La cámara requiere HTTPS o localhost y permiso del navegador. En una PC de la red con HTTP se puede usar lector USB, introducir el código o cargar una foto. El lector y el generador de QR se sirven localmente, sin depender de una CDN.

Validación: 52 controles HTTP pasaron en PHP 8.4 y MariaDB 11.8 sobre una base descartable. Cubren apertura idempotente, recuento entero, bajas explícitas, revisión, bloqueo de apertura tras movimientos/préstamos, códigos y enlaces QR, etiquetas duplicadas, permisos limitados, préstamo y devolución. La base escolar y su configuración privada no se modificaron.

En navegador se comprobó el recuento de 2 a 3 ejemplares conservando HER-020-1 y HER-020-2, habilitación por revisión expresa, saldo de insumo con unidad de medida, bloqueo de escaneo sin solicitante, agregado de dos unidades por código y foto QR, rechazo del escaneo repetido, registro del préstamo y devolución parcial. Las cinco hojas CSS originales y el cuerpo HTML de los cinco módulos permanecen iguales a la versión estudiantil (con la corrección previa del logo de Insumos). La cámara física queda pendiente de prueba en el dispositivo de exposición.
