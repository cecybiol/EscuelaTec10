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

// Nombre de cada colección → dónde está su JSON inicial de ejemplo.
// Las rutas son relativas a pages/*.html (por eso empiezan con "../").
const DATA_PATHS = {
  herramientas: "../data/herramientas.json",
  insumos: "../data/insumos.json",
  prestamos: "../data/prestamos.json",
  usuarios: "../data/usuarios.json",
};

/**
 * Se llama UNA vez al cargar cualquier página (ver app.js).
 * Por cada colección: si todavía no existe en localStorage, la carga desde su JSON.
 * Si ya existe (porque el usuario ya navegó antes por el sitio), no la pisa.
 */
async function initStorage() {
  const nombres = Object.keys(DATA_PATHS);

  for (const nombre of nombres) {
    const key = STORAGE_PREFIX + nombre;
    const yaExiste = localStorage.getItem(key) !== null;
    if (yaExiste) continue;

    try {
      const respuesta = await fetch(DATA_PATHS[nombre]);
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      const datos = await respuesta.json();
      localStorage.setItem(key, JSON.stringify(datos));
    } catch (error) {
      // Si el JSON no se pudo cargar (archivo faltante, error de red, etc.),
      // arrancamos esa colección vacía en vez de romper toda la página.
      console.error(`No se pudo inicializar "${nombre}" desde ${DATA_PATHS[nombre]}:`, error);
      localStorage.setItem(key, JSON.stringify([]));
    }
  }
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
 */
function saveCollection(nombre, datos) {
  localStorage.setItem(STORAGE_PREFIX + nombre, JSON.stringify(datos));
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
 * Útil durante el desarrollo: borra todo lo guardado y vuelve a sembrar
 * los datos de ejemplo la próxima vez que se recargue la página.
 * Se puede llamar a mano desde la consola: resetStorage()
 */
function resetStorage() {
  Object.keys(DATA_PATHS).forEach((nombre) => {
    localStorage.removeItem(STORAGE_PREFIX + nombre);
  });
  console.log("Storage reiniciado. Recargá la página para volver a sembrar los datos de ejemplo.");
}
/**
 * Busca un ítem por su ID dentro de cualquier colección (herramientas, insumos, etc.)
 * @param {string} nombreColeccion Nombre de la colección ('herramientas', 'prestamos', etc.)
 * @param {string|number} id ID del ítem a buscar
 * @returns {Object|null} Objeto encontrado o null si no existe
 */
function buscarPorId(nombreColeccion, id) {
  if (!id) return null;
  const coleccion = getCollection(nombreColeccion);
  return coleccion.find(item => String(item.id) === String(id) || String(item.codigo) === String(id)) || null;
}

/**
 * Registra un movimiento de préstamo y emite la actualización para mantener el ID estable.
 * @param {Object} datosPrestamo { herramientaId, usuario, fechaPrestamo, ... }
 */
function registrarMovimientoPrestamo(datosPrestamo) {
  if (!datosPrestamo.herramientaId) {
    console.error("No se puede registrar préstamo sin herramientaId");
    return null;
  }

  // 1. Guardar el préstamo usando el ID de la herramienta
  const nuevoPrestamo = addItem("prestamos", {
    ...datosPrestamo,
    fechaPrestamo: datosPrestamo.fechaPrestamo || new Date().toISOString(),
    devuelto: false
  });

  // 2. Actualizar el estado de la herramienta a 'en_uso' para sincronizar con Catálogo y Dashboard
  const herramienta = buscarPorId("herramientas", datosPrestamo.herramientaId);
  if (herramienta) {
    updateItem("herramientas", herramienta.id, { estado: "en_uso" });
  }

  return nuevoPrestamo;
}