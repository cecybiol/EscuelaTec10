document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializar almacenamiento si existe la función global
  if (typeof initStorage === 'function') {
    initStorage();
  }

  // ==========================================
  // ITERACIÓN 1: Selección del DOM con IDs exactos y únicos
  // ==========================================
  const searchInput = document.getElementById('search-insumos');
  const btnNuevoInsumo = document.getElementById('btn-nuevo-insumo');
  const btnFilterCategory = document.getElementById('btn-filter-category');
  const tableInsumos = document.getElementById('table-insumos');
  const tbodyInsumos = document.getElementById('tbody-insumos');
  const rowsInsumos = tbodyInsumos ? Array.from(tbodyInsumos.querySelectorAll('tr')) : [];

  // Verificación en consola pedida en el checklist
  console.log('Buscador:', searchInput);
  console.log('Botón Nuevo Insumo:', btnNuevoInsumo);
  console.log('Tabla Insumos:', tableInsumos);
  console.log('Filas de Tabla:', rowsInsumos);

  // Helper para notificaciones (usa app.js si está cargado)
  const notify = (mensaje, tipo = 'info') => {
    if (typeof showAlert === 'function') {
      showAlert(mensaje, tipo);
    } else {
      mostrarAlertaAccion(mensaje, tipo);
    }
  };

  // ==========================================
  // ITERACIÓN 2 Y 3: Eventos y Manipulación del DOM
  // ==========================================

  // 1. BOTÓN + NUEVO INSUMO (Agrega a la tabla y persiste en localStorage)
  if (btnNuevoInsumo) {
    btnNuevoInsumo.addEventListener('click', (e) => {
      e.preventDefault();

      const nombre = prompt('Nombre del nuevo insumo:');
      if (!nombre || !nombre.trim()) return;

      const nuevoInsumo = {
        id: Date.now(),
        nombre: nombre.trim(),
        categoria: 'General',
        stock: 5,
        unidad: 'unidades'
      };

      // Guardar en LocalStorage
      const insumos = JSON.parse(localStorage.getItem('insumos')) || [];
      insumos.push(nuevoInsumo);
      localStorage.setItem('insumos', JSON.stringify(insumos));

      // Insertar en la tabla dinámicamente
      crearFilaInsumo(nuevoInsumo);
      notify(`Insumo "${nuevoInsumo.nombre}" agregado con éxito`, 'success');
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

    // Aplica debounce de app.js si existe
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

  // 4. BOTONES RELLENAR (Insumos líquidos)
  const botonesRellenar = document.querySelectorAll('.btn-refill');
  botonesRellenar.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const contenedor = btn.closest('.card-product') || btn.parentElement;
      const tituloElemento = contenedor ? contenedor.querySelector('h4') : null;
      const nombreInsumo = tituloElemento ? tituloElemento.textContent.trim() : 'Insumo líquido';

      notify(`Solicitud de rellenado enviada para: ${nombreInsumo}`, 'success');
    });
  });

  // 5. DELEGACIÓN DE EVENTOS EN LA TABLA (Botones Editar)
  document.addEventListener('click', (e) => {
    const btnEdit = e.target.closest('.btn-sm, .btn-edit');
    if (btnEdit && tbodyInsumos && tbodyInsumos.contains(btnEdit)) {
      e.preventDefault();
      const fila = btnEdit.closest('tr');
      const nombre = fila ? fila.querySelector('strong')?.textContent : 'Insumo';
      notify(`Editando insumo: ${nombre}`, 'info');
    }
  });

  // ==========================================
  // ITERACIÓN 3: Función de creación de fila en el DOM
  // ==========================================
  function crearFilaInsumo(insumo) {
    if (!tbodyInsumos) return;

    let alertClass = 'alert-success';
    let estadoTexto = 'Normal';

    if (insumo.stock === 0) {
      alertClass = 'alert-error';
      estadoTexto = 'Agotado';
    } else if (insumo.stock < 5) {
      alertClass = 'alert-warning';
      estadoTexto = 'Stock Bajo';
    }

    const tr = document.createElement('tr');
    tr.dataset.id = insumo.id || Date.now();
    tr.innerHTML = `
      <td><strong>${insumo.nombre}</strong></td>
      <td>${insumo.categoria}</td>
      <td>${insumo.stock} ${insumo.unidad || 'unidades'}</td>
      <td><span class="alert ${alertClass}">${estadoTexto}</span></td>
      <td><button type="button" class="btn-sm btn-edit">Editar</button></td>
    `;

    tbodyInsumos.appendChild(tr);
  }
  // =========================================================
// E3-10 y E3-11: CLASE INSUMO (MODELO Y ENCAPSULACIÓN)
// =========================================================
class Insumo {
  constructor(id, nombre, cantidad, unidad = 'unidades', umbral = 5) {
    if (!id || !nombre) {
      throw new Error("El ID y nombre son obligatorios.");
    }
    this.id = id;
    this.nombre = nombre;
    this.unidad = unidad;
    
    // Reglas de validación para cantidad y umbral
    this.setCantidad(cantidad);
    this.setUmbral(umbral);
    this.movimientos = []; // Trazabilidad
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

  // Tareas E3-11: Registrar Entradas y Salidas con trazabilidad
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
// E3-09: AVISOS DE STOCK SIN DUPLICADOS (TEMPORIZADOR)
// =========================================================
let alertaTimeout = null;

function mostrarAlertaStock(mensaje, tipo = 'info') {
  // Limpiar el temporizador previo si existe para no duplicar avisos
  if (alertaTimeout) {
    clearTimeout(alertaTimeout);
  }

  // Usar la función global showAlert o alert
  if (typeof showAlert === 'function') {
    showAlert(mensaje, tipo);
  } else {
    alert(mensaje);
  }

  // Desaparecer la alerta a los 3 segundos sin recargar inventario
  alertaTimeout = setTimeout(() => {
    alertaTimeout = null;
  }, 3000);
}
});