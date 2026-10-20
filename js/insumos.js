// Variable global para almacenar la lista de insumos
let listaInsumos = [];

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Inicializar almacenamiento si existe la función global
  if (typeof initStorage === 'function') {
    initStorage();
  }

  // ==========================================
  // SELECCIÓN DEL DOM
  // ==========================================
  const searchInput = document.getElementById('search-insumos');
  const btnNuevoInsumo = document.getElementById('btn-nuevo-insumo');
  const btnFilterCategory = document.querySelector('.btn-secondary');
  const tbodyInsumos = document.getElementById('tbody-insumos');
  const estadoElemento = document.querySelector('#estado-insumos');

  // Helper para notificaciones
  const notify = (mensaje, tipo = 'info') => {
    if (typeof showAlert === 'function') {
      showAlert(mensaje, tipo);
    } else {
      mostrarAlertaStock(mensaje, tipo);
    }
  };

  // ==========================================
  // CARGA ASÍNCRONA DESDE JSON / LOCALSTORAGE
  // ==========================================
  try {
    if (estadoElemento) estadoElemento.textContent = 'Cargando insumos...';

    const insumosGuardados = JSON.parse(localStorage.getItem('insumos'));

    if (insumosGuardados && insumosGuardados.length > 0) {
      // Reinstanciar desde localStorage a la clase Insumo
      listaInsumos = insumosGuardados.map(
        data => new Insumo(data.id, data.nombre, data.cantidad ?? data.stockActual ?? data.stock, data.unidad, data.umbral || 5)
      );
    } else if (typeof cargarDatos === 'function') {
      // Cargar del JSON asíncrono si localStorage está vacío
      const datosJson = await cargarDatos({ origen: 'json', recurso: '../data/insumos.json' });      
      listaInsumos = datosJson.map(
        item => new Insumo(item.id, item.nombre, item.cantidad ?? item.stockActual ?? item.stock, item.unidad, item.umbral || 5)
      );

      guardarEnLocalStorage();
    }

    renderizarInsumos(listaInsumos);
    if (estadoElemento) estadoElemento.textContent = '';
  } catch (error) {
    if (estadoElemento) estadoElemento.textContent = `Error: ${error.message}`;
    notify(`Error al cargar datos: ${error.message}`, 'danger');
  }

  // ==========================================
  // EVENTOS DEL DOM
  // ==========================================

  // 1. BOTÓN + NUEVO INSUMO
  if (btnNuevoInsumo) {
    btnNuevoInsumo.addEventListener('click', (e) => {
      e.preventDefault();

      const nombre = prompt('Nombre del nuevo insumo:');
      if (!nombre || !nombre.trim()) return;

      try {
        const nuevo = new Insumo(Date.now(), nombre.trim(), 5, 'unidades', 5);
        listaInsumos.push(nuevo);
        
        guardarEnLocalStorage();
        renderizarInsumos(listaInsumos);
        notify(`Insumo "${nuevo.nombre}" agregado con éxito`, 'success');
      } catch (err) {
        notify(err.message, 'danger');
      }
    });
  }

  // 2. BUSCADOR CON DEBOUNCE
  if (searchInput) {
    const ejecutarBusqueda = (e) => {
      if (!tbodyInsumos) return;
      const query = e.target.value.toLowerCase().trim();
      const filas = tbodyInsumos.querySelectorAll('tr');

      filas.forEach((fila) => {
        const textoFila = fila.textContent.toLowerCase();
        fila.style.display = textoFila.includes(query) ? '' : 'none';
      });
    };

    if (typeof debounce === 'function') {
      searchInput.addEventListener('input', debounce(ejecutarBusqueda, 300));
    } else {
      searchInput.addEventListener('input', ejecutarBusqueda);
    }
  }

  // 3. BOTÓN FILTRAR CATEGORÍA
  if (btnFilterCategory) {
    btnFilterCategory.addEventListener('click', (e) => {
      e.preventDefault();
      notify('Filtro por categoría activado', 'info');
    });
  }

  // 4. BOTONES RELLENAR
  const botonesRellenar = document.querySelectorAll('.btn-action');
  botonesRellenar.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const contenedor = btn.closest('.card-product') || btn.parentElement;
      const tituloElemento = contenedor ? contenedor.querySelector('.title, h4') : null;
      const nombreInsumo = tituloElemento ? tituloElemento.textContent.trim() : 'Insumo líquido';

      notify(`Solicitud de rellenado enviada para: ${nombreInsumo}`, 'success');
    });
  });

  // 5. DELEGACIÓN DE EVENTOS EN LA TABLA
  document.addEventListener('click', (e) => {
    const btnEdit = e.target.closest('.btn-sm, .btn-edit');
    if (btnEdit && tbodyInsumos && tbodyInsumos.contains(btnEdit)) {
      e.preventDefault();
      const fila = btnEdit.closest('tr');
      const nombre = fila ? fila.querySelector('strong')?.textContent : 'Insumo';
      notify(`Editando insumo: ${nombre}`, 'info');
    }
  });
});

// ==========================================
// FUNCIONES DE RENDERIZADO Y PERSISTENCIA (GLOBALES)
// ==========================================
function renderizarInsumos(datos) {
  const tbody = document.querySelector('#tbody-insumos');
  const lista = document.querySelector('#lista-insumos');

  if (tbody) {
    tbody.replaceChildren();

    datos.forEach(item => {
      const stock = item.cantidad !== undefined ? item.cantidad : (item.stockActual ?? item.stock ?? 0);
      const estado = typeof item.obtenerEstado === 'function' ? item.obtenerEstado() : (stock === 0 ? 'Critico' : stock < 5 ? 'Stock Bajo' : 'Normal');

      let tagClass = 'tag-success';
      if (estado === 'Critico' || estado === 'Agotado') tagClass = 'tag-danger';
      else if (estado === 'Stock Bajo') tagClass = 'tag-warning';

      const tr = document.createElement('tr');
      tr.dataset.id = item.id;
      tr.innerHTML = `
        <td><strong>${item.nombre}</strong></td>
        <td>${item.categoria || 'General'}</td>
        <td>${stock} ${item.unidad || 'unidades'}</td>
        <td><span class="status-tag ${tagClass}">${estado}</span></td>
        <td><button type="button" class="btn-sm btn-edit">Editar</button></td>
      `;
      tbody.append(tr);
    });
  }

  if (lista) {
    lista.replaceChildren();

    datos.forEach(item => {
      const stock = item.cantidad !== undefined ? item.cantidad : (item.stockActual ?? item.stock ?? 0);
      const fila = document.createElement('li');
      fila.textContent = `${item.nombre} · stock: ${stock}`;
      fila.dataset.id = item.id;
      lista.append(fila);
    });
  }
}

function guardarEnLocalStorage() {
  localStorage.setItem('insumos', JSON.stringify(listaInsumos));
}

// =========================================================
// CLASE INSUMO (MODELO Y ENCAPSULACIÓN)
// =========================================================
class Insumo {
  constructor(id, nombre, cantidad, unidad = 'unidades', umbral = 5) {
    if (!id || !nombre) {
      throw new Error("El ID y nombre son obligatorios.");
    }
    this.id = id;
    this.nombre = nombre;
    this.unidad = unidad;
    
    this.setCantidad(cantidad);
    this.setUmbral(umbral);
    this.movimientos = [];
  }

  setCantidad(valor) {
    const num = Number(valor);
    if (isNaN(num) || num < 0) {
      throw new Error("La cantidad debe ser mayor o igual a 0.");
    }
    this.cantidad = num;
  }

  setUmbral(valor) {
    const num = Number(valor);
    if (isNaN(num) || num <= 0) {
      throw new Error("El umbral debe ser mayor a 0.");
    }
    this.umbral = num;
  }

  obtenerEstado() {
    if (this.cantidad === 0) return 'Critico';
    if (this.cantidad <= this.umbral) return 'Stock Bajo';
    return 'Normal';
  }

  registrarEntrada(cantidad, usuario = 'Usuario Prueba') {
    const cant = Number(cantidad);
    if (isNaN(cant) || cant <= 0) {
      throw new Error("La cantidad a ingresar debe ser mayor a 0.");
    }

    this.cantidad += cant;
    this.movimientos.push({
      tipo: 'Entrada',
      cantidad: cant,
      saldoResultante: this.cantidad,
      fecha: new Date().toISOString(),
      usuario: usuario
    });
    return true;
  }

  registrarSalida(cantidad, usuario = 'Usuario Prueba') {
    const cant = Number(cantidad);
    if (isNaN(cant) || cant <= 0) {
      throw new Error("La cantidad a retirar debe ser mayor a 0.");
    }
    if (cant > this.cantidad) {
      throw new Error("Stock insuficiente para registrar la salida.");
    }

    this.cantidad -= cant;
    this.movimientos.push({
      tipo: 'Salida',
      cantidad: cant,
      saldoResultante: this.cantidad,
      fecha: new Date().toISOString(),
      usuario: usuario
    });
    return true;
  }
}

// =========================================================
// AVISOS DE STOCK SIN DUPLICADOS
// =========================================================
let alertaTimeout = null;

function mostrarAlertaStock(mensaje, tipo = 'info') {
  if (alertaTimeout) {
    clearTimeout(alertaTimeout);
  }

  if (typeof showAlert === 'function') {
    showAlert(mensaje, tipo);
  } else {
    alert(mensaje);
  }

  alertaTimeout = setTimeout(() => {
    alertaTimeout = null;
  }, 3000);
}