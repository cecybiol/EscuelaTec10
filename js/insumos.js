document.addEventListener('DOMContentLoaded', () => {

  // 1. SELECCIONAR LOS ELEMENTOS DE LA PÁGINA
  const buscador = document.querySelector('.header-actions input');
  const tabla = document.querySelector('table');
  const filas = document.querySelectorAll('tbody tr');
  const botonNuevo = document.querySelector('.header-actions .btn');
  const botonesRellenar = document.querySelectorAll('.btn-refill');
  const botonesEditar = document.querySelectorAll('.btn-sm');

  // 2. VERIFICAR SELECCIÓN EN CONSOLA (Requisito Iteración 1)
  console.log('--- ELEMENTOS DE INSUMOS CARGADOS ---');
  console.log({ buscador, tabla, filas, botonNuevo });

  // 3. AGREGAR EVENTOS Y FUNCIONALIDAD

  // Evento al botón "+ Nuevo Insumo"
  if (botonNuevo) {
    botonNuevo.addEventListener('click', () => {
      console.log('Se hizo clic en + Nuevo Insumo');
      alert('Abriendo formulario para agregar un nuevo insumo...');
    });
  }

  // Evento de búsqueda/filtro en tiempo real
  if (buscador) {
    buscador.addEventListener('input', (e) => {
      const texto = e.target.value.toLowerCase();
      console.log(`Buscando insumo: "${texto}"`);

      filas.forEach(fila => {
        const contenidoFila = fila.textContent.toLowerCase();
        if (contenidoFila.includes(texto)) {
          fila.style.display = '';
        } else {
          fila.style.display = 'none';
        }
      });
    });
  }

  // Evento a los botones de "Rellenar"
  botonesRellenar.forEach((boton, index) => {
    boton.addEventListener('click', (e) => {
      console.log(`Clic en Rellenar tarjeta #${index + 1}`);
      alert('¡Insumo rellenado con éxito al 100%!');
    });
  });

  // Evento a los botones de "Editar" en la tabla
  botonesEditar.forEach((boton, index) => {
    boton.addEventListener('click', (e) => {
      const fila = e.target.closest('tr');
      const nombreInsumo = fila ? fila.querySelector('strong')?.textContent : 'insumo';
      console.log(`Editando fila #${index + 1}: ${nombreInsumo}`);
      alert(`Editando datos de: ${nombreInsumo}`);
    });
  });

});