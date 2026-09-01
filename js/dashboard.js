/**
 * dashboard.js — EscuelaTEC10
 * Responsable: Equipo 1 (Dashboard)
 *
 * Lógica específica de pages/dashboard.html.
 * Se carga después de storage.js y app.js (ahí están las funciones
 * compartidas, como showAlert()).
 */

document.addEventListener("DOMContentLoaded", () => {
  inspeccionarDOM();
  initClickEnCards();
  agregarAlertaStockBajo();
});

// ---------------------------------------------------------------------------
// Selección de elementos del DOM (querySelectorAll + console.log)
// ---------------------------------------------------------------------------
function inspeccionarDOM() {
  const cards = document.querySelectorAll(".cards .card");
  const filasTabla = document.querySelectorAll(".tabla tbody tr");
  const linksNav = document.querySelectorAll("header nav a");

  console.log("Cards del dashboard:", cards);
  console.log("Filas de la tabla de movimientos recientes:", filasTabla);
  console.log("Links del navbar:", linksNav);
}

// ---------------------------------------------------------------------------
// Interacción: click en una card dispara showAlert() (definida en app.js)
// ---------------------------------------------------------------------------
function initClickEnCards() {
  const cards = document.querySelectorAll(".cards .card");

  cards.forEach((card) => {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      const titulo = card.querySelector("h3")?.textContent ?? "esta sección";
      showAlert(`Abriendo detalle de "${titulo}"...`, "success");
    });
  });
}

// ---------------------------------------------------------------------------
// Manipulación del DOM: alerta de stock bajo creada e insertada dinámicamente
// ---------------------------------------------------------------------------
function agregarAlertaStockBajo() {
  const lista = document.querySelector(".alertas ul");
  if (!lista) return;

  const item = document.createElement("li");
  item.classList.add("alerta-stock-bajo");
  item.textContent = "📦 Stock bajo: Guantes de nitrilo (generado por dashboard.js).";

  lista.appendChild(item);
}