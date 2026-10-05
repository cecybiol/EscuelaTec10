// =================================================================
// MODELO: Clase Herramienta (Hereda de ItemInventario)
// =================================================================
class Herramienta extends ItemInventario {
  #estado;

  static ESTADOS_PERMITIDOS = ['nueva', 'usada', 'rota', 'disponible', 'en_uso', 'en_reparacion', 'baja'];

  constructor({ id = null, nombre, categoria = 'Herramientas', estado, ubicacion = '', notas = '' }) {
    // Hereda id, nombre y categoria desde ItemInventario
    super({ id, nombre, categoria });

    this.ubicacion = ubicacion ? ubicacion.trim() : 'Sin ubicación';
    this.notas = notas ? notas.trim() : '';

    this.cambiarEstado(estado || 'nueva');
  }

  get estado() {
    return this.#estado;
  }

  set estado(nuevoEstado) {
    this.cambiarEstado(nuevoEstado);
  }

  validarEstado(nuevoEstado) {
    if (!nuevoEstado) return 'nueva';
    const estadoLimpio = String(nuevoEstado).toLowerCase().trim();
    return Herramienta.ESTADOS_PERMITIDOS.includes(estadoLimpio) ? estadoLimpio : 'nueva';
  }

  cambiarEstado(nuevoEstado) {
    const estadoValidado = this.validarEstado(nuevoEstado);
    if (this.#estado === 'baja' && estadoValidado !== 'baja') {
      throw new Error('Una herramienta en estado "baja" no puede cambiar de estado.');
    }
    this.#estado = estadoValidado;
  }

  obtenerEstadoClase() {
    return this.#estado;
  }

  obtenerEstadoFormateado() {
    return this.#estado.charAt(0).toUpperCase() + this.#estado.slice(1).replace('_', ' ');
  }
}

// =================================================================
// CONTROLADOR Y NAVEGACIÓN DE VISTAS (DOM & LOCALSTORAGE)
// =================================================================
document.addEventListener('DOMContentLoaded', () => {

  // --- ELEMENTOS DEL DOM ---
  const vistaListado = document.getElementById('herramientas');
  const vistaDetalle = document.getElementById('vista-detalle');
  
  // Buscador
  const inputBuscar = document.getElementById('input-buscar');
  const btnBuscar = document.getElementById('btn-buscar');

  // Modal y Botones de Creación
  const modal = document.getElementById('modal-nueva-herramienta') || 
                document.getElementById('nueva-herramienta') ||
                document.querySelector('.modal');
                
  const btnAbrirModal = document.getElementById('btn-nueva-herramienta');
  const btnCerrarModal = document.getElementById('btn-cerrar-modal-nueva');
  const btnCancelarModal = document.getElementById('btn-cancelar-nueva');
  const overlay = document.getElementById('modal-nueva-overlay');
  const formNueva = document.getElementById('form-nueva-herramienta');
  const listaContenedor = document.getElementById('lista-herramientas');

  // Formulario y Detalle
  const formEditar = document.getElementById('form-editar-herramienta');
  const detalleTitulo = document.getElementById('detalle-titulo');
  const campoNombre = document.getElementById('campo-nombre');
  const campoEstado = document.getElementById('campo-estado');
  const campoUbicacion = document.getElementById('campo-ubicacion');
  const campoNotas = document.getElementById('campo-notas');
  
  const btnVolver = document.getElementById('btn-volver');
  const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');

  // Tabs
  const tabInfo = document.getElementById('tab-info');
  const tabHistorial = document.getElementById('tab-historial');
  const panelInfo = document.getElementById('panel-info');
  const panelHistorial = document.getElementById('panel-historial');

  let herramientaSeleccionada = null;

  // --- ALMACENAMIENTO DE HERRAMIENTAS ---
  let datosGuardados = [];
  try {
    datosGuardados = JSON.parse(localStorage.getItem('herramientas')) || [];
  } catch (e) {
    datosGuardados = [];
  }

  let herramientas = [];
  datosGuardados.forEach(item => {
    try {
      if (item && item.nombre) {
        herramientas.push(new Herramienta(item));
      }
    } catch (e) {
      console.warn("Dato no válido ignorado:", item);
    }
  });

  const guardarEnLocalStorage = () => {
    const dataAguardar = herramientas.map(h => ({
      id: h.id,
      nombre: h.nombre,
      categoria: h.categoria,
      estado: h.estado,
      ubicacion: h.ubicacion,
      notas: h.notas
    }));
    localStorage.setItem('herramientas', JSON.stringify(dataAguardar));
  };

  // --- NAVEGACIÓN ENTRE VISTAS ---
  const mostrarVistaListado = () => {
    if (vistaDetalle) vistaDetalle.style.display = 'none';
    if (vistaListado) vistaListado.style.display = 'block';
  };

  const mostrarVistaDetalle = (herramienta) => {
    herramientaSeleccionada = herramienta;

    if (detalleTitulo) detalleTitulo.textContent = herramienta.nombre;
    if (campoNombre) campoNombre.value = herramienta.nombre;
    if (campoEstado) campoEstado.value = herramienta.estado;
    if (campoUbicacion) campoUbicacion.value = herramienta.ubicacion;
    if (campoNotas) campoNotas.value = herramienta.notas;

    activarTabInfo();

    if (vistaListado) vistaListado.style.display = 'none';
    if (vistaDetalle) vistaDetalle.style.display = 'block';
  };

  mostrarVistaListado();

  // --- RENDERIZADO DE LA LISTA (CON BUSCADOR) ---
  const renderizarHerramientas = (filtro = '') => {
    if (!listaContenedor) return;
    listaContenedor.innerHTML = '';

    const termino = filtro.toLowerCase().trim();

    const herramientasFiltradas = herramientas.filter(h => 
      h.nombre.toLowerCase().includes(termino) ||
      h.ubicacion.toLowerCase().includes(termino) ||
      h.obtenerEstadoFormateado().toLowerCase().includes(termino)
    );

    if (herramientasFiltradas.length === 0) {
      const mensaje = termino === '' 
        ? 'No hay herramientas registradas.' 
        : `No se encontraron herramientas para "${filtro}".`;
      listaContenedor.innerHTML = `<li class="sin-herramientas" style="padding:1rem; text-align:center;">${mensaje}</li>`;
      return;
    }

    herramientasFiltradas.forEach((herramienta) => {
      const fila = document.createElement('li');
      fila.classList.add('fila-herramienta');
      fila.style.cursor = 'pointer';
      fila.setAttribute('data-id', herramienta.id);
      fila.setAttribute('role', 'button');
      fila.setAttribute('tabindex', '0');

      fila.innerHTML = `
        <span class="herramienta-nombre">${herramienta.nombre}</span>
        <span class="badge badge--${herramienta.obtenerEstadoClase()}">${herramienta.obtenerEstadoFormateado()}</span>
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

      fila.addEventListener('click', () => {
        mostrarVistaDetalle(herramienta);
      });

      listaContenedor.appendChild(fila);
    });
  };

  // --- EVENTOS DEL BUSCADOR ---
  if (inputBuscar) {
    inputBuscar.addEventListener('input', (e) => {
      renderizarHerramientas(e.target.value);
    });

    inputBuscar.addEventListener('search', (e) => {
      renderizarHerramientas(e.target.value);
    });
  }

  if (btnBuscar) {
    btnBuscar.addEventListener('click', () => {
      if (inputBuscar) renderizarHerramientas(inputBuscar.value);
    });
  }

  // --- CONTROL DEL MODAL (ABRIR / CERRAR) ---
  const abrirModal = () => {
    const targetModal = modal || document.querySelector('.modal') || document.querySelector('[role="dialog"]');
    if (targetModal) {
      targetModal.classList.add('is-visible');
      targetModal.style.display = 'flex';
    }
  };

  const cerrarModal = () => {
    const targetModal = modal || document.querySelector('.modal') || document.querySelector('[role="dialog"]');
    if (targetModal) {
      targetModal.classList.remove('is-visible');
      targetModal.style.display = 'none';
    }
    if (formNueva) formNueva.reset();
  };

  if (btnAbrirModal) {
    btnAbrirModal.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      abrirModal();
    });
  }

  if (btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModal);
  if (btnCancelarModal) btnCancelarModal.addEventListener('click', cerrarModal);
  if (overlay) overlay.addEventListener('click', cerrarModal);

  // CREAR NUEVA HERRAMIENTA
  if (formNueva) {
    formNueva.addEventListener('submit', (e) => {
      e.preventDefault();
      try {
        const inputNombre = document.getElementById('nueva-nombre') || formNueva.querySelector('[name="nombre"]');
        const inputEstado = document.getElementById('nueva-estado') || formNueva.querySelector('[name="estado"]');
        const inputUbicacion = document.getElementById('nueva-ubicacion') || formNueva.querySelector('[name="ubicacion"]');
        const inputNotas = document.getElementById('nueva-notas') || formNueva.querySelector('[name="notas"]');

        const nueva = new Herramienta({
          nombre: inputNombre ? inputNombre.value : '',
          estado: inputEstado ? inputEstado.value : 'nueva',
          ubicacion: inputUbicacion ? inputUbicacion.value : '',
          notas: inputNotas ? inputNotas.value : ''
        });

        herramientas.push(nueva);
        guardarEnLocalStorage();
        renderizarHerramientas(inputBuscar ? inputBuscar.value : '');
        cerrarModal();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // EDICIÓN DE HERRAMIENTAS
  if (formEditar) {
    formEditar.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!herramientaSeleccionada) return;

      try {
        herramientaSeleccionada.nombre = campoNombre.value;
        herramientaSeleccionada.cambiarEstado(campoEstado.value);
        herramientaSeleccionada.ubicacion = campoUbicacion.value;
        herramientaSeleccionada.notas = campoNotas.value;

        guardarEnLocalStorage();
        renderizarHerramientas(inputBuscar ? inputBuscar.value : '');
        mostrarVistaListado();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // BOTONES VOLVER / CANCELAR
  if (btnVolver) btnVolver.addEventListener('click', mostrarVistaListado);
  if (btnCancelarEdicion) btnCancelarEdicion.addEventListener('click', mostrarVistaListado);

  // PESTAÑAS (INFO / HISTORIAL)
  const activarTabInfo = () => {
    if (tabInfo) {
      tabInfo.classList.add('tab-btn--activo');
      tabInfo.setAttribute('aria-selected', 'true');
    }
    if (tabHistorial) {
      tabHistorial.classList.remove('tab-btn--activo');
      tabHistorial.setAttribute('aria-selected', 'false');
    }
    if (panelInfo) panelInfo.style.display = 'block';
    if (panelHistorial) panelHistorial.style.display = 'none';
  };

  const activarTabHistorial = () => {
    if (tabHistorial) {
      tabHistorial.classList.add('tab-btn--activo');
      tabHistorial.setAttribute('aria-selected', 'true');
    }
    if (tabInfo) {
      tabInfo.classList.remove('tab-btn--activo');
      tabInfo.setAttribute('aria-selected', 'false');
    }
    if (panelHistorial) panelHistorial.style.display = 'block';
    if (panelInfo) panelInfo.style.display = 'none';
  };

  if (tabInfo) tabInfo.addEventListener('click', activarTabInfo);
  if (tabHistorial) tabHistorial.addEventListener('click', activarTabHistorial);

  renderizarHerramientas();
});