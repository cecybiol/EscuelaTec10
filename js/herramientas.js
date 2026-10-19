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

  constructor({ id = null, codigo = null, nombre, categoria = 'Herramientas', estado = null, ubicacion = '', notas = '', fechaCreacion = null, unidades = [] }) {
    super({ id: id || codigo, nombre, categoria });

    this.codigo = codigo || this.id;
    this.ubicacion = ubicacion ? ubicacion.trim() : 'Sin ubicación';
    this.notas = notas ? notas.trim() : '';
    this.unidades = Array.isArray(unidades) ? unidades : [];
    this.fechaCreacion = fechaCreacion || new Date().toISOString();

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

  // Formulario y campos de detalle
  const formEditar = document.getElementById('form-editar-herramienta') || document.querySelector('#vista-detalle form');
  const detalleTitulo = document.getElementById('detalle-titulo');
  const campoNombre = document.getElementById('campo-nombre') || document.querySelector('[name="nombre"]');
  const campoEstado = document.getElementById('campo-estado') || document.querySelector('[name="estado"]');
  const campoUbicacion = document.getElementById('campo-ubicacion') || document.querySelector('[name="ubicacion"]');
  const campoNotas = document.getElementById('campo-notas') || document.querySelector('[name="notas"]');
  
  // Historial DOM
  const contenedorHistorial = document.querySelector('#panel-historial .historial-lista') || 
                               document.querySelector('.historial-lista');

  // Botones de navegación
  const btnVolver = document.getElementById('btn-volver');
  const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');

  const tabInfo = document.getElementById('tab-info');
  const tabHistorial = document.getElementById('tab-historial');
  const panelInfo = document.getElementById('panel-info');
  const panelHistorial = document.getElementById('panel-historial');

  let herramientaSeleccionada = null; 
  let herramientas = [];

  // FUNCIÓN AUXILIAR: Formatear fechas (ej: "15 jun 2025")
  const formatearFecha = (fechaString) => {
    if (!fechaString) return 'Fecha desconocida';
    const fecha = new Date(fechaString);
    if (isNaN(fecha.getTime())) return fechaString;

    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // =================================================================
  // RENDERIZAR HISTORIAL DINÁMICO
  // =================================================================
  const renderHistorial = (herramientaId) => {
    if (!contenedorHistorial) return;

    // Limpia el HTML estático de ejemplo
    contenedorHistorial.innerHTML = '';

    const herramienta = herramientas.find(h => String(h.id) === String(herramientaId));
    if (!herramienta) return;

    let eventos = [];

    // 1. Evento inicial: Registro de la herramienta
    eventos.push({
      id: `reg-${herramienta.id}`,
      fecha: herramienta.fechaCreacion || new Date().toISOString(),
      descripcion: 'Registrada en el sistema'
    });

    // 2. Eventos desde la colección "prestamos" en storage
    if (typeof getCollection === 'function') {
      const todosPrestamos = getCollection('prestamos') || [];

      // Filtra préstamos que pertenecen a esta herramienta
      const prestamosHerramienta = todosPrestamos.filter(p => 
        String(p.herramientaId) === String(herramientaId) || 
        String(p.idHerramienta) === String(herramientaId)
      );

      prestamosHerramienta.forEach(p => {
        const usuario = p.usuarioNombre || p.usuario || p.solicitante || 'Usuario no especificado';
        
        // Evento de salida por préstamo
        if (p.fechaPrestamo || p.fecha) {
          eventos.push({
            id: `p-inicio-${p.id}`,
            fecha: p.fechaPrestamo || p.fecha,
            descripcion: `Prestada a ${usuario}`
          });
        }

        // Evento de devolución si ya fue devuelta
        if (p.devuelto || p.estado === 'devuelto' || p.fechaDevolucion) {
          eventos.push({
            id: `p-fin-${p.id}`,
            fecha: p.fechaDevolucion || p.fechaPrestamo || new Date().toISOString(),
            descripcion: 'Devuelta al depósito'
          });
        }
      });
    }

    // 3. Ordenar cronológicamente: de más reciente a más antiguo
    eventos.sort((a, b) => {
      const fechaA = new Date(a.fecha).getTime() || 0;
      const fechaB = new Date(b.fecha).getTime() || 0;
      if (fechaB !== fechaA) {
        return fechaB - fechaA; // Orden por fecha
      }
      return String(b.id).localeCompare(String(a.id)); // Desempate seguro por ID
    });

    // 4. Inyectar dinámicamente en el DOM
    if (eventos.length === 0) {
      contenedorHistorial.innerHTML = '<li class="historial-item">Sin historial registrado.</li>';
      return;
    }

    eventos.forEach(ev => {
      const li = document.createElement('li');
      li.classList.add('historial-item');
      li.innerHTML = `
        <span class="historial-fecha">${formatearFecha(ev.fecha)}</span>
        <span class="historial-evento">${ev.descripcion}</span>
      `;
      contenedorHistorial.appendChild(li);
    });
  };

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

      // Generar el historial de la herramienta seleccionada
      renderHistorial(herramienta.id);
    } else {
      // MODO NUEVA HERRAMIENTA
      if (detalleTitulo) detalleTitulo.textContent = 'Nueva Herramienta';
      if (campoNombre) campoNombre.value = '';
      if (campoEstado) campoEstado.value = 'disponible';
      if (campoUbicacion) campoUbicacion.value = '';
      if (campoNotas) campoNotas.value = '';

      if (contenedorHistorial) {
        contenedorHistorial.innerHTML = '<li class="historial-item">Se generará historial al guardar.</li>';
      }
    }

    activarTabInfo();

    if (vistaListado) vistaListado.style.setProperty('display', 'none', 'important');
    if (vistaDetalle) vistaDetalle.style.setProperty('display', 'block', 'important');
  };

  // RENDERIZAR LISTA PRINCIPAL
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

  // BOTÓN NUEVA HERRAMIENTA
  if (btnNuevaHerramienta) {
    btnNuevaHerramienta.addEventListener('click', () => mostrarVistaDetalle(null));
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
          if (typeof updateItem === 'function') {
            updateItem("herramientas", herramientaSeleccionada.id, datosFormulario);
          }
        } else {
          datosFormulario.fechaCreacion = new Date().toISOString();
          if (typeof addItem === 'function') {
            addItem("herramientas", datosFormulario);
          }
        }

        cargarYRenderizar();
        mostrarVistaListado();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // BUSCADOR Y NAVEGACIÓN
  if (inputBuscar) {
    inputBuscar.addEventListener('input', (e) => renderizarHerramientas(e.target.value));
  }

  if (btnVolver) btnVolver.addEventListener('click', mostrarVistaListado);
  if (btnCancelarEdicion) btnCancelarEdicion.addEventListener('click', mostrarVistaListado);

  // PESTAÑAS (TABS)
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

    // Re-renderiza el historial cuando la pestaña se vuelve activa
    if (herramientaSeleccionada) {
      renderHistorial(herramientaSeleccionada.id);
    }
  };

  if (tabInfo) tabInfo.addEventListener('click', activarTabInfo);
  if (tabHistorial) tabHistorial.addEventListener('click', activarTabHistorial);

  // Inicialización
  mostrarVistaListado();
  await cargarYRenderizar();
});