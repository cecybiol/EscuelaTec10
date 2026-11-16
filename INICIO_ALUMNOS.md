# Inicio para los equipos

Este paquete incluye la estructura del sitio de Deploy y las plantillas para la integración con MariaDB. La carpeta public contiene el HTML, CSS, JavaScript y datos actuales, más api y el formulario de acceso. Cada equipo realiza los cambios de integración indicados en la presentación y en README.

## Archivos que se comparten

Se suben public/, sql/, cli/, privado/db.php.example, .gitignore y las guías. El archivo privado/db.php NO forma parte del paquete y NO se sube.

Después de clonar o sincronizar, la persona responsable del servidor crea el archivo local:

```bash
cp privado/db.php.example privado/db.php
nano privado/db.php
```

Allí completa host, base, usuario SQL y contraseña del entorno. El nombre de base de laboratorio del ejemplo es escuelatec10_objetos_lab. Ese archivo local queda fuera de Git. Para comprobarlo sin mostrar su contenido:

```bash
git check-ignore privado/db.php
```

Debe mostrar privado/db.php. La exclusión solo se aplica a un archivo que no esté ya versionado: no agregarlo con git add -f.

## Estructura

- public/index.html y public/pages: las páginas del sitio.
- public/css, public/js y public/assets: recursos de las páginas.
- public/api: endpoints PHP. comun.php incluye la conexión privada.
- privado/db.php.example: modelo con valores de ejemplo.
- privado/db.php: configuración local que crea la docente o responsable.
- sql: estructura y datos de apertura de laboratorio.
- cli: configuración de la contraseña de una cuenta del sitio, por terminal.

Apache publica exclusivamente public. En el navegador no se incluye public en las rutas si Apache la utiliza como raíz o destino del Alias del proyecto. La carpeta padre no se publica.

## Qué cambia cada equipo

E1: public/js/dashboard.js. Consultar dashboard.php y movimientos.php, conservando los renders.
E2: public/js/herramientas.js y su HTML. Usar api.js en lugar de repositorio.js y conectar objetos y detalle_objeto.
E3: public/js/insumos.js. Reemplazar el guardado local por objetos.php y stock.php, conservar renderizarInsumos.
E4: public/js/prestamos.js. Usar IDs reales, fechas y devolución por detalle_id.
E5: public/js/admin.js. Conectar usuarios, roles, permisos y sesión.

public/js/api.js contiene las funciones comunes. public/js/login.js conecta el formulario public/pages/login.html. El HTML original de cada módulo se conserva para que el equipo haga la integración: no se afirma que ya consulte MariaDB. Al migrar un módulo, reemplazar su carga inicial y evitar que sigan funcionando en paralelo el guardado local y el guardado en la base.

En public/js/app.js también hay una carga automática de storage: coordinar su retiro según la guía. En Herramientas, no cargar api.js y el repositorio.js anterior a la vez, porque definen funciones con los mismos nombres.

## Sincronización

Trabajar en la rama de cada equipo y revisar los cambios antes de hacer commit. La estructura de carpetas y los archivos comunes deben acordarse primero. git pull actualiza el código compartido y conserva privado/db.php porque no está versionado. Cada instalación tiene sus propias credenciales locales.

No publicar el paquete entero como raíz de Apache ni copiar privado dentro de public. La configuración de Apache y la creación de la base se realizan con la docente. Ver README para el orden de preparación y las pruebas.
