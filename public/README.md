# Paquete del sitio para sincronizar

Incluye el sitio actual dentro de public y las plantillas nuevas. Consultar primero INICIO_ALUMNOS.md. Los controladores originales todavía deben integrarse por equipo: el paquete no presenta la migración de todos los módulos como terminada.

El único archivo de conexión que se comparte es privado/db.php.example. Cada entorno crea privado/db.php localmente y completa sus propios datos. .gitignore excluye ese archivo.

# EscuelaTEC10 Modelo unificado y plantillas

Acompaña la presentación EscuelaTEC10_Presentacion_9_Pasos_BD.pptx. Los comentarios y notas de la presentación amplían cada paso.

Esta versión usa objetos y detalle_objeto. No mezclar con el SQL anterior que tenía tablas separadas para herramientas, insumos y repuestos. Es material para integrar en una copia de laboratorio, no una actualización aplicada al servidor ni un reemplazo automático de todos los controladores existentes.

## Modelo y decisiones

Ocho tablas: roles, permisos, usuarios, objetos, detalle_objeto, prestamos, detalle_prestamo, movimientos_stock.

- objetos guarda campos comunes. tipo clasifica como herramienta/insumo/repuesto. modo_control define individual/cantidad. cantidad se devuelve calculada: número de ejemplares para individual y saldo stock_actual para cantidad.
- detalle_objeto representa cada ejemplar físico identificado, no una ficha de campos arbitrarios. Un consumible no necesita una fila por unidad.
- prestamos representa la entrega. detalle_prestamo representa cada ejemplar entregado y su devolución.
- movimientos_stock registra los ingresos y egresos, junto con el saldo almacenado en objetos. Cambian juntos en una transacción.
- Cada usuario tiene un rol. permisos contiene una fila por código asignado al rol, con UNIQUE(rol_id,codigo). Esto permite usar exactamente DOS tablas adicionales. Si luego se separa catálogo de permisos y asignaciones, aparecerá rol_permiso, como evolución del modelo.
- Alcance propios solo se aplica a prestamos.ver en esta práctica. Los permisos de escritura se asignan con alcance todos. Se vuelve a consultar usuario y permiso en cada petición.

## Preparación por la docente y E5

1. Verificar Apache, PHP 8.1 o superior con PDO/pdo_mysql y MariaDB/InnoDB. Preparar una copia del sitio en el servidor local, bajo el mismo origen que la API. Conservar IP y dominio ya configurados. GitHub Pages y Live Server no ejecutan PHP.
2. Con una cuenta SQL administrativa, importar sql/01_modelo.sql en una base nueva. Crea escuelatec10_objetos_lab. No repetir ni usarlo sobre producción. Luego importar sql/02_apertura.sql una sola vez.
3. Crear la cuenta de aplicación con una contraseña propia:

```sql
CREATE USER 'escuelatec_app'@'localhost' IDENTIFIED BY 'REEMPLAZAR_CLAVE_PRIVADA';
GRANT SELECT,INSERT,UPDATE,DELETE ON escuelatec10_objetos_lab.* TO 'escuelatec_app'@'localhost';
```

4. Organizar el proyecto con esta estructura. Copiar los archivos del sitio actual dentro de public/ y superponer los archivos de public/ incluidos en este paquete. No reemplazar los otros módulos ni sus recursos al copiar.

```text
escuelatec10/
  public/
    index.html
    pages/                 (incluye login.html)
    css/
    js/                    (incluye api.js y login.js)
    api/
  privado/
    db.php.example
    db.php                 (crear desde el ejemplo)
  cli/
  sql/
```

La carpeta del proyecto queda fuera de las carpetas que Apache ya publica para otros sitios. Ejemplo habitual: /var/www/escuelatec10/ cuando el sitio existente publica /var/www/html/. La docente debe verificar las rutas reales.

5. Copiar privado/db.php.example como privado/db.php y completar la clave SQL. Apache debe publicar únicamente public/, mediante la configuración del sitio o un Alias específico del proyecto. La carpeta padre, privado/, cli/ y sql/ quedan fuera del acceso web. Conservar el dominio y los otros sitios del servidor compartido.

Desde public/api/comun.php la conexión se incluye así:

```php
$pdo = require __DIR__ . '/../../privado/db.php';
```

__DIR__ indica la carpeta donde se encuentra comun.php. Los dos segmentos .. suben desde api hasta la raíz del proyecto. Desde cli/clave.php se usa __DIR__ . '/../privado/db.php'. Estas rutas no dependen de la carpeta desde la que se invoque PHP.

Ejemplo para preparar el archivo, ejecutado desde la raíz del proyecto y con la cuenta autorizada a administrar esos archivos:

```bash
cp privado/db.php.example privado/db.php
nano privado/db.php
```

Asegurar que el usuario que ejecuta PHP pueda leer privado/db.php y que las cuentas sin esa función no puedan leerlo. .gitignore excluye ese archivo con las credenciales. El ejemplo contiene solo marcadores.

6. Configurar por SSH una clave para USR-003, que ya tiene rol admin. Desde una carpeta de administración que contenga cli/, con permiso para ejecutar PHP como www-data:

```bash
read -r -s -p 'Clave de laboratorio (mínimo 12 caracteres): ' et10_clave
printf '\n'
printf '%s' "$et10_clave" | sudo -u www-data php cli/clave.php USR-003
unset et10_clave
```

El mismo comando permite configurar otra cuenta existente. No escribir la clave en argumentos, SQL o Git. Una persona sin hash puede ser solicitante, pero no iniciar sesión.
7. En index.html cambiar el destino de “Ingresar” a pages/login.html. Cada módulo debe chequear sesión antes de consultar datos.

## Archivos compartidos

api/comun.php: conexión, sesión, respuesta JSON, validaciones y permiso por código. Cada endpoint lo incluye una sola vez. api/sesion.php hace POST login, GET comprobación y DELETE logout.

js/api.js resuelve API_BASE respecto de su propio archivo. Funciona si se carga como script clásico desde cualquier página del sitio. Incluye api, iniciarSesion, comprobarSesion, puede, aplicarPermisos, cerrarSesion, listarObjetos, listarHerramientas, guardarObjeto, guardarHerramienta, eliminarObjeto, listarPrestamos, crearPrestamo, devolverUnidad, guardarUsuario, eliminarUsuario.

En los módulos, la inicialización sigue este patrón, reemplazando cargarMiPagina por la función real de cada equipo:

```js
document.addEventListener('DOMContentLoaded',async()=>{
 try {
  const sesion=await comprobarSesion();
  if(!sesion) return;
  aplicarPermisos();
  await cargarMiPagina();
 } catch(e) {showAlert(e.message,'error');}
});
```

Sustituir el listener inicial que ya existe. No dejar un segundo listener que cargue datos antes del chequeo. app.js actualmente inicializa storage: retirar esa carga al migrar, manteniendo sus funciones visuales. No cargar repositorio.js viejo junto a api.js. El HTML de herramientas también tiene un script src hacia un JSON: retirarlo, porque JSON se obtiene con fetch.

Agregar CSS compartido:

```css
[hidden] { display:none !important; }
```

Controles protegidos:

```html
<button data-permiso="objetos.crear" hidden>Nuevo objeto</button>
<section data-permiso="usuarios.gestionar" hidden>...</section>
```

Volver a aplicarPermisos después de crear botones dinámicos. Ocultar no reemplaza exigirPermiso en PHP.

## E2 Herramientas

En cargarYRenderizar quitar initStorage y conservar:

```js
const rawData=await listarHerramientas();
herramientas=rawData.map(item=>new Herramienta(item));
renderizarHerramientas();
```

Conservar la llamada existente guardarHerramienta(datosFormulario). El adaptador del paquete fija tipo herramienta y modo_control individual. Agregar sin_disponibilidad a Herramienta.ESTADOS_PERMITIDOS y su estilo. El estado físico se administra en detalle_objeto, no en el catálogo: retirar ese selector de la edición de catálogo.

Para crear ejemplares usar api('detalle_objeto',{metodo:'POST',datos:{objeto_id,estado,ubicacion,qr}}). Se necesita una pantalla o formulario de ejemplares. GET detalle_objeto devuelve solo los disponibles. El array unidades dentro de GET objetos permite revisar también pendientes o en reparación.

Para el historial reemplazar getCollection por listarPrestamos y filtrar herramientaId. Conectar un botón de baja con eliminarObjeto(id), confirmación, await y GET posterior. No se puede dar de baja un catálogo con ejemplares prestados.

## E3 Insumos y repuestos

Consultar listarObjetos('insumo') o listarObjetos('repuesto'). La API entrega stock y stockMinimo como números o null. La clase Insumo usa cantidad y umbral: adaptar esos nombres. setUmbral debe admitir null y cero, evitando el valor fijo 5 si el mínimo es desconocido. Conservar categoria y ubicacion en la instancia. Para modo individual usar un render de ejemplares, no una cantidad de stock.

Alta de un insumo:

```js
await guardarObjeto({nombre:'Cinta de prueba',tipo:'insumo',modo_control:'cantidad',unidad:'unidades',stockMinimo:2});
```

El saldo inicial es 0. Para una entrada:

```js
await api('stock',{metodo:'POST',datos:{id,tipo:'ingreso',cantidad:5,motivo:'Reposición'}});
```

Editar envía id y la ficha completa. No cambia stock directamente. DELETE realiza baja lógica. Los botones actuales editar/rellenar solo muestran avisos: incorporar los formularios y el guardado real. Las tarjetas fijas de líquidos del HTML también necesitan render con datos de la API.

## E4 Préstamos

La variable prestamos y renderizarPrestamos hoy viven dentro de DOMContentLoaded. Conservar cargarPrestamos dentro de ese mismo ámbito. Hacer async el listener inicial y quitar el array de ejemplo:

```js
async function cargarPrestamos(){
 prestamos=await listarPrestamos();
 renderizarPrestamos(prestamos);
}
```

Cambiar solicitante de texto libre por select de usuarios activos: const personas=(await api('usuarios')).filter(u=>u.activo). Cada option usa id como value y alias como texto. Cargar opciones de ejemplares desde GET detalle_objeto. Agregar fecha_prevista y selección de uno o varios IDs.

```js
await crearPrestamo({solicitante_id,fecha_prevista,unidades:idsElegidos,observaciones});
```

El servidor crea cabecera y detalles en una transacción. La respuesta GET contiene una fila por detalle con id de cabecera, detalle_id, detalle_objeto_id, solicitante, item, cantidad=1, observaciones y estado en minúsculas. Mostrar ID del ejemplar. El botón de cada fila conserva detalle_id y llama devolverUnidad(detalle_id), nunca busca por nombre de solicitante. Comparar estado con devuelto, no Devuelto. Usar textContent para datos de formularios.

## E5 Administración

En cargarUsuarios quitar lectura y retorno temprano desde localStorage. Consultar usuariosCargados=await api('usuarios'); mantener mostrarUsuarios y actualizarEstadisticas. La API hace JOIN roles y entrega rol como texto, compatible con el render existente.

Alta/edición usan guardarUsuario con alias y rol_id, más id para PUT. Las cuentas nuevas tienen password_hash=NULL. Configurar clave por CLI si necesitan acceder. Eliminar usa eliminarUsuario(id) y vuelve a consultar: es una desactivación. No generar IDs con length+1.

El selector de roles se carga desde api('roles'). Los checkbox deben tener codigo como value. api('permisos') trae asignaciones. El guardado se realiza así:

```js
await api('permisos',{metodo:'PUT',datos:{rol_id:String(rolId),permisos:[
 {codigo:'objetos.ver',alcance:'todos'},
 {codigo:'prestamos.ver',alcance:'propios'}
]}});
```

La API no permite que una cuenta cambie sus propias asignaciones de rol durante esta práctica. Admin puede cambiar operador o lector. No renombrar perfiles del selector sin acordar la misma nomenclatura en la BD. El sitio actual mezcla admin/operador/lector con Administrador/Docente/Alumno. Quitar el valor ficticio de solicitudes pendientes hasta definir ese recurso.

## E1 Dashboard

GET dashboard devuelve {herramientas,insumos,prestamos} para reutilizar calcularResumen. Una fila por cabecera de préstamo evita duplicar cuando hay varios ejemplares:

```js
const datos=await api('dashboard');
renderResumen(calcularResumen(datos));
```

Adaptar calcularResumen para que un array vacío correcto dé 0, y la tarjeta préstamos abiertos cuente activo y vencido. Las alertas usan stockMinimo null como desconocido. No mostrar “sin alertas” por falta de mínimo sin avisarlo.

Modificar renderMovimientos(movimientos), renderAlertas(insumos) y renderGraficoPrestamos(prestamos) para que reciban parámetros en lugar de leer getCollection. Obtener eventos desde api('movimientos'). En renderMovimientos usar seleccionarMovimientosRecientes y crearFilaMovimiento, ya existentes. En alertas conservar clasificarInsumos y construir el DOM actual con el array recibido. En gráfico conservar calcularDistribucionPrestamos. Sustituir actualizarPanel para pasar los arrays consultados.

La API devuelve las últimas 100 operaciones combinadas. Sus IDs proceden de tablas diferentes, por lo que no se usan como ID global de una entidad. La vista toma los primeros 5. Para ver operaciones de otra PC hay que volver a consultar. Un error HTTP debe mostrar error y no cero o datos locales antiguos.

## Contratos y comprobaciones

PUT objetos recibe ficha completa. Preservar campos del objeto seleccionado y sobrescribir solo los editados en el formulario. La API no cambia modo_control de una ficha existente, porque alterar ese modo requiere revisar los movimientos y ejemplares.

El alcance propios se aplica en SQL con el usuario de la sesión. El cliente no elige usuario_id para ver datos de otras personas. La página login dirige al Dashboard si tiene dashboard.ver y, en caso contrario, a Herramientas.

La API usa 200 para consulta/edición, 201 alta, 400 dato inválido, 401 falta sesión, 403 permiso/token, 404 inexistente, 405 método y 409 conflicto de stock, unidad ocupada o integridad.

Datos de apertura: 59 artículos (26 herramientas, 19 insumos y 14 repuestos), 56 ejemplares y 3 usuarios. HER-014 declara una unidad pero su array está vacío: no se inventó un ejemplar. Las unidades quedan pendientes para revisión. Mínimo y unidad desconocidos siguen NULL. El stock de apertura viene del JSON, sin movimientos anteriores inventados. Revisar si routers/adaptadores deben controlarse individualmente antes de uso real.

Pruebas: CRUD y recarga desde otra PC, mínimo desconocido, ingreso 5/egreso 2/rechazo de 10, préstamo simultáneo de un ejemplar, devolución parcial, segundo clic, lector sin escritura, operador sin gestión de usuarios, GET sin sesión, token incorrecto, cierre de sesión y conteo sin duplicar préstamos.

Este entorno no dispone de ejecutables PHP/MariaDB. Los endpoints y las transacciones deben ejecutarse y validarse en el servidor de laboratorio. Antes de usar:

```bash
find public/api cli -name '*.php' -exec php -l {} \;
```

Luego probar con MariaDB, no solo sintaxis. Los ejemplos HTTP se destinan a cuentas de laboratorio. Para uso real agregar HTTPS, límites de intentos de acceso, expiración de sesión, recuperación de claves y respaldos probados.
