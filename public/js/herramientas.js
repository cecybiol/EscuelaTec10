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
// CONTROLADOR Y VISTAS (DOM & REPOSITORIO)
// =================================================================
document.addEventListener('DOMContentLoaded', async () => {

  const vistaListado = document.getElementById('vista-lista') || document.getElementById('herramientas');
  const vistaDetalle = document.getElementById('vista-detalle');
  
  const btnNuevaHerramienta = document.getElementById('btn-nueva-herramienta');
  const listaContenedor = document.getElementById('lista-herramientas');
  const inputBuscar = document.getElementById('input-buscar');

  const formEditar = document.getElementById('form-editar-herramienta') || document.querySelector('#vista-detalle form');
  const detalleTitulo = document.getElementById('detalle-titulo');
  const campoNombre = document.getElementById('campo-nombre') || document.querySelector('[name="nombre"]');
  const campoEstado = document.getElementById('campo-estado') || document.querySelector('[name="estado"]');
  const campoUbicacion = document.getElementById('campo-ubicacion') || document.querySelector('[name="ubicacion"]');
  const campoNotas = document.getElementById('campo-notas') || document.querySelector('[name="notas"]');
  
  const contenedorHistorial = document.querySelector('#panel-historial .historial-lista') || 
                               document.querySelector('.historial-lista');

  const btnVolver = document.getElementById('btn-volver');
  const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');

  const tabInfo = document.getElementById('tab-info');
  const tabHistorial = document.getElementById('tab-historial');
  const panelInfo = document.getElementById('panel-info');
  const panelHistorial = document.getElementById('panel-historial');

  let herramientaSeleccionada = null; 
  let herramientas = [];

  // MUESTRA ESTADOS DE CARGA Y ERROR EN #lista-herramientas
  const mostrarCargando = () => {
    if (listaContenedor) {
      listaContenedor.innerHTML = `<li class="estado-loading" style="padding: 1.5rem; text-align: center;">Cargando catálogo compartido...</li>`;
    }
  };

  const mostrarError = (mensaje) => {
    if (listaContenedor) {
      listaContenedor.innerHTML = `<li class="estado-error" style="padding: 1.5rem; text-align: center; color: #d9534f;">⚠️ ${mensaje}</li>`;
    }
  };

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

  // RENDER HISTORIAL
  const renderHistorial = (herramientaId) => {
    if (!contenedorHistorial) return;
    contenedorHistorial.innerHTML = '';

    const herramienta = herramientas.find(h => String(h.id) === String(herramientaId));
    if (!herramienta) return;

    let eventos = [];

    eventos.push({
      id: `reg-${herramienta.id}`,
      fecha: herramienta.fechaCreacion || new Date().toISOString(),
      descripcion: 'Registrada en el sistema'
    });

    if (typeof getCollection === 'function') {
      const todosPrestamos = getCollection('prestamos') || [];
      const prestamosHerramienta = todosPrestamos.filter(p => 
        String(p.herramientaId) === String(herramientaId) || 
        String(p.idHerramienta) === String(herramientaId)
      );

      prestamosHerramienta.forEach(p => {
        const usuario = p.usuarioNombre || p.usuario || p.solicitante || 'Usuario no especificado';
        
        if (p.fechaPrestamo || p.fecha) {
          eventos.push({
            id: `p-inicio-${p.id}`,
            fecha: p.fechaPrestamo || p.fecha,
            descripcion: `Prestada a ${usuario}`
          });
        }

        if (p.devuelto || p.estado === 'devuelto' || p.fechaDevolucion) {
          eventos.push({
            id: `p-fin-${p.id}`,
            fecha: p.fechaDevolucion || p.fechaPrestamo || new Date().toISOString(),
            descripcion: 'Devuelta al depósito'
          });
        }
      });
    }

    eventos.sort((a, b) => {
      const fechaA = new Date(a.fecha).getTime() || 0;
      const fechaB = new Date(b.fecha).getTime() || 0;
      if (fechaB !== fechaA) return fechaB - fechaA;
      return String(b.id).localeCompare(String(a.id));
    });

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

  // NAVEGACIÓN DE VISTAS
  const mostrarVistaListado = () => {
    herramientaSeleccionada = null;
    if (vistaDetalle) vistaDetalle.style.setProperty('display', 'none', 'important');
    if (vistaListado) vistaListado.style.setProperty('display', 'block', 'important');
  };

  const mostrarVistaDetalle = (herramienta = null) => {
    herramientaSeleccionada = herramienta;

    if (herramienta) {
      if (detalleTitulo) detalleTitulo.textContent = herramienta.nombre;
      if (campoNombre) campoNombre.value = herramienta.nombre;
      if (campoEstado) campoEstado.value = herramienta.estado;
      if (campoUbicacion) campoUbicacion.value = herramienta.ubicacion;
      if (campoNotas) campoNotas.value = herramienta.notas;

      renderHistorial(herramienta.id);
    } else {
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

  // CARGA DESDE REPOSITORIO (COMPARTIDO O FALLBACK)
  const cargarYRenderizar = async () => {
    mostrarCargando();

    try {
      if (typeof initStorage === 'function') {
        await initStorage();
      }

      // Usa la función del repositorio para obtener el catálogo
      const rawData = typeof listarHerramientas === 'function' 
        ? await listarHerramientas() 
        : (typeof getCollection === 'function' ? getCollection('herramientas') : []);

      herramientas = rawData.map(item => new Herramienta(item));
      renderizarHerramientas();
    } catch (err) {
      console.error("Error al cargar desde el repositorio:", err);
      mostrarError(err.message || 'Error al conectar con el catálogo compartido.');
    }
  };

  // BOTÓN + NUEVA HERRAMIENTA
  if (btnNuevaHerramienta) {
    btnNuevaHerramienta.addEventListener('click', () => mostrarVistaDetalle(null));
  }

  // GUARDAR (CREAR / EDITAR EN REPOSITORIO)
  if (formEditar) {
    formEditar.addEventListener('submit', async (e) => {
      e.preventDefault();

      const datosFormulario = {
        id: herramientaSeleccionada ? herramientaSeleccionada.id : null,
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
        // Intenta guardar a través del repositorio
        if (typeof guardarHerramienta === 'function') {
          await guardarHerramienta(datosFormulario);
        }

        await cargarYRenderizar();
        mostrarVistaListado();
      } catch (err) {
        alert(`Error al guardar: ${err.message}`);
      }
    });
  }

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

    if (herramientaSeleccionada) {
      renderHistorial(herramientaSeleccionada.id);
    }
  };

  if (tabInfo) tabInfo.addEventListener('click', activarTabInfo);
  if (tabHistorial) tabHistorial.addEventListener('click', activarTabHistorial);

  // Carga inicial
  mostrarVistaListado();
  await cargarYRenderizar();
});