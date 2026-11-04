let listaInsumos = [];

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Comprobación de sesión obligatoria (F08)
  try {
    if (!await comprobarSesion()) return;
  } catch (error) {
    showAlert(error.message, 'error');
    return;
  }

  // ==========================================
  // SELECCIÓN DEL DOM
  // ==========================================
  const searchInput = document.getElementById('search-insumos');
  const btnNuevoInsumo = document.getElementById('btn-nuevo-insumo');
  const btnFilterCategory = document.querySelector('.btn-secondary');
  const tbodyInsumos = document.getElementById('tbody-insumos');
  const estadoElemento = document.querySelector('#estado-insumos');
  const formStock = document.querySelector('#form-stock');

  // Helper para notificaciones
  const notify = (mensaje, tipo = 'info') => {
    if (typeof showAlert === 'function') {
      showAlert(mensaje, tipo);
    } else {
      mostrarAlertaStock(mensaje, tipo);
    }
  };

  // ==========================================
  // CARGA ASÍNCRONA DESDE LA API (F08)
  // ==========================================
  async function cargarInsumos() {
    try {
      if (estadoElemento) estadoElemento.textContent = 'Cargando insumos...';

      const datos = await listarObjetos('insumo');
      
      listaInsumos = datos
        .filter(d => d.modo_control === 'cantidad')
        .map(d => {
          const item = new Insumo(d.id, d.nombre, d.stock, d.unidad, d.stockMinimo);
          item.ficha = d;
          item.categoria = d.categoria;
          item.ubicacion = d.ubicacion;
          return item;
        });

      renderizarInsumos(listaInsumos);
      actualizarSelectorStock();
      aplicarPermisos();

      if (estadoElemento) estadoElemento.textContent = '';
    } catch (error) {
      if (estadoElemento) estadoElemento.textContent = `Error: ${error.message}`;
      notify(`Error al cargar datos: ${error.message}`, 'danger');
    }
  }

  // Función para poblar el selector del formulario de stock (F16)
  function actualizarSelectorStock() {
    const selector = document.querySelector('#stock-id');
    if (!selector) return;
    selector.replaceChildren();
    
    listaInsumos.forEach(item => {
      const opcion = new Option(
        item.nombre + ' (' + (item.unidad ?? 'sin unidad') + ')',
        item.id
      );
      opcion.disabled = !item.unidad;
      selector.add(opcion);
    });
  }

  await cargarInsumos();

  // ==========================================
  // EVENTOS DEL DOM
  // ==========================================

  // 1. BOTÓN + NUEVO INSUMO (F09)
  if (btnNuevoInsumo) {
    btnNuevoInsumo.addEventListener('click', async (e) => {
      e.preventDefault();

      const nombre = prompt('Nombre del nuevo insumo:');
      if (!nombre || !nombre.trim()) return;

      try {
        await guardarObjeto({
          nombre: nombre.trim(),
          tipo: 'insumo',
          modo_control: 'cantidad',
          unidad: 'unidades',
          categoria: 'General',
          ubicacion: '',
          stockMinimo: 2,
          notas: 'Creado desde interfaz'
        });

        await cargarInsumos();
        notify(`Insumo "${nombre.trim()}" agregado con éxito`, 'success');
      } catch (err) {
        notify(err.message, 'danger');
      }
    });
  }

  // 2. FORMULARIO DE MOVIMIENTOS DE STOCK (F09 y F16)
  if (formStock) {
    formStock.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const idInsumo = document.querySelector('#stock-id').value;
        const tipoMovimiento = document.querySelector('#stock-tipo').value;
        const cantidadMov = Number(document.querySelector('#stock-cantidad').value);
        const motivoMov = document.querySelector('#stock-motivo').value;

        await api('stock', {
          metodo: 'POST',
          datos: {
            id: idInsumo,
            tipo: tipoMovimiento,
            cantidad: cantidadMov,
            motivo: motivoMov
          }
        });

        await cargarInsumos();
        formStock.reset();
        notify('Movimiento de stock registrado correctamente', 'success');
      } catch (error) {
        notify(error.message, 'danger');
      }
    });
  }

  // 3. BUSCADOR CON DEBOUNCE
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

  // 4. DELEGACIÓN DE EVENTOS EN LA TABLA (Edición / Baja)
  document.addEventListener('click', async (e) => {
    const btnEdit = e.target.closest('.btn-sm, .btn-edit');
    if (btnEdit && tbodyInsumos && tbodyInsumos.contains(btnEdit)) {
      e.preventDefault();
      const fila = btnEdit.closest('tr');
      const idInsumo = fila?.dataset.id;
      const itemEncontrado = listaInsumos.find(i => String(i.id) === String(idInsumo));
      
      if (!itemEncontrado) return;

      const nuevoNombre = prompt('Editar nombre del insumo:', itemEncontrado.nombre);
      if (nuevoNombre === null) return;

      try {
        await guardarObjeto({
          ...itemEncontrado.ficha,
          nombre: nuevoNombre.trim()
        });
        await cargarInsumos();
        notify('Insumo actualizado correctamente', 'success');
      } catch (error) {
        notify(error.message, 'danger');
      }
    }
  });
});

// ==========================================
// FUNCIONES DE RENDERIZADO (GLOBALES)
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

// =========================================================
// CLASES: ItemInventario e Insumo (Se conservan intactas)
// =========================================================
class ItemInventario {
  constructor(id, nombre, categoria = 'General') {
    if (!id || !nombre) {
      throw new Error("El ID y el nombre son obligatorios.");
    }
    this.id = id;
    this.nombre = nombre;
    this.categoria = categoria;
  }
}

class Insumo extends ItemInventario {
  constructor(id, nombre, cantidad, unidad = 'unidades', umbral = 5, categoria = 'General') {
    super(id, nombre, categoria);
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
    if (valor === null || valor === undefined || valor === '') {
      this.umbral = null; 
      return;
    }
    const num = Number(valor);
    if (isNaN(num) || num <= 0) {
      throw new Error("El umbral debe ser un número mayor a 0 o ser null.");
    }
    this.umbral = num;
  }

  obtenerEstado() {
    if (this.cantidad === 0) return 'Critico';
    if (this.umbral !== null && this.cantidad <= this.umbral) return 'Stock Bajo';
    return 'Normal';
  }
}

// (Funciones auxiliares de métricas y Firebase se mantienen al final si las requieres)