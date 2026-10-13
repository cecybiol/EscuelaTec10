/**
 * storage.js — EscuelaTEC10
 * Responsable: Equipo 1 (Dashboard)
 *
 * Todavía no hay backend ni base de datos real. Los datos "viven" en localStorage,
 * y la primera vez que se abre cada página se siembran desde los archivos data/*.json.
 *
 * Todas las páginas (Herramientas, Insumos, Préstamos, Administración) deben usar
 * estas 5 funciones para leer y modificar datos, en vez de tocar localStorage directo.
 * Así, si el día de mañana cambia cómo se guardan los datos (por ejemplo, a un backend
 * real), solo hay que reescribir este archivo y el resto del proyecto sigue funcionando.
 */

// Prefijo para no chocar con otras claves que el navegador pueda tener guardadas.
const STORAGE_PREFIX = "escuelatec_";

// Carpeta data/ calculada desde la ubicación de ESTE script (js/storage.js).
// Así funciona igual desde index.html (raíz) que desde pages/*.html, y también
// si el sitio se publica en una subcarpeta (por ejemplo en GitHub Pages).
const DATA_BASE =
  typeof document !== "undefined" && document.currentScript && document.currentScript.src
    ? new URL("../data/", document.currentScript.src).href
    : "../data/";

// Nombre de cada colección → dónde está su JSON inicial de ejemplo.
const DATA_PATHS = {
  herramientas: DATA_BASE + "herramientas.json",
  insumos: DATA_BASE + "insumos.json",
  repuestos: DATA_BASE + "repuestos.json",
  usuarios: DATA_BASE + "usuarios.json",
};

// Colecciones que NO se siembran desde un JSON público (datos personales).
// Arrancan vacías y se llenan solo desde la propia aplicación.
const COLECCIONES_LOCALES = ["prestamos", "movimientos"];

// Tipos de movimiento válidos → texto para mostrar. Es la única lista: la usan
// registrarMovimiento() (para validar) y el Dashboard (para mostrar).
const TIPOS_MOVIMIENTO = {
  prestamo: "Préstamo",
  devolucion: "Devolución",
  ingreso: "Ingreso",
  egreso: "Egreso",
};

// Una sola promesa de carga para toda la página: app.js, insumos.js y
// dashboard.js pueden llamar a initStorage() y todos esperan la misma carga.
let promesaInit = null;

// Errores de la última carga (ej: un JSON que dio 404). Se consultan con getStorageErrores().
let erroresInit = [];

/**
 * Se llama al cargar cualquier página (ver app.js). Es seguro llamarla varias
 * veces: la carga real se hace UNA sola vez y todos reciben la misma promesa.
 *
 * Por cada colección: si todavía no existe en localStorage, la carga desde su JSON.
 * Si ya existe (porque el usuario ya navegó antes por el sitio), no la pisa.
 *
 * Si un JSON falla NO se guarda una lista vacía (eso hacía que un 404 pareciera
 * "inventario vacío" y nunca se reintentara). Se registra el error y se devuelve
 * en el resultado: array de errores, vacío si todo salió bien.
 */
function initStorage() {
  if (!promesaInit) promesaInit = cargarColecciones();
  return promesaInit;
}

async function cargarColecciones() {
  erroresInit = [];

  for (const nombre of COLECCIONES_LOCALES) {
    const key = STORAGE_PREFIX + nombre;
    if (localStorage.getItem(key) === null) {
      localStorage.setItem(key, JSON.stringify([]));
    }
  }

  for (const nombre of Object.keys(DATA_PATHS)) {
    const key = STORAGE_PREFIX + nombre;
    if (localStorage.getItem(key) !== null) continue;

    try {
      const respuesta = await fetch(DATA_PATHS[nombre]);
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      const datos = await respuesta.json();
      if (!Array.isArray(datos)) throw new SyntaxError("el JSON no es una lista");
      localStorage.setItem(key, JSON.stringify(datos));
    } catch (error) {
      console.error(`No se pudo inicializar "${nombre}" desde ${DATA_PATHS[nombre]}:`, error);
      // tipo: "http" (404, 500…), "json" (archivo mal formado) o "red" (sin conexión)
      const tipo = error instanceof SyntaxError ? "json" : /^HTTP/.test(error.message) ? "http" : "red";
      erroresInit.push({ coleccion: nombre, ruta: DATA_PATHS[nombre], tipo, mensaje: error.message });
    }
  }

  return erroresInit;
}

/**
 * Devuelve los errores de la última carga (array vacío si no hubo).
 * Sirve para mostrar un aviso de error en pantalla en vez de un inventario "vacío".
 */
function getStorageErrores() {
  return erroresInit;
}

/**
 * Lee una colección completa (array de objetos).
 * Devuelve [] si todavía no fue inicializada o si los datos están corruptos,
 * para que el resto del código nunca reciba undefined.
 */
function getCollection(nombre) {
  const raw = localStorage.getItem(STORAGE_PREFIX + nombre);

  if (raw === null) {
    console.warn(`getCollection("${nombre}"): todavía no se inicializó. ¿Se llamó a initStorage()?`);
    return [];
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error(`getCollection("${nombre}"): datos corruptos en localStorage.`, error);
    return [];
  }
}

/**
 * Guarda una colección completa, reemplazando lo que hubiera antes.
 * Normalmente no se usa directo — se usa a través de addItem/updateItem/deleteItem.
 *
 * Después de guardar avisa con el evento "escuelatec:cambio" (detail.coleccion),
 * así otras partes de la misma página (ej: las cards del Dashboard) pueden
 * actualizarse sin recargar. Para otras pestañas, el navegador ya dispara
 * por su cuenta el evento nativo "storage".
 */
function saveCollection(nombre, datos) {
  localStorage.setItem(STORAGE_PREFIX + nombre, JSON.stringify(datos));
  if (typeof window !== "undefined" && typeof CustomEvent === "function") {
    window.dispatchEvent(new CustomEvent("escuelatec:cambio", { detail: { coleccion: nombre } }));
  }
  return datos;
}

/**
 * Genera un id simple y único (no hace falta un backend para esto).
 */
function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Agrega un elemento nuevo a una colección y lo guarda.
 * Si el objeto no trae id, se le genera uno automáticamente.
 * Devuelve el objeto ya guardado (con su id).
 */
function addItem(nombre, item) {
  const datos = getCollection(nombre);
  const nuevoItem = { id: item.id ?? generarId(), ...item };
  datos.push(nuevoItem);
  saveCollection(nombre, datos);
  return nuevoItem;
}

/**
 * Edita un elemento existente por id. "cambios" es un objeto con solo
 * los campos que cambian (se mezcla con lo que ya tenía el item).
 * Devuelve el objeto actualizado, o null si no se encontró el id.
 */
function updateItem(nombre, id, cambios) {
  const datos = getCollection(nombre);
  const indice = datos.findIndex((item) => String(item.id) === String(id));

  if (indice === -1) {
    console.warn(`updateItem("${nombre}", ${id}): no se encontró ese id.`);
    return null;
  }

  datos[indice] = { ...datos[indice], ...cambios };
  saveCollection(nombre, datos);
  return datos[indice];
}

/**
 * Elimina un elemento por id. Devuelve true si borró algo, false si no lo encontró.
 */
function deleteItem(nombre, id) {
  const datos = getCollection(nombre);
  const datosSinItem = datos.filter((item) => String(item.id) !== String(id));
  const seElimino = datosSinItem.length !== datos.length;

  saveCollection(nombre, datosSinItem);

  if (!seElimino) {
    console.warn(`deleteItem("${nombre}", ${id}): no se encontró ese id.`);
  }
  return seElimino;
}

/**
 * Registra un movimiento para el historial de actividad reciente del Dashboard.
 * Cada módulo que cree o devuelva algo tendría que llamarla.
 *
 * Datos (un solo objeto):
 *   tipo        obligatorio: "prestamo" | "devolucion" | "ingreso" | "egreso"
 *   elemento    obligatorio: nombre de lo que se movió ("Proyector Epson")
 *   elementoId  opcional: id del elemento en su colección
 *   responsable opcional: usar el ALIAS de la persona, no nombre completo ni DNI
 *   fecha       opcional: "AAAA-MM-DD" o ISO 8601 (por defecto, ahora)
 *
 * Devuelve el movimiento guardado (con su id), o null si los datos no son válidos
 * (en ese caso no guarda nada y avisa en la consola).
 */
function registrarMovimiento({ tipo, elemento, elementoId, responsable, fecha } = {}) {
  if (!Object.keys(TIPOS_MOVIMIENTO).includes(tipo)) {
    console.warn(`registrarMovimiento: tipo inválido "${tipo}". Usar: ${Object.keys(TIPOS_MOVIMIENTO).join(", ")}.`);
    return null;
  }

  const nombre = typeof elemento === "string" ? elemento.trim() : "";
  if (!nombre) {
    console.warn("registrarMovimiento: falta el nombre del elemento.");
    return null;
  }

  const cuando = fecha === undefined ? new Date().toISOString() : fecha;
  // parseFecha() está en app.js; si no se cargó, no se puede validar la fecha
  if (typeof parseFecha === "function" && !parseFecha(cuando)) {
    console.warn(`registrarMovimiento: fecha inválida "${cuando}". Usar AAAA-MM-DD o ISO 8601.`);
    return null;
  }

  const movimiento = { tipo, elemento: nombre, fecha: cuando };
  if (elementoId !== undefined && elementoId !== null) movimiento.elementoId = elementoId;
  if (typeof responsable === "string" && responsable.trim()) movimiento.responsable = responsable.trim();

  return addItem("movimientos", movimiento);
}

/**
 * Útil durante el desarrollo: borra todo lo guardado y vuelve a sembrar
 * los datos de ejemplo la próxima vez que se recargue la página.
 * Se puede llamar a mano desde la consola: resetStorage()
 */
function resetStorage() {
  [...Object.keys(DATA_PATHS), ...COLECCIONES_LOCALES].forEach((nombre) => {
    localStorage.removeItem(STORAGE_PREFIX + nombre);
  });
  console.log("Storage reiniciado. Recargá la página para volver a sembrar los datos de ejemplo.");
}
