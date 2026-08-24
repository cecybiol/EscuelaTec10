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
  await initStorage(); // definida en storage.js — siembra los datos la primera vez
  marcarLinkActivo();
  initMenuMobile();
});

/**
 * Resalta en el navbar el link que corresponde a la página actual,
 * comparando el nombre del archivo HTML con el href de cada link.
 * Requiere que el navbar tenga: <nav class="navbar-menu"> <a href="...">...</a> </nav>
 */
function marcarLinkActivo() {
  const links = document.querySelectorAll(".navbar-menu a");
  if (!links.length) return;

  const paginaActual = window.location.pathname.split("/").pop() || "index.html";

  links.forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (href.endsWith(paginaActual)) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

/**
 * Muestra/oculta el menú en la versión mobile al tocar el botón hamburguesa.
 * Requiere en el HTML: <button class="navbar-toggle">...</button>
 * y <nav class="navbar-menu">...</nav>
 */
function initMenuMobile() {
  const boton = document.querySelector(".navbar-toggle");
  const menu = document.querySelector(".navbar-menu");
  if (!boton || !menu) return;

  boton.addEventListener("click", () => {
    const abierto = menu.classList.toggle("is-open");
    boton.setAttribute("aria-expanded", abierto ? "true" : "false");
  });
}

// ---------------------------------------------------------------------------
// Alertas reutilizables (.alert / .alert-success / .alert-warning / .alert-error)
// ---------------------------------------------------------------------------

/**
 * Muestra una alerta flotante temporal.
 * tipo puede ser: "success" | "warning" | "error"
 * Ejemplo: showAlert("Herramienta guardada", "success");
 */
function showAlert(mensaje, tipo = "success", duracionMs = 4000) {
  const contenedor = document.getElementById("alertas-globales") || crearContenedorAlertas();

  const alerta = document.createElement("div");
  alerta.className = `alert alert-${tipo}`;
  alerta.setAttribute("role", "alert");
  alerta.textContent = mensaje;

  contenedor.appendChild(alerta);

  setTimeout(() => alerta.remove(), duracionMs);
}

/**
 * Crea (una sola vez) el contenedor donde van a apilarse las alertas,
 * si la página todavía no tiene uno.
 */
function crearContenedorAlertas() {
  const contenedor = document.createElement("div");
  contenedor.id = "alertas-globales";
  contenedor.className = "alertas-globales";
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
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
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
