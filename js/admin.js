// Iteración 1: Selección del DOM (4 elementos pedidos + tarjetas)
const tablaUsuarios = document.getElementById('tablaUsuarios');
const botonNuevo = document.getElementById('nuevoUsuario');
const buscador = document.getElementById('buscador');
const seccionReportes = document.getElementById('seccionReportes');
const tarjetas = document.querySelectorAll('.card');

// Console.log de verificación (Soluciona el error 'tarjetas is not defined')
console.log({ tablaUsuarios, botonNuevo, buscador, seccionReportes, tarjetas });

// Iteración 2: Evento change en el selector de rol
const selectorRol = document.getElementById('selectorRol');
if (selectorRol) {
  selectorRol.addEventListener('change', (e) => {
    console.log('Rol seleccionado:', e.target.value);
  });
}

// Iteración 3: Manipulación del DOM (Crear fila con createElement y setAttribute)
function agregarUsuario(id, nombre, email, rol, estado) {
  const lista = document.getElementById('listaUsuarios');
  const tr = document.createElement('tr');
  
  // Asignar el rol como atributo
  tr.setAttribute('data-rol', rol.toLowerCase());

  tr.innerHTML = `
    <td>${id}</td>
    <td>${nombre}</td>
    <td>${email}</td>
    <td>${rol}</td>
    <td><span class="badge active">${estado}</span></td>
    <td>
      <button class="btn-action btn-edit">Editar</button>
      <button class="btn-action btn-delete">Eliminar</button>
    </td>
  `;

  lista.appendChild(tr);
}