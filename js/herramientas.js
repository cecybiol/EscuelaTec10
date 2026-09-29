// =================================================================
// MODELO: Clase Herramienta (Reglas de negocio, POO y validaciones)
// =================================================================
class Herramienta {
  /**
   * Representa una herramienta del sistema con sus validaciones.
   * @param {Object} datos - Propiedades para inicializar la herramienta
   */
  constructor({ id = null, nombre, estado, ubicacion = '', notas = '' }) {
    this.validarNombre(nombre);
    this.validarEstado(estado);

    this.id = id;
    this.nombre = nombre.trim();
    this.estado = estado;
    this.ubicacion = ubicacion ? ubicacion.trim() : 'Sin ubicación';
    this.notas = notas ? notas.trim() : '';
  }

  // Regla de validación: Nombre obligatorio
  validarNombre(nombre) {
    if (!nombre || nombre.trim() === '') {
      throw new Error('El nombre de la herramienta es obligatorio.');
    }
  }

  // Regla de validación: Estado obligatorio
  validarEstado(estado) {
    if (!estado) {
      throw new Error('El estado de la herramienta es obligatorio.');
    }
  }

  // Método descriptivo: Devuelve la clase CSS para el badge
  obtenerEstadoClase() {
    return this.estado ? this.estado.toLowerCase() : 'nueva';
  }

  // Método descriptivo: Devuelve el estado formateado (ej. "Nueva")
  obtenerEstadoFormateado() {
    if (!this.estado) return 'Nueva';
    return this.estado.charAt(0).toUpperCase() + this.estado.slice(1).toLowerCase();
  }

  // Método descriptivo general
  obtenerDescripcion() {
    return `${this.nombre} - Estado: ${this.obtenerEstadoFormateado()} (${this.ubicacion})`;
  }
}

// =================================================================
// CÓDIGO DE LA VISTA Y EVENTOS (MANEJO DEL DOM Y LOCALSTORAGE)
// =================================================================

// 1. REGISTRO Y LISTADO DE HERRAMIENTAS
document.addEventListener('DOMContentLoaded', () => {
  // Elementos de la página
  const modal = document.getElementById('-nueva-herramienta');
  const btnAbrir = document.getElementById('btn-nueva-herramienta');
  const btnCerrar = document.getElementById('btn-cerrar-modal-nueva');
  const btnCancelar = document.getElementById('btn-cancelar-nueva');
  const overlay = document.getElementById('modal-nueva-overlay');
  const form = document.getElementById('form-nueva-herramienta');
  const listaContenedor = document.getElementById('lista-herramientas');

  // Carga e instanciación de datos a través de la clase Herramienta
  let datosGuardados = JSON.parse(localStorage.getItem('herramientas')) || [];
  let herramientas = datosGuardados.map(item => new Herramienta(item));

  const abrirModal = () => {
    if (modal) modal.classList.add('is-visible');
  };
  
  const cerrarModal = () => {
    if (modal) modal.classList.remove('is-visible');
    if (form) form.reset();
  };

  const renderizarHerramientas = () => {
    if (!listaContenedor) return;
    listaContenedor.innerHTML = '';

    if (herramientas.length === 0) {
      listaContenedor.innerHTML = '<li class="sin-herramientas">No hay herramientas registradas.</li>';
      return;
    }

    herramientas.forEach((herramienta, index) => {
      const fila = document.createElement('li');
      fila.classList.add('fila-herramienta');
      fila.setAttribute('data-id', herramienta.id || index + 1);
      fila.setAttribute('role', 'button');
      fila.setAttribute('tabindex', '0');
      fila.setAttribute('aria-label', `Ver detalle de ${herramienta.nombre}`);

      // Métodos descriptivos de la instancia
      const estadoClase = herramienta.obtenerEstadoClase();
      const estadoTexto = herramienta.obtenerEstadoFormateado();

      fila.innerHTML = `
        <span class="herramienta-nombre">${herramienta.nombre}</span>
        <span class="badge badge--${estadoClase}">${estadoTexto}</span>
        <span class="herramienta-ubicacion">${herramienta.ubicacion}</span>
        <span class="herramienta-qr" aria-label="Código QR">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </span>
      `;

      listaContenedor.appendChild(fila);
    });
  };

  // Guardar registro mediante el constructor del modelo Herramienta
  const guardarHerramienta = (e) => {
    e.preventDefault();

    try {
      // 1. Crear instancia del Modelo (aquí se disparan las validaciones del constructor)
      const nuevaHerramienta = new Herramienta({
        nombre: document.getElementById('nueva-nombre')?.value,
        estado: document.getElementById('nueva-estado')?.value,
        ubicacion: document.getElementById('nueva-ubicacion')?.value,
        notas: document.getElementById('nueva-notas')?.value
      });

      // 2. Guardar en memoria y LocalStorage
      herramientas.push(nuevaHerramienta);
      localStorage.setItem('herramientas', JSON.stringify(herramientas));

      // 3. Actualizar vista y cerrar modal
      renderizarHerramientas();
      cerrarModal();

    } catch (error) {
      // Muestra el mensaje de error definido en el modelo si falla alguna validación
      alert(error.message);
    }
  };

  // Listener de eventos para el modal
  if (btnAbrir) btnAbrir.addEventListener('click', abrirModal);
  if (btnCerrar) btnCerrar.addEventListener('click', cerrarModal);
  if (btnCancelar) btnCancelar.addEventListener('click', cerrarModal);
  if (overlay) overlay.addEventListener('click', cerrarModal);

  if (form) form.addEventListener('submit', guardarHerramienta);

  renderizarHerramientas();
});

// 2. EDICIÓN DE HERRAMIENTAS
document.addEventListener("DOMContentLoaded", () => {
  const filaHerramienta = document.querySelector(".fila-herramienta");
  const panelInfo = document.getElementById("panel-info");
  const formEditar = document.getElementById("form-editar-herramienta");
  const btnVolver = document.getElementById("btn-volver");
  const btnCancelarEdicion = document.getElementById("btn-cancelar-edicion");

  const campoNombre = document.getElementById("campo-nombre");
  const campoEstado = document.getElementById("campo-estado");
  const campoUbicacion = document.getElementById("campo-ubicacion");
  const campoNotas = document.getElementById("campo-notas");
  const detalleTitulo = document.getElementById("detalle-titulo");

  let herramientaSeleccionadaId = null;

  if (panelInfo) {
    panelInfo.style.display = "none";
  }

  if (filaHerramienta) {
    filaHerramienta.addEventListener("click", () => {
      herramientaSeleccionadaId = filaHerramienta.getAttribute("data-id");

      const coleccion = typeof getCollection === "function" ? getCollection("herramientas") : [];
      const datosGuardados = coleccion.find((item) => String(item.id) === String(herramientaSeleccionadaId));

      const nombre = datosGuardados?.nombre || filaHerramienta.querySelector(".herramienta-nombre")?.textContent || "";
      const ubicacion = datosGuardados?.ubicacion || filaHerramienta.querySelector(".herramienta-ubicacion")?.textContent || "";
      const estado = datosGuardados?.estado || "nueva";
      const notas = datosGuardados?.notas || "";

      if (campoNombre) campoNombre.value = nombre;
      if (campoUbicacion) campoUbicacion.value = ubicacion;
      if (campoEstado) campoEstado.value = estado;
      if (campoNotas) campoNotas.value = notas;
      if (detalleTitulo) detalleTitulo.textContent = nombre;

      if (panelInfo) {
        panelInfo.style.display = "block";
      }

      if (typeof showAlert === "function") {
        showAlert(`Editando herramienta: ${nombre}`, "info");
      }
    });
  }

  if (formEditar) {
    formEditar.addEventListener("submit", (event) => {
      event.preventDefault();

      try {
        // Validar datos usando el modelo Herramienta al editar
        const herramientaEditada = new Herramienta({
          id: herramientaSeleccionadaId,
          nombre: campoNombre?.value,
          estado: campoEstado?.value,
          ubicacion: campoUbicacion?.value,
          notas: campoNotas?.value
        });

        if (herramientaSeleccionadaId && typeof updateItem === "function") {
          updateItem("herramientas", herramientaSeleccionadaId, herramientaEditada);
        }

        if (detalleTitulo) {
          detalleTitulo.textContent = herramientaEditada.nombre;
        }

        const nombreSpan = filaHerramienta?.querySelector(".herramienta-nombre");
        const ubicacionSpan = filaHerramienta?.querySelector(".herramienta-ubicacion");
        if (nombreSpan) nombreSpan.textContent = herramientaEditada.nombre;
        if (ubicacionSpan) ubicacionSpan.textContent = herramientaEditada.ubicacion;

        if (typeof showAlert === "function") {
          showAlert("Cambios guardados correctamente", "success");
        }
      } catch (error) {
        alert(error.message);
      }
    });
  }

  const ocultarEdicion = () => {
    if (panelInfo) panelInfo.style.display = "none";
    if (formEditar) formEditar.reset();
  };

  if (btnCancelarEdicion) btnCancelarEdicion.addEventListener("click", ocultarEdicion);
  if (btnVolver) btnVolver.addEventListener("click", ocultarEdicion);
});

// 3. PANEL DE FILTROS
document.addEventListener('DOMContentLoaded', () => {
  const btnFiltros = document.getElementById('btn-filtros');
  const panelFiltros = document.getElementById('panel-filtros');

  if (!btnFiltros || !panelFiltros) return;

  btnFiltros.addEventListener('click', (e) => {
    e.stopPropagation();
    const estaAbierto = panelFiltros.classList.contains('activo');
    
    if (estaAbierto) {
      panelFiltros.classList.remove('activo');
      btnFiltros.setAttribute('aria-expanded', 'false');
    } else {
      panelFiltros.classList.add('activo');
      btnFiltros.setAttribute('aria-expanded', 'true');
    }
  });

  panelFiltros.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  document.addEventListener('click', () => {
    if (panelFiltros.classList.contains('activo')) {
      panelFiltros.classList.remove('activo');
      btnFiltros.setAttribute('aria-expanded', 'false');
    }
  });
});