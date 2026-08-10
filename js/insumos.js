document.addEventListener('DOMContentLoaded', () => {

// 1. Seleccionar los elementos de esta página

const formulario = document.querySelector('#formulario');

const botonNuevo = document.querySelector('#btn-nuevo');

const tarjetas = document.querySelectorAll('.card');

// 2. Verificar durante el desarrollo

console.log({ formulario, botonNuevo, tarjetas });

});