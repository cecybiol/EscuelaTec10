// =================================================================
// VERIFICACIÓN DE SEGURIDAD (Clase Base ItemInventario)
// =================================================================
if (typeof ItemInventario === 'undefined') {
  window.ItemInventario = class ItemInventario {
    constructor({ id = null, nombre, categoria = 'General' }) {
      if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
        throw new Error('El nombre del ítem es obligatorio.');
      }
      this.id = id || Date.now().toString();
      this.nombre = nombre.trim();
      this.categoria = categoria ? categoria.trim() : 'General';
    }
  };
}

// =================================================================
// MODELO: Clase Herramienta (Hereda de ItemInventario)
// =================================================================
class Herramienta extends ItemInventario {
  #estado;

  static ESTADOS_PERMITIDOS = ['nueva', 'usada', 'rota', 'disponible', 'en_uso', 'en_reparacion', 'baja'];

  constructor({ id = null, codigo = null, nombre, categoria = 'Herramientas', estado = null, ubicacion = '', notas = '', unidades = [] }) {
    super({ id: id || codigo, nombre, categoria });

    this.codigo = codigo || this.id;
    this.ubicacion = ubicacion ? ubicacion.trim() : 'Sin ubicación';
    this.notas = notas ? notas.trim() : '';
    this.unidades = Array.isArray(unidades) ? unidades : [];

    // Fallback: si el estado viene en null o inválido en el JSON, asigna 'disponible'
    this.cambiarEstado(estado || 'disponible');
  }

  get estado() {
    return this.#estado;
  }

  set estado(nuevoEstado) {
    this.cambiarEstado(nuevoEstado);
  }

  validarEstado(nuevoEstado) {
    if (!nuevoEstado) return 'disponible';
    const estadoLimpio = String(nuevoEstado).toLowerCase().trim();
    return Herramienta.ESTADOS_PERMITIDOS.includes(estadoLimpio) ? estadoLimpio : 'disponible';
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
// CONTROLADOR Y VISTAS (DOM & STORAGE API)
// =================================================================
document.addEventListener('DOMContentLoaded', async () => {

  const vistaListado = document.getElementById('herramientas');
  const vistaDetalle = document.getElementById('vista-detalle');
  
  const inputBuscar = document.getElementById('input-buscar');
  const btnBuscar = document.getElementById('btn-buscar');

  const modal = document.getElementById('modal-nueva-herramienta') || 
                document.getElementById('nueva-herramienta') ||
                document.querySelector('.modal');
                
  const btnAbrirModal = document.getElementById('btn-nueva-herramienta');
  const btnCerrarModal = document.getElementById('btn-cerrar-modal-nueva');
  const btnCancelarModal = document.getElementById('btn-cancelar-nueva');
  const overlay = document.getElementById('modal-nueva-overlay');
  const formNueva = document.getElementById('form-nueva-herramienta');
  const listaContenedor = document.getElementById('lista-herramientas');

  const formEditar = document.getElementById('form-editar-herramienta');
  const detalleTitulo = document.getElementById('detalle-titulo');
  const campoNombre = document.getElementById('campo-nombre');
  const campoEstado = document.getElementById('campo-estado');
  const campoUbicacion = document.getElementById('campo-ubicacion');
  const campoNotas = document.getElementById('campo-notas');
  
  const btnVolver = document.getElementById('btn-volver');
  const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');

  const tabInfo = document.getElementById('tab-info');
  const tabHistorial = document.getElementById('tab-historial');
  const panelInfo = document.getElementById('panel-info');
  const panelHistorial = document.getElementById('panel-historial');

  let herramientaSeleccionada = null;
  let herramientas = [];

  // NAVEGACIÓN VISTAS
  const mostrarVistaListado = () => {
    if (vistaDetalle) vistaDetalle.style.setProperty('display', 'none', 'important');
    if (vistaListado) vistaListado.style.setProperty('display', 'block', 'important');
  };

  const mostrarVistaDetalle = (herramienta) => {
    herramientaSeleccionada = herramienta;

    if (detalleTitulo) detalleTitulo.textContent = herramienta.nombre;
    if (campoNombre) campoNombre.value = herramienta.nombre;
    if (campoEstado) campoEstado.value = herramienta.estado;
    if (campoUbicacion) campoUbicacion.value = herramienta.ubicacion;
    if (campoNotas) campoNotas.value = herramienta.notas;

    activarTabInfo();

    if (vistaListado) vistaListado.style.setProperty('display', 'none', 'important');
    if (vistaDetalle) vistaDetalle.style.setProperty('display', 'block', 'important');
  };

  mostrarVistaListado();

  // RENDERIZADO
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

      const tieneQR = herramienta.unidades.some(u => String(u.qr).toUpperCase() === 'SI');

      fila.innerHTML = `
        <span class="herramienta-nombre">${herramienta.nombre}</span>
        <span class="badge badge--${herramienta.obtenerEstadoClase()}">${herramienta.obtenerEstadoFormateado()}</span>
        <span class="herramienta-ubicacion">${herramienta.ubicacion}</span>
        <span class="herramienta-qr" aria-label="Código QR" style="opacity: ${tieneQR ? '1' : '0.2'};">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </span>
      `;

      fila.addEventListener('click', () => mostrarVistaDetalle(herramienta));
      listaContenedor.appendChild(fila);
    });
  };

  // CARGA Y SINCRONIZACIÓN
  const cargarYRenderizar = async () => {
    try {
      if (typeof initStorage === 'function') {
        await initStorage();
      }

      const rawData = typeof getCollection === 'function' ? getCollection("herramientas") : [];
      herramientas = rawData.map(item => new Herramienta(item));
    } catch (err) {
      console.error("Error al cargar datos desde storage:", err);
      herramientas = [];
    }

    renderizarHerramientas();
  };

  // BUSCADOR
  if (inputBuscar) {
    inputBuscar.addEventListener('input', (e) => renderizarHerramientas(e.target.value));
    inputBuscar.addEventListener('search', (e) => renderizarHerramientas(e.target.value));
  }
  if (btnBuscar) {
    btnBuscar.addEventListener('click', () => {
      if (inputBuscar) renderizarHerramientas(inputBuscar.value);
    });
  }

  // MODAL
  const abrirModal = () => {
    if (modal) {
      modal.classList.add('is-visible');
      modal.style.display = 'flex';
    }
  };

  const cerrarModal = () => {
    if (modal) {
      modal.classList.remove('is-visible');
      modal.style.display = 'none';
    }
    if (formNueva) formNueva.reset();
  };

  if (btnAbrirModal) btnAbrirModal.addEventListener('click', abrirModal);
  if (btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModal);
  if (btnCancelarModal) btnCancelarModal.addEventListener('click', cerrarModal);
  if (overlay) overlay.addEventListener('click', cerrarModal);

  // AGREGAR NUEVA HERRAMIENTA
  if (formNueva) {
    formNueva.addEventListener('submit', (e) => {
      e.preventDefault();
      try {
        const inputNombre = document.getElementById('nueva-nombre') || formNueva.querySelector('[name="nombre"]');
        const inputEstado = document.getElementById('nueva-estado') || formNueva.querySelector('[name="estado"]');
        const inputUbicacion = document.getElementById('nueva-ubicacion') || formNueva.querySelector('[name="ubicacion"]');
        const inputNotas = document.getElementById('nueva-notas') || formNueva.querySelector('[name="notas"]');

        const datosNueva = {
          nombre: inputNombre ? inputNombre.value : '',
          categoria: 'Herramientas',
          estado: inputEstado ? inputEstado.value : 'disponible',
          ubicacion: inputUbicacion ? inputUbicacion.value : '',
          notas: inputNotas ? inputNotas.value : '',
          unidades: []
        };

        if (typeof addItem === 'function') {
          addItem("herramientas", datosNueva);
        }

        cargarYRenderizar();
        cerrarModal();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // EDITAR HERRAMIENTA
  if (formEditar) {
    formEditar.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!herramientaSeleccionada) return;

      try {
        const cambios = {
          nombre: campoNombre.value,
          estado: campoEstado.value,
          ubicacion: campoUbicacion.value,
          notas: campoNotas.value
        };

        if (typeof updateItem === 'function') {
          updateItem("herramientas", herramientaSeleccionada.id, cambios);
        }

        cargarYRenderizar();
        mostrarVistaListado();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  if (btnVolver) btnVolver.addEventListener('click', mostrarVistaListado);
  if (btnCancelarEdicion) btnCancelarEdicion.addEventListener('click', mostrarVistaListado);

  // TABS
  const activarTabInfo = () => {
    if (tabInfo) tabInfo.classList.add('tab-btn--activo');
    if (tabHistorial) tabHistorial.classList.remove('tab-btn--activo');
    if (panelInfo) panelInfo.style.display = 'block';
    if (panelHistorial) panelHistorial.style.display = 'none';
  };

  const activarTabHistorial = () => {
    if (tabHistorial) tabHistorial.classList.add('tab-btn--activo');
    if (tabInfo) tabInfo.classList.remove('tab-btn--activo');
    if (panelHistorial) panelHistorial.style.display = 'block';
    if (panelInfo) panelInfo.style.display = 'none';
  };

  if (tabInfo) tabInfo.addEventListener('click', activarTabInfo);
  if (tabHistorial) tabHistorial.addEventListener('click', activarTabHistorial);

  // Iniciar
  await cargarYRenderizar();
});