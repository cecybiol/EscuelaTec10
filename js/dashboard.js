/**
 * dashboard.js — EscuelaTEC10
 * Responsable: Equipo 1 (Dashboard)
 *
 * Lógica específica de pages/dashboard.html.
 * Se carga después de storage.js y app.js (ahí están las funciones
 * compartidas, como showAlert()).
 */

document.addEventListener("DOMContentLoaded", async () => {
  initTeclaEspacioEnCards();
  initBotonAlertas();
  await cargarDatos();
});

// ---------------------------------------------------------------------------
// Estado de carga y error de datos (E1-09)
// ---------------------------------------------------------------------------

const NOMBRES_COLECCION = {
  herramientas: "Herramientas",
  insumos: "Insumos",
  repuestos: "Repuestos",
  usuarios: "Usuarios",
  prestamos: "Préstamos",
};

/**
 * Espera la carga de storage.js y avisa en pantalla si algo falló.
 * Un fallo (404, JSON inválido, sin red) NO se muestra como "0 registros":
 * las cards afectadas muestran "—" y hay un aviso con botón para reintentar.
 */
async function cargarDatos() {
  mostrarEstado("info", "Cargando datos…");

  let errores;
  try {
    // initStorage() devuelve la lista de errores de la carga (vacía si todo salió bien)
    errores = await initStorage();
  } catch (error) {
    console.error("No se pudo inicializar el almacenamiento:", error);
    errores = [{ coleccion: "todas", tipo: "red", mensaje: error.message }];
  }

  // Las colecciones que no se pudieron cargar dan indicadores en "—", nunca en 0
  coleccionesFallidas = new Set((errores || []).map((e) => e.coleccion));
  actualizarPanel();
  suscribirCambios();

  if (!errores || errores.length === 0) {
    limpiarEstado();
    return;
  }

  const detalle = errores.map(describirError).join("; ");
  mostrarEstado(
    "error",
    `No se pudieron cargar los datos de: ${detalle}. ` +
      'Los totales afectados se muestran como "—" para no confundirlos con cero.',
    true
  );
}

function describirError(error) {
  const nombre = NOMBRES_COLECCION[error.coleccion] || "los datos";
  if (error.tipo === "http") return `${nombre} (no se encontró el archivo: ${error.mensaje})`;
  if (error.tipo === "json") return `${nombre} (el archivo no tiene un formato válido)`;
  return `${nombre} (sin conexión o archivo inaccesible)`;
}

/**
 * Escribe un mensaje en el contenedor accesible #estado-datos (role="status").
 * tipo: "info" | "error". Si conReintento es true agrega un botón "Reintentar".
 */
function mostrarEstado(tipo, texto, conReintento = false) {
  const contenedor = document.getElementById("estado-datos");
  if (!contenedor) return;

  const mensaje = document.createElement("p");
  mensaje.classList.add("estado-datos__msg", `estado-datos__msg--${tipo}`);
  mensaje.textContent = texto;

  if (conReintento) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.classList.add("estado-datos__reintentar");
    boton.textContent = "Reintentar";
    // Las colecciones que fallaron no se guardan, así que al recargar se vuelven a pedir
    boton.addEventListener("click", () => window.location.reload());
    mensaje.appendChild(boton);
  }

  contenedor.replaceChildren(mensaje);
}

function limpiarEstado() {
  const contenedor = document.getElementById("estado-datos");
  if (contenedor) contenedor.replaceChildren();
}

// ---------------------------------------------------------------------------
// Resumen de las cards con datos reales (E1-04)
// ---------------------------------------------------------------------------

// Valor de "estado" que cuenta como préstamo activo (los otros: "devuelto", "vencido").
const ESTADO_PRESTAMO_ACTIVO = "activo";

// Colecciones que no se pudieron cargar (las completa cargarDatos)
let coleccionesFallidas = new Set();

// Último resumen calculado (lo usa la card "Alertas" para avisar cuántas hay)
let ultimoResumen = null;

const esNumero = (valor) => typeof valor === "number" && Number.isFinite(valor);

// Ignora elementos vacíos o que no sean objetos (datos sucios). Si no es una lista, null.
const soloObjetos = (coleccion) =>
  Array.isArray(coleccion) ? coleccion.filter((item) => item && typeof item === "object") : null;

/**
 * Clasifica los insumos según su stock. Función pura.
 * - agotados: stock en 0 (no hace falta un mínimo para saberlo)
 * - bajos: stock igual o menor al mínimo (solo si el mínimo está definido)
 * - sinMinimo: cuántos insumos no tienen stock mínimo (no se les puede evaluar "bajo")
 * - sinStock: cuántos no tienen el stock cargado (no se evalúan; null NO es 0)
 */
function clasificarInsumos(listaInsumos) {
  return listaInsumos.reduce(
    (acumulado, insumo) => {
      if (!esNumero(insumo.stockMinimo)) acumulado.sinMinimo += 1;

      if (!esNumero(insumo.stock)) acumulado.sinStock += 1;
      else if (insumo.stock <= 0) acumulado.agotados.push(insumo);
      else if (esNumero(insumo.stockMinimo) && insumo.stock <= insumo.stockMinimo) acumulado.bajos.push(insumo);
      return acumulado;
    },
    { agotados: [], bajos: [], sinMinimo: 0, sinStock: 0 }
  );
}

/**
 * Calcula los indicadores de las cards a partir de las colecciones.
 * Es una función pura: no toca el DOM ni localStorage.
 *
 * Cada colección puede ser una lista o null (= no disponible, ej: falló la carga).
 * Cada indicador es un número, o null cuando no hay datos para calcularlo:
 * null ≠ 0 ("no sé" no es lo mismo que "cero").
 */
function calcularResumen({ herramientas = null, insumos = null, prestamos = null } = {}) {
  const listaHerramientas = soloObjetos(herramientas);
  const listaInsumos = soloObjetos(insumos);
  const listaPrestamos = soloObjetos(prestamos);

  const estadoInsumos = listaInsumos ? clasificarInsumos(listaInsumos) : null;

  // Sin ningún préstamo registrado todavía: dato pendiente (null), no "0 activos".
  const prestamosActivos =
    listaPrestamos && listaPrestamos.length > 0
      ? listaPrestamos.filter(
          (prestamo) => String(prestamo.estado ?? "").toLowerCase() === ESTADO_PRESTAMO_ACTIVO
        ).length
      : null;

  return {
    herramientas: listaHerramientas ? listaHerramientas.length : null,
    insumos: listaInsumos ? listaInsumos.length : null,
    prestamosActivos,
    alertas: estadoInsumos ? estadoInsumos.agotados.length + estadoInsumos.bajos.length : null,
    insumosSinMinimo: estadoInsumos ? estadoInsumos.sinMinimo : null,
  };
}

/** Texto que leen los lectores de pantalla en lugar del número suelto de la card. */
function describirMetrica(metrica, valor, resumen) {
  const plural = (n, singular, pluralTexto) => `${n} ${n === 1 ? singular : pluralTexto}`;

  if (valor === null) {
    return metrica === "prestamosActivos"
      ? "Préstamos activos: pendiente de datos"
      : "Sin datos disponibles";
  }
  if (metrica === "herramientas") return plural(valor, "herramienta registrada", "herramientas registradas");
  if (metrica === "insumos") return plural(valor, "insumo registrado", "insumos registrados");
  if (metrica === "prestamosActivos") return plural(valor, "préstamo activo", "préstamos activos");

  const base = plural(valor, "alerta activa", "alertas activas");
  return resumen.insumosSinMinimo > 0
    ? `${base}. ${resumen.insumosSinMinimo} insumos sin stock mínimo definido: no se evalúa stock bajo`
    : base;
}

/** Escribe cada indicador en el <h2> de su card (data-metrica indica cuál es). */
function renderResumen(resumen) {
  document.querySelectorAll(".cards .card[data-metrica]").forEach((card) => {
    const metrica = card.dataset.metrica;
    const valor = resumen[metrica];
    const titulo = card.querySelector("h2");

    titulo.textContent =
      valor === null ? "—" : typeof formatNumber === "function" ? formatNumber(valor) : String(valor);
    titulo.setAttribute("aria-label", describirMetrica(metrica, valor, resumen));
  });
}

/** Lee las colecciones de storage.js, calcula el resumen y actualiza las cards. */
function actualizarResumen() {
  const leer = (nombre) =>
    coleccionesFallidas.has("todas") || coleccionesFallidas.has(nombre) ? null : getCollection(nombre);

  ultimoResumen = calcularResumen({
    herramientas: leer("herramientas"),
    insumos: leer("insumos"),
    prestamos: leer("prestamos"),
  });
  renderResumen(ultimoResumen);
}

// ---------------------------------------------------------------------------
// Movimientos recientes y alertas con datos reales (E1-05)
// ---------------------------------------------------------------------------

const MAX_MOVIMIENTOS = 5;
const MAX_ALERTAS = 5;

/** Devuelve el texto si es un texto no vacío; si no, null. */
const textoONulo = (valor) => (typeof valor === "string" && valor.trim() ? valor.trim() : null);

/** Texto para mostrar de un tipo de movimiento, o null si no es uno de los conocidos. */
const etiquetaDeTipo = (tipo) => (Object.keys(TIPOS_MOVIMIENTO).includes(tipo) ? TIPOS_MOVIMIENTO[tipo] : null);

/** "AAAA-MM-DD" con el día LOCAL (toISOString() usaría UTC y podría correrlo un día). */
function aTextoDia(fecha) {
  const dos = (n) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

/**
 * Elige los movimientos más recientes, el más nuevo primero. Función pura.
 * Los que no tienen fecha o la tienen inválida van al final (no se descartan
 * ni se inventa una fecha).
 */
function seleccionarMovimientosRecientes(movimientos, maximo = MAX_MOVIMIENTOS) {
  const lista = soloObjetos(movimientos);
  if (!lista) return [];

  return lista
    .map((movimiento, posicion) => ({
      movimiento,
      posicion,
      hora: parseFecha(movimiento.fecha)?.getTime() ?? null,
    }))
    .sort((a, b) => {
      if (a.hora === null && b.hora === null) return a.posicion - b.posicion;
      if (a.hora === null) return 1;
      if (b.hora === null) return -1;
      return b.hora - a.hora || b.posicion - a.posicion; // empate: el cargado después primero
    })
    .slice(0, maximo)
    .map((item) => item.movimiento);
}

/** Celda de tabla. data-label lo usa el CSS de mobile para mostrar el título de la columna. */
function crearCelda(etiqueta, contenido) {
  const celda = document.createElement("td");
  celda.dataset.label = etiqueta;
  if (typeof contenido === "string") celda.textContent = contenido;
  else celda.appendChild(contenido);
  return celda;
}

function crearFilaMovimiento(movimiento) {
  const fila = document.createElement("tr");

  fila.appendChild(crearCelda("Elemento", textoONulo(movimiento.elemento) ?? "—"));

  // Tipo: el color ayuda, pero el texto siempre está. Un tipo desconocido se muestra
  // tal cual con estilo neutro (y nunca se usa como nombre de clase).
  const etiqueta = etiquetaDeTipo(movimiento.tipo);
  const insignia = document.createElement("span");
  insignia.classList.add("badge", etiqueta ? `badge--${movimiento.tipo}` : "badge--otro");
  insignia.textContent = etiqueta ?? textoONulo(movimiento.tipo) ?? "—";
  fila.appendChild(crearCelda("Tipo", insignia));

  fila.appendChild(crearCelda("Responsable", textoONulo(movimiento.responsable) ?? "—"));

  const fecha = parseFecha(movimiento.fecha);
  if (fecha) {
    const hora = document.createElement("time");
    hora.dateTime = aTextoDia(fecha);
    hora.textContent = formatDate(fecha);
    fila.appendChild(crearCelda("Fecha", hora));
  } else {
    const faltante = movimiento.fecha === undefined || movimiento.fecha === null || movimiento.fecha === "";
    fila.appendChild(crearCelda("Fecha", faltante ? "Sin fecha" : "Fecha inválida"));
  }

  return fila;
}

/** Fila que ocupa todo el ancho para el estado vacío o de error. */
function crearFilaMensaje(texto, tipo) {
  const fila = document.createElement("tr");

  const celda = document.createElement("td");
  celda.colSpan = 4;
  celda.classList.add("movimientos__mensaje", `movimientos__mensaje--${tipo}`);
  celda.textContent = texto;

  fila.appendChild(celda);
  return fila;
}

/** Dibuja la tabla de movimientos recientes a partir de la colección "movimientos". */
function renderMovimientos() {
  const cuerpo = document.getElementById("movimientos-cuerpo");
  if (!cuerpo) return;

  cuerpo.replaceChildren(); // se vuelve a dibujar completo: así no se duplican filas

  // Un fallo de carga NO se muestra como "no hay movimientos"
  if (coleccionesFallidas.has("todas") || coleccionesFallidas.has("movimientos")) {
    cuerpo.appendChild(crearFilaMensaje("No se pudieron cargar los movimientos.", "error"));
    return;
  }

  const recientes = seleccionarMovimientosRecientes(getCollection("movimientos"));
  if (recientes.length === 0) {
    cuerpo.appendChild(crearFilaMensaje("Todavía no hay movimientos registrados.", "vacio"));
    return;
  }

  recientes.forEach((movimiento) => cuerpo.appendChild(crearFilaMovimiento(movimiento)));
}

function crearItemAlerta(texto, tipo) {
  const item = document.createElement("li");
  item.classList.add("alerta", `alerta--${tipo}`);
  item.textContent = texto;
  return item;
}

/**
 * Dibuja la lista de alertas a partir de los insumos: agotados y por debajo del
 * mínimo. Usa la misma clasificación que la card "Alertas", así los números coinciden.
 */
function renderAlertas() {
  const lista = document.getElementById("alertas-lista");
  const nota = document.getElementById("alertas-nota");
  if (!lista) return;

  lista.replaceChildren();
  if (nota) nota.textContent = "";

  const insumos = coleccionesFallidas.has("todas") || coleccionesFallidas.has("insumos")
    ? null
    : soloObjetos(getCollection("insumos"));

  if (!insumos) {
    lista.appendChild(crearItemAlerta("No se pudieron cargar las alertas.", "error"));
    return;
  }

  const { agotados, bajos, sinMinimo } = clasificarInsumos(insumos);
  const nombreDe = (insumo) => textoONulo(insumo.nombre) ?? "Insumo sin nombre";

  const alertas = [
    ...agotados.map((insumo) => ({ tipo: "agotado", texto: `${nombreDe(insumo)}: agotado.` })),
    ...bajos.map((insumo) => ({
      tipo: "bajo",
      texto: `${nombreDe(insumo)}: stock bajo (quedan ${insumo.stock}, mínimo ${insumo.stockMinimo}).`,
    })),
  ];

  if (alertas.length === 0) {
    lista.appendChild(crearItemAlerta("No hay alertas activas.", "vacio"));
  }

  alertas.slice(0, MAX_ALERTAS).forEach((alerta) => lista.appendChild(crearItemAlerta(alerta.texto, alerta.tipo)));

  if (alertas.length > MAX_ALERTAS) {
    const restantes = alertas.length - MAX_ALERTAS;
    const item = document.createElement("li");
    item.classList.add("alerta", "alerta--mas");

    const enlace = document.createElement("a");
    enlace.href = "insumos.html";
    enlace.textContent = `Ver ${restantes === 1 ? "1 alerta más" : `${restantes} alertas más`} en Insumos`;

    item.appendChild(enlace);
    lista.appendChild(item);
  }

  // Sin mínimo no se puede saber si el stock es bajo: se avisa en vez de dar a entender "todo bien"
  if (nota && sinMinimo > 0) {
    nota.textContent =
      sinMinimo === 1
        ? "1 insumo no tiene stock mínimo definido: no se evalúa su stock bajo."
        : `${sinMinimo} insumos no tienen stock mínimo definido: no se evalúa su stock bajo.`;
  }
}

/** Actualiza todo lo que depende de los datos: cards, movimientos y alertas. */
function actualizarPanel() {
  actualizarResumen();
  renderMovimientos();
  renderAlertas();
}

let suscripto = false;

/** Recalcula al crear/editar/borrar algo (esta pestaña u otra) sin recargar la página. */
function suscribirCambios() {
  if (suscripto) return;
  suscripto = true;
  window.addEventListener("escuelatec:cambio", actualizarPanel); // misma pestaña (storage.js)
  window.addEventListener("storage", actualizarPanel); // otra pestaña (evento nativo)
}

// ---------------------------------------------------------------------------
// Interacción en las cards (E1-06)
// ---------------------------------------------------------------------------
//
// Herramientas, Insumos y Préstamos: el <a class="card__enlace"> del pie se estira
// con CSS sobre toda la card. Es un link de verdad, así que el clic, Enter, el clic
// con botón del medio y "abrir en pestaña nueva" funcionan sin JavaScript.
// Alertas no tiene página propia: es un <button> que lleva al panel de alertas.

/**
 * Los links se activan con Enter pero no con la barra espaciadora (que hace bajar
 * la página). Se la agregamos para que las cards respondan como un botón:
 * Enter y Espacio.
 */
function initTeclaEspacioEnCards() {
  document.querySelectorAll(".cards a.card__enlace").forEach((enlace) => {
    enlace.addEventListener("keydown", (evento) => {
      const conModificador = evento.ctrlKey || evento.metaKey || evento.altKey || evento.shiftKey;
      if (evento.key !== " " || evento.repeat || conModificador) return;

      evento.preventDefault(); // sin esto la página baja al apretar Espacio
      enlace.click();
    });
  });
}

let temporizadorResaltado = null;

/**
 * Card "Alertas": lleva el foco al panel de alertas, lo resalta un momento y
 * avisa con showAlert() cuántas hay. Al ser un <button>, Enter y Espacio
 * funcionan solos.
 */
function irAlDetalleDeAlertas() {
  const panel = document.getElementById("alertas-panel");
  const cantidad = ultimoResumen ? ultimoResumen.alertas : null;

  if (cantidad === null) {
    showAlert("No se pudieron cargar las alertas.", "error");
  } else if (cantidad === 0) {
    showAlert("No hay alertas activas.", "success");
  } else {
    const texto = cantidad === 1 ? "Hay 1 alerta activa" : `Hay ${cantidad} alertas activas`;
    showAlert(`${texto}: mirá el detalle en el panel de Alertas.`, "warning");
  }

  if (!panel) return;
  const sinAnimacion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  panel.scrollIntoView({ behavior: sinAnimacion ? "auto" : "smooth", block: "center" });
  panel.focus({ preventScroll: true });

  panel.classList.add("alertas--resaltado");
  clearTimeout(temporizadorResaltado);
  temporizadorResaltado = setTimeout(() => panel.classList.remove("alertas--resaltado"), 2000);
}

function initBotonAlertas() {
  const boton = document.querySelector(".cards button.card__enlace");
  if (boton) boton.addEventListener("click", irAlDetalleDeAlertas);
}
