/**
 * app.js — EscuelaTEC10
 * Responsable: Equipo 1 (Dashboard)
 *
 * Funciones compartidas por las 5 páginas. Se carga en todas junto con storage.js:
 *
 *   <script src="../js/storage.js" defer></script>
 *   <script src="../js/app.js" defer></script>
 *   <script src="../js/dashboard.js" defer></script>  (o herramientas.js, insumos.js, etc.)
 *
 * Antes de escribir una función nueva de uso general en tu propio archivo,
 * revisá si ya existe acá — evitemos que cada equipo resuelva lo mismo distinto.
 */

// ---------------------------------------------------------------------------
// Arranque de la página
// ---------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {
  // La navegación no depende de los datos: se activa primero, así el menú
  // funciona aunque la carga de storage sea lenta o falle.
  marcarLinkActivo();
  initMenuMobile();
  if (!document.getElementById("alertas-globales")) crearContenedorAlertas();

  try {
    await initStorage(); // definida en storage.js — siembra los datos la primera vez
  } catch (error) {
    console.error("No se pudo inicializar el almacenamiento:", error);
  }
});

// ---------------------------------------------------------------------------
// Navegación (navbar compartido)
// ---------------------------------------------------------------------------

// Links del menú principal: los <a> de un <nav> que es hijo directo del <header>.
const SELECTOR_LINKS_NAV = "header > nav a";

/**
 * Devuelve solo el nombre del archivo de una ruta, en minúsculas.
 * "/pages/Dashboard.html" → "dashboard.html"  ·  "/" o "/pages/" → "index.html"
 */
function nombreDePagina(ruta) {
  return (ruta.split("/").pop() || "index.html").toLowerCase();
}

/**
 * Marca en el navbar el link de la página actual.
 * Además de la clase .active (estilo), pone aria-current="page" para que los
 * lectores de pantalla y la navegación por teclado sepan dónde estás, y se lo
 * saca a todos los demás (así no queda un aria-current escrito a mano en el HTML
 * de otra página).
 * Los links placeholder (href="#" o vacío) no se tocan.
 */
function marcarLinkActivo() {
  const links = document.querySelectorAll(SELECTOR_LINKS_NAV);
  if (!links.length) return;

  const paginaActual = nombreDePagina(window.location.pathname);

  links.forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (href === "" || href === "#") return;

    const destino = nombreDePagina(new URL(href, window.location.href).pathname);
    const esActual = destino === paginaActual;

    link.classList.toggle("active", esActual);
    if (esActual) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

/**
 * Menú hamburguesa en mobile.
 * Requiere en el HTML: <button class="navbar-toggle">...</button> y <nav class="navbar-menu">...</nav>
 *
 * - Clic en el botón: abre/cierra y actualiza aria-expanded ("true" | "false").
 * - Escape: cierra y devuelve el foco al botón.
 * - Clic fuera del menú, o sacar el foco del header con Tab: lo cierra.
 * - Al pasar a pantalla ancha vuelve a quedar cerrado (estado coherente).
 */
function initMenuMobile() {
  const boton = document.querySelector(".navbar-toggle");
  const menu = document.querySelector(".navbar-menu");
  if (!boton || !menu) return;

  if (!menu.id) menu.id = "navbar-menu";
  boton.setAttribute("aria-controls", menu.id);

  const estaAbierto = () => menu.classList.contains("is-open");

  function establecerMenu(abierto, devolverFoco = false) {
    menu.classList.toggle("is-open", abierto);
    boton.setAttribute("aria-expanded", abierto ? "true" : "false");
    if (!abierto && devolverFoco) boton.focus();
  }

  establecerMenu(false);

  boton.addEventListener("click", () => establecerMenu(!estaAbierto()));

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && estaAbierto()) establecerMenu(false, true);
  });

  document.addEventListener("click", (evento) => {
    if (estaAbierto() && !menu.contains(evento.target) && !boton.contains(evento.target)) {
      establecerMenu(false);
    }
  });

  const cabecera = boton.closest("header") || document.body;
  cabecera.addEventListener("focusout", (evento) => {
    if (estaAbierto() && evento.relatedTarget && !cabecera.contains(evento.relatedTarget)) {
      establecerMenu(false);
    }
  });

  // Mismo punto de corte que responsive.css (menú colapsado hasta 768px)
  window.matchMedia("(max-width: 768px)").addEventListener("change", (evento) => {
    if (!evento.matches) establecerMenu(false);
  });
}

// ---------------------------------------------------------------------------
// Alertas reutilizables (.alert / .alert-success / .alert-warning / .alert-error)
// ---------------------------------------------------------------------------

/**
 * Muestra una alerta flotante temporal.
 * tipo puede ser: "success" | "warning" | "error"
 * Ejemplo: showAlert("Herramienta guardada", "success");
 *
 * Si ya hay en pantalla un aviso idéntico (mismo texto y tipo), no se apila otro:
 * se reinicia el tiempo del que ya estaba. Así un doble clic (o un clic repetido)
 * no llena la pantalla de avisos iguales.
 *
 * Accesibilidad: el contenedor es una región aria-live="polite" (los lectores de
 * pantalla leen cada aviso nuevo sin interrumpir); los errores usan role="alert",
 * que se anuncia de inmediato.
 */
function showAlert(mensaje, tipo = "success", duracionMs = 4000) {
  const contenedor = document.getElementById("alertas-globales") || crearContenedorAlertas();

  const repetida = [...contenedor.children].find(
    (alerta) => alerta.dataset.tipo === tipo && alerta.textContent === mensaje
  );
  if (repetida) {
    clearTimeout(repetida._temporizador);
    repetida._temporizador = setTimeout(() => repetida.remove(), duracionMs);
    return;
  }

  const alerta = document.createElement("div");
  alerta.className = `alert alert-${tipo}`;
  alerta.dataset.tipo = tipo;
  if (tipo === "error") alerta.setAttribute("role", "alert");
  alerta.textContent = mensaje;

  contenedor.appendChild(alerta);

  alerta._temporizador = setTimeout(() => alerta.remove(), duracionMs);
}

/**
 * Crea (una sola vez) el contenedor donde van a apilarse las alertas,
 * si la página todavía no tiene uno.
 */
function crearContenedorAlertas() {
  const contenedor = document.createElement("div");
  contenedor.id = "alertas-globales";
  contenedor.className = "alertas-globales";
  contenedor.setAttribute("aria-live", "polite");
  document.body.appendChild(contenedor);
  return contenedor;
}

// ---------------------------------------------------------------------------
// Formato de datos (para que todas las páginas muestren lo mismo, igual)
// ---------------------------------------------------------------------------

/**
 * Convierte una fecha (string "2026-07-28" o un Date) a formato dd/mm/aaaa.
 * Si no puede interpretarla, devuelve el valor original tal cual.
 */
function formatDate(fecha) {
  const d = parseFecha(fecha);
  if (!d) return fecha;
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Convierte un valor (Date, número o texto ISO 8601) en un Date, o null si no es válido.
 *
 * - Un texto "solo día" ("AAAA-MM-DD") se arma como día LOCAL. new Date("2026-06-16")
 *   lo tomaría como medianoche UTC, que en Argentina (UTC-3) cae el día anterior.
 * - Rechaza días que no existen ("2026-02-31"), que new Date() "corregiría" a marzo.
 * - Los textos tienen que ser ISO ("2026-06-16" o "2026-06-16T10:30:00Z"): formatos
 *   como "06/05/2026" son ambiguos (¿6 de mayo o 5 de junio?) y cada navegador
 *   los interpreta distinto, así que se descartan.
 */
function parseFecha(valor) {
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;
  if (typeof valor === "number") {
    const desdeNumero = new Date(valor);
    return Number.isNaN(desdeNumero.getTime()) ? null : desdeNumero;
  }
  if (typeof valor !== "string") return null;

  const texto = valor.trim();
  // 1 año · 2 mes · 3 día · 4 hora · 5 minutos · 6 segundos · 7 zona (opcional)
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})?)?$/.exec(texto);
  if (!iso) return null;

  const [anio, mes, dia] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  const conHora = iso[4] !== undefined;

  // Calendario real: Chrome "corrige" 31 de febrero a marzo en vez de rechazarlo.
  const diasDelMes = new Date(anio, mes, 0).getDate();
  if (mes < 1 || mes > 12 || dia < 1 || dia > diasDelMes) return null;
  if (conHora && (Number(iso[4]) > 23 || Number(iso[5]) > 59 || Number(iso[6] ?? 0) > 59)) return null;

  const fecha = conHora ? new Date(texto) : new Date(anio, mes - 1, dia);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/**
 * Formatea un número con separador de miles en español (ej: 1234 -> "1.234").
 */
function formatNumber(numero) {
  return new Intl.NumberFormat("es-AR").format(numero);
}

// ---------------------------------------------------------------------------
// Utilidad para buscadores en vivo
// ---------------------------------------------------------------------------

/**
 * Evita que una función se dispare en cada tecla: espera a que el usuario
 * deje de escribir durante "delay" ms antes de ejecutarla.
 * Uso típico:
 *   input.addEventListener("input", debounce(() => filtrar(input.value), 300));
 */
function debounce(fn, delay = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
