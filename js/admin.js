// Usuarios cargados desde el JSON
let usuariosCargados = [];

// Clave para guardar los cambios en el navegador
const claveUsuarios = 'escuelatec10_usuarios';


// Seleccionar los elementos de la página
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


// Selector de rol
const selectorRol = document.getElementById('selectorRol');

if (selectorRol) {
  selectorRol.addEventListener('change', (e) => {
    console.log('Rol seleccionado:', e.target.value);
  });
}


// Crear una fila de usuario
function agregarUsuario(id, nombre, email, rol, estado) {
  const lista = document.getElementById('listaUsuarios');

  if (!lista) {
    console.error('No se encontró la lista de usuarios');
    return;
  }

  const tr = document.createElement('tr');

  // Guardar el rol como atributo
  tr.setAttribute('data-rol', rol.toLowerCase());

  // Guardar el ID como atributo
  tr.setAttribute('data-id', id);

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

  // Estado
  const estadoBadge = document.createElement('span');
  estadoBadge.textContent = estado;
  estadoBadge.classList.add('badge', 'active');

  tdEstado.appendChild(estadoBadge);

  // Botón Editar
  const botonEditar = document.createElement('button');
  botonEditar.textContent = 'Editar';
  botonEditar.classList.add('btn-action', 'btn-edit');
  botonEditar.setAttribute('data-accion', 'editar');
  botonEditar.setAttribute('data-id', id);

  // Botón Eliminar
  const botonEliminar = document.createElement('button');
  botonEliminar.textContent = 'Eliminar';
  botonEliminar.classList.add('btn-action', 'btn-delete');
  botonEliminar.setAttribute('data-accion', 'eliminar');
  botonEliminar.setAttribute('data-id', id);

  // Agregar botones
  tdAcciones.appendChild(botonEditar);
  tdAcciones.appendChild(botonEliminar);

  // Agregar celdas
  tr.appendChild(tdId);
  tr.appendChild(tdNombre);
  tr.appendChild(tdEmail);
  tr.appendChild(tdRol);
  tr.appendChild(tdEstado);
  tr.appendChild(tdAcciones);

  // Agregar fila
  lista.appendChild(tr);
}


// Mostrar usuarios en la tabla
function mostrarUsuarios(usuarios) {
  const lista = document.getElementById('listaUsuarios');

  if (!lista) {
    console.error('No se encontró la lista de usuarios');
    return;
  }

  lista.innerHTML = '';

  usuarios.forEach((usuario) => {

    const estado = usuario.activo ? 'Activo' : 'Inactivo';

    agregarUsuario(
      usuario.id,
      usuario.alias,
      '—',
      usuario.rol,
      estado
    );
  });
}


// Guardar usuarios en el navegador
function guardarUsuarios() {
  localStorage.setItem(
    claveUsuarios,
    JSON.stringify(usuariosCargados)
  );
}


// Cargar usuarios
async function cargarUsuarios() {

  try {

    // Comprobar si ya hay cambios guardados
    const usuariosGuardados = localStorage.getItem(claveUsuarios);

    if (usuariosGuardados) {

      usuariosCargados = JSON.parse(usuariosGuardados);

      console.log(
        'Usuarios cargados desde localStorage:',
        usuariosCargados
      );

      mostrarUsuarios(usuariosCargados);

      return;
    }


    // Si no hay cambios guardados, cargar JSON
    const respuesta = await fetch('../data/usuarios.json');

    if (!respuesta.ok) {
      throw new Error(
        'No se pudo cargar el archivo usuarios.json'
      );
    }

    const usuarios = await respuesta.json();

    console.log(
      'Usuarios cargados desde JSON:',
      usuarios
    );

    usuariosCargados = usuarios;

    mostrarUsuarios(usuariosCargados);

  } catch (error) {

    console.error(
      'Error al cargar usuarios:',
      error
    );

  }
}


// BUSCADOR
if (buscador) {

  buscador.addEventListener('input', () => {

    const texto = buscador.value
      .toLowerCase()
      .trim();

    const usuariosFiltrados =
      usuariosCargados.filter((usuario) => {

        return (
          usuario.id.toLowerCase().includes(texto) ||
          usuario.alias.toLowerCase().includes(texto) ||
          usuario.rol.toLowerCase().includes(texto)
        );

      });

    mostrarUsuarios(usuariosFiltrados);

  });
}


// BOTÓN NUEVO USUARIO
if (botonNuevo) {

  botonNuevo.addEventListener('click', () => {

    const alias = prompt(
      'Ingrese el nombre del nuevo usuario:'
    );

    if (!alias) {
      return;
    }

    const rol = prompt(
      'Ingrese el rol del usuario:\n\nadmin\noperador\nlector'
    );

    if (!rol) {
      return;
    }


    // Generar un nuevo ID
    const nuevoNumero =
      usuariosCargados.length + 1;

    const nuevoId =
      'USR-' +
      String(nuevoNumero).padStart(3, '0');


    // Crear nuevo usuario
    const nuevoUsuario = {

      id: nuevoId,

      alias: alias,

      rol: rol.toLowerCase(),

      activo: true

    };


    // Agregarlo al array
    usuariosCargados.push(nuevoUsuario);


    // Guardar cambios
    guardarUsuarios();


    // Actualizar tabla
    mostrarUsuarios(usuariosCargados);


    console.log(
      'Nuevo usuario agregado:',
      nuevoUsuario
    );

  });

}


// BOTONES EDITAR Y ELIMINAR
const listaUsuarios =
  document.getElementById('listaUsuarios');


if (listaUsuarios) {

  listaUsuarios.addEventListener(
    'click',
    (e) => {

      const boton =
        e.target.closest('button');

      if (!boton) {
        return;
      }


      const accion =
        boton.getAttribute('data-accion');

      const id =
        boton.getAttribute('data-id');


      const usuario =
        usuariosCargados.find(
          (usuario) => usuario.id === id
        );


      if (!usuario) {
        return;
      }


      // EDITAR
      if (accion === 'editar') {

        const nuevoAlias =
          prompt(
            'Modificar nombre del usuario:',
            usuario.alias
          );


        if (!nuevoAlias) {
          return;
        }


        const nuevoRol =
          prompt(
            'Modificar rol:\n\nadmin\noperador\nlector',
            usuario.rol
          );


        if (!nuevoRol) {
          return;
        }


        usuario.alias = nuevoAlias;

        usuario.rol =
          nuevoRol.toLowerCase();


        guardarUsuarios();

        mostrarUsuarios(
          usuariosCargados
        );


        console.log(
          'Usuario editado:',
          usuario
        );

      }


      // ELIMINAR
      if (accion === 'eliminar') {

        const confirmar =
          confirm(
            '¿Seguro que querés eliminar al usuario ' +
            usuario.alias +
            '?'
          );


        if (!confirmar) {
          return;
        }


        usuariosCargados =
          usuariosCargados.filter(
            (usuarioActual) =>
              usuarioActual.id !== id
          );


        guardarUsuarios();

        mostrarUsuarios(
          usuariosCargados
        );


        console.log(
          'Usuario eliminado:',
          id
        );

      }

    }
  );

}


// Sección de reportes
if (seccionReportes) {

  seccionReportes.innerHTML += `
    <p>Los reportes están disponibles para consultar.</p>
  `;

}


// Iniciar carga de usuarios
cargarUsuarios();