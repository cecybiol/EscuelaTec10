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
// CONTROLADOR Y VISTAS
// =================================================================
document.addEventListener('DOMContentLoaded', async () => {

  // Vistas principales
  const vistaListado = document.getElementById('vista-lista') || document.getElementById('herramientas');
  const vistaDetalle = document.getElementById('vista-detalle');
  
  // Elementos del listado
  const btnNuevaHerramienta = document.getElementById('btn-nueva-herramienta');
  const listaContenedor = document.getElementById('lista-herramientas');
  const inputBuscar = document.getElementById('input-buscar');

  // Formulario y campos de la vista detalle/edición
  const formEditar = document.getElementById('form-editar-herramienta') || document.querySelector('#vista-detalle form');
  const detalleTitulo = document.getElementById('detalle-titulo');
  const campoNombre = document.getElementById('campo-nombre') || document.querySelector('[name="nombre"]');
  const campoEstado = document.getElementById('campo-estado') || document.querySelector('[name="estado"]');
  const campoUbicacion = document.getElementById('campo-ubicacion') || document.querySelector('[name="ubicacion"]');
  const campoNotas = document.getElementById('campo-notas') || document.querySelector('[name="notas"]');
  
  // Botones de navegación
  const btnVolver = document.getElementById('btn-volver');
  const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');

  const tabInfo = document.getElementById('tab-info');
  const tabHistorial = document.getElementById('tab-historial');
  const panelInfo = document.getElementById('panel-info');
  const panelHistorial = document.getElementById('panel-historial');

  // Si es null -> estamos CREANDO una herramienta nueva.
  // Si tiene un objeto -> estamos EDITANDO una existente.
  let herramientaSeleccionada = null; 
  let herramientas = [];

  // NAVEGACIÓN DE PANTALLAS
  const mostrarVistaListado = () => {
    herramientaSeleccionada = null;
    if (vistaDetalle) vistaDetalle.style.setProperty('display', 'none', 'important');
    if (vistaListado) vistaListado.style.setProperty('display', 'block', 'important');
  };

  const mostrarVistaDetalle = (herramienta = null) => {
    herramientaSeleccionada = herramienta;

    if (herramienta) {
      // MODO EDICIÓN
      if (detalleTitulo) detalleTitulo.textContent = herramienta.nombre;
      if (campoNombre) campoNombre.value = herramienta.nombre;
      if (campoEstado) campoEstado.value = herramienta.estado;
      if (campoUbicacion) campoUbicacion.value = herramienta.ubicacion;
      if (campoNotas) campoNotas.value = herramienta.notas;
    } else {
      // MODO NUEVA HERRAMIENTA (Campos vacíos)
      if (detalleTitulo) detalleTitulo.textContent = 'Nueva Herramienta';
      if (campoNombre) campoNombre.value = '';
      if (campoEstado) campoEstado.value = 'disponible';
      if (campoUbicacion) campoUbicacion.value = '';
      if (campoNotas) campoNotas.value = '';
    }

    activarTabInfo();

    if (vistaListado) vistaListado.style.setProperty('display', 'none', 'important');
    if (vistaDetalle) vistaDetalle.style.setProperty('display', 'block', 'important');
  };

  // RENDERIZAR LISTA
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

  // CARGAR DE STORAGE
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

  // BOTÓN + NUEVA HERRAMIENTA -> Muestra la vista con campos limpios
  if (btnNuevaHerramienta) {
    btnNuevaHerramienta.addEventListener('click', () => {
      mostrarVistaDetalle(null); // Pasa null para activar modo creación
    });
  }

  // GUARDAR (CREAR O EDITAR)
  if (formEditar) {
    formEditar.addEventListener('submit', (e) => {
      e.preventDefault();

      const datosFormulario = {
        nombre: campoNombre ? campoNombre.value.trim() : '',
        estado: campoEstado ? campoEstado.value : 'disponible',
        ubicacion: campoUbicacion ? campoUbicacion.value.trim() : '',
        notas: campoNotas ? campoNotas.value.trim() : '',
        categoria: 'Herramientas',
        unidades: herramientaSeleccionada ? herramientaSeleccionada.unidades : []
      };

      if (!datosFormulario.nombre) {
        alert("El nombre de la herramienta es obligatorio.");
        return;
      }

      try {
        if (herramientaSeleccionada) {
          // MODO EDICIÓN -> Actualiza existente
          if (typeof updateItem === 'function') {
            updateItem("herramientas", herramientaSeleccionada.id, datosFormulario);
          }
        } else {
          // MODO CREACIÓN -> Agrega nuevo item
          if (typeof addItem === 'function') {
            addItem("herramientas", datosFormulario);
          }
        }

        // Recarga y regresa a la lista
        cargarYRenderizar();
        mostrarVistaListado();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // BUSCADOR Y VOLVER
  if (inputBuscar) {
    inputBuscar.addEventListener('input', (e) => renderizarHerramientas(e.target.value));
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

  // Inicialización
  mostrarVistaListado();
  await cargarYRenderizar();
});