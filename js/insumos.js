document.addEventListener('DOMContentLoaded', () => {

  // 1. Seleccionar los elementos solicitados para el Equipo Insumos
  const buscador = document.querySelector('#btn-filter') || document.querySelector('input[type="text"]'); // Buscador / Filtro
  const tabla = document.querySelector('table');                          // La tabla de inventario
  const filas = document.querySelectorAll('tbody tr');                    // Las filas de la tabla
  const botonNuevo = document.querySelector('.btn-refill') || document.querySelector('#btn-nuevo'); // Botón Nuevo / Rellenar

// 2. Mostrar la referencia de cada elemento en la consola (como lo pide la consigna)
  console.log({ 
    buscador, 
    tabla, 
    filas, 
    botonNuevo

    });
});