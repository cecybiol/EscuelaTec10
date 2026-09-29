const tablaUsuarios = document.getElementById('tablaUsuarios');
const botonNuevo = document.getElementById('nuevoUsuario');
const buscador = document.getElementById('buscador');
const seccionReportes = document.getElementById('seccionReportes');
const tarjetas = document.querySelectorAll('.card');

console.log({
  tablaUsuarios,
  botonNuevo,
  buscador,
  seccionReportes,
  tarjetas
});

const selectorRol = document.getElementById('selectorRol');

if (selectorRol) {
  selectorRol.addEventListener('change', (e) => {
    console.log('Rol seleccionado:', e.target.value);
  });
}


function agregarUsuario(id, nombre, email, rol, estado) {
  const lista = document.getElementById('listaUsuarios');

  const tr = document.createElement('tr');

  tr.setAttribute('data-rol', rol.toLowerCase());

  const tdId = document.createElement('td');
  const tdNombre = document.createElement('td');
  const tdEmail = document.createElement('td');
  const tdRol = document.createElement('td');
  const tdEstado = document.createElement('td');
  const tdAcciones = document.createElement('td');

  tdId.textContent = id;
  tdNombre.textContent = nombre;
  tdEmail.textContent = email;
  tdRol.textContent = rol;
 
  const estadoBadge = document.createElement('span');
  estadoBadge.textContent = estado;
 
  estadoBadge.classList.add('badge', 'active');

  tdEstado.appendChild(estadoBadge);

  const botonEditar = document.createElement('button');
  botonEditar.textContent = 'Editar';
  botonEditar.classList.add('btn-action', 'btn-edit');

  const botonEliminar = document.createElement('button');
  botonEliminar.textContent = 'Eliminar';
  botonEliminar.classList.add('btn-action', 'btn-delete');

  // Agregar los botones a la celda
  tdAcciones.appendChild(botonEditar);
  tdAcciones.appendChild(botonEliminar);

  tr.appendChild(tdId);
  tr.appendChild(tdNombre);
  tr.appendChild(tdEmail);
  tr.appendChild(tdRol);
  tr.appendChild(tdEstado);
  tr.appendChild(tdAcciones);

  lista.appendChild(tr);
}



seccionReportes.innerHTML += `
  <p>Los reportes están disponibles para consultar.</p>
`;

