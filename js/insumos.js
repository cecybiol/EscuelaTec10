document.addEventListener('DOMContentLoaded', () => {

  // 1. Seleccionar los elementos del DOM mediante los IDs y clases agregados al HTML
  const buscador = document.querySelector('#btn-filter') || document.querySelector('input[type="text"]');
  const tabla = document.querySelector('table');
  const filas = document.querySelectorAll('tbody tr');
  const botonNuevo = document.querySelector('#btn-nuevo') || document.querySelector('.btn-refill');
  const botonesRellenar = document.querySelectorAll('.btn-refill');

  // 2. Mostrar la referencia de cada elemento en la consola (consigna)
  console.log({ 
    buscador, 
    tabla, 
    filas, 
    botonNuevo,
    botonesRellenar
  });

  // 3. Funcionalidad: Filtro en tiempo real sobre la tabla
  if (buscador) {
    buscador.addEventListener('input', (e) => {
      const termino = e.target.value.toLowerCase().trim();

      filas.forEach(fila => {
        const textoFila = fila.textContent.toLowerCase();
        fila.style.display = textoFila.includes(termino) ? '' : 'none';
      });
    });
  }

  // 4. Acciones de prueba para los botones
  if (botonNuevo) {
    botonNuevo.addEventListener('click', () => {
      alert('Acción: Abrir formulario de nuevo insumo.');
    });
  }

  botonesRellenar.forEach((boton) => {
    boton.addEventListener('click', (e) => {
      const tarjeta = e.target.closest('.card-product');
      const nombre = tarjeta ? tarjeta.querySelector('h4').textContent : 'insumo';
      alert(`Acción: Rellenando ${nombre}`);
    });
  });

});