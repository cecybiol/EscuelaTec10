/**
 * Módulo de Gestión de Insumos - EscuelaTEC
 * js/insumos.js
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Storage
  if (typeof initStorage === 'function') {
    initStorage();
  }

  // 2. Referencias exactas
  const searchInput = document.getElementById('search-insumos') || document.getElementById('btn-filter');
  const btnNuevoInsumo = document.getElementById('btn-nuevo-insumo') || document.getElementById('btn-nuevo');
  const tbodyInsumos = document.getElementById('tbody-insumos') || document.querySelector('.table tbody');

  // Helper para alertas
  const notify = (mensaje, tipo = 'info') => {
    if (typeof showAlert === 'function') {
      showAlert(mensaje, tipo);
    } else {
      alert(mensaje);
    }
  };

  // ==========================================
  // FUNCIONALIDAD 1: BOTONES RELLENAR (ESPECÍFICO)
  // ==========================================
  const btnsRefill = document.querySelectorAll('.btn-refill');
  btnsRefill.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Buscar el título dentro del contenedor padre
      const contenedor = btn.closest('.card-product') || btn.parentElement;
      const tituloElemento = contenedor ? contenedor.querySelector('h4') : null;
      const nombreInsumo = tituloElemento ? tituloElemento.textContent.trim() : 'Insumo líquido';

      notify(`Solicitud de rellenado enviada para: ${nombreInsumo}`, 'success');
    });
  });

  // ==========================================
  // FUNCIONALIDAD 2: BUSCADOR DE INSUMOS
  // ==========================================
  if (searchInput) {
    const ejecutarBusqueda = (query) => {
      if (!tbodyInsumos) return;
      const filas = tbodyInsumos.querySelectorAll('tr');

      filas.forEach((fila) => {
        const textoFila = fila.textContent.toLowerCase();
        fila.style.display = textoFila.includes(query) ? '' : 'none';
      });
    };

    if (typeof debounce === 'function') {
      searchInput.addEventListener('input', debounce((e) => {
        ejecutarBusqueda(e.target.value.toLowerCase().trim());
      }, 300));
    } else {
      searchInput.addEventListener('input', (e) => {
        ejecutarBusqueda(e.target.value.toLowerCase().trim());
      });
    }
  }

  // ==========================================
  // FUNCIONALIDAD 3: BOTÓN "+ NUEVO INSUMO"
  // ==========================================
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

      const insumos = JSON.parse(localStorage.getItem('insumos')) || [];
      insumos.push(nuevoInsumo);
      localStorage.setItem('insumos', JSON.stringify(insumos));

      crearFilaInsumo(nuevoInsumo);
      notify(`Insumo "${nuevoInsumo.nombre}" agregado con éxito`, 'success');
    });
  }

  // ==========================================
  // FUNCIONALIDAD 4: OTROS BOTONES (EDITAR / FILTRAR)
  // ==========================================
  document.addEventListener('click', (e) => {
    // Botones Editar en la tabla
    const btnEdit = e.target.closest('.btn-sm, .btn-edit');
    if (btnEdit && tbodyInsumos && tbodyInsumos.contains(btnEdit)) {
      e.preventDefault();
      const fila = btnEdit.closest('tr');
      const nombre = fila ? fila.querySelector('td').textContent.trim() : 'Insumo';
      notify(`Editando insumo: ${nombre}`, 'info');
      return;
    }

    // Botón Filtrar
    const btnFilter = e.target.closest('#btn-filter-category');
    if (btnFilter) {
      e.preventDefault();
      notify('Filtros por categoría activados', 'info');
    }
  });

  // ==========================================
  // MANIPULACIÓN DEL DOM: CREAR FILA EN TABLA
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
});