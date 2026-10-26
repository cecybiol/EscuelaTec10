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


// Función para actualizar las tarjetas de resumen y reportes de forma dinámica
function actualizarEstadisticas() {
  const totalRegistrados = usuariosCargados.length;

  const totalAdmins = usuariosCargados.filter(usuario => {
    const rol = usuario.rol ? usuario.rol.toLowerCase() : '';
    return rol === 'admin' || rol === 'administrador';
  }).length;

  const solicitudesGuardadas = JSON.parse(localStorage.getItem('escuelatec10_solicitudes')) || [];
  const totalSolicitudes = solicitudesGuardadas.length > 0 ? solicitudesGuardadas.length : 2;

  const elRegistrados = document.getElementById('totalRegistrados');
  const elAdmins = document.getElementById('totalAdministradores');
  const elSolicitudes = document.getElementById('totalSolicitudes');

  if (elRegistrados) elRegistrados.textContent = totalRegistrados;
  if (elAdmins) elAdmins.textContent = totalAdmins;
  if (elSolicitudes) elSolicitudes.textContent = totalSolicitudes;

  const textoRepUsuarios = document.getElementById('textoReporteUsuarios');
  const textoRepAdmins = document.getElementById('textoReporteAdmins');

  if (textoRepUsuarios) {
    textoRepUsuarios.textContent = `Total de usuarios registrados: ${totalRegistrados}`;
  }
  if (textoRepAdmins) {
    textoRepAdmins.textContent = `Administradores registrados: ${totalAdmins}`;
  }
}


// Crear una fila de usuario
function agregarUsuario(id, nombre, email, rol, estado) {
  const lista = document.getElementById('listaUsuarios');

  if (!lista) {
    console.error('No se encontró la lista de usuarios');
    return;
  }

  const tr = document.createElement('tr');

  tr.setAttribute('data-rol', rol.toLowerCase());
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

  const estadoBadge = document.createElement('span');
  estadoBadge.textContent = estado;
  estadoBadge.classList.add('badge', 'active');

  tdEstado.appendChild(estadoBadge);

  const botonEditar = document.createElement('button');
  botonEditar.textContent = 'Editar';
  botonEditar.classList.add('btn-action', 'btn-edit');
  botonEditar.setAttribute('data-accion', 'editar');
  botonEditar.setAttribute('data-id', id);

  const botonEliminar = document.createElement('button');
  botonEliminar.textContent = 'Eliminar';
  botonEliminar.classList.add('btn-action', 'btn-delete');
  botonEliminar.setAttribute('data-accion', 'eliminar');
  botonEliminar.setAttribute('data-id', id);

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
    const usuariosGuardados = localStorage.getItem(claveUsuarios);

    if (usuariosGuardados) {
      usuariosCargados = JSON.parse(usuariosGuardados);
      console.log('Usuarios cargados desde localStorage:', usuariosCargados);
      mostrarUsuarios(usuariosCargados);
      actualizarEstadisticas();
      return;
    }

    const respuesta = await fetch('../data/usuarios.json');

    if (!respuesta.ok) {
      throw new Error('No se pudo cargar el archivo usuarios.json');
    }

    const usuarios = await respuesta.json();
    console.log('Usuarios cargados desde JSON:', usuarios);

    usuariosCargados = usuarios;
    mostrarUsuarios(usuariosCargados);
    actualizarEstadisticas();

  } catch (error) {
    console.error('Error al cargar usuarios:', error);
  }
}


// BUSCADOR
if (buscador) {
  buscador.addEventListener('input', () => {
    const texto = buscador.value.toLowerCase().trim();

    const usuariosFiltrados = usuariosCargados.filter((usuario) => {
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
    const alias = prompt('Ingrese el nombre del nuevo usuario:');
    if (!alias) return;

    const rol = prompt('Ingrese el rol del usuario:\n\nadmin\noperador\nlector');
    if (!rol) return;

    const nuevoNumero = usuariosCargados.length + 1;
    const nuevoId = 'USR-' + String(nuevoNumero).padStart(3, '0');

    const nuevoUsuario = {
      id: nuevoId,
      alias: alias,
      rol: rol.toLowerCase(),
      activo: true
    };

    usuariosCargados.push(nuevoUsuario);
    guardarUsuarios();
    mostrarUsuarios(usuariosCargados);
    actualizarEstadisticas();

    console.log('Nuevo usuario agregado:', nuevoUsuario);
  });
}


// BOTONES EDITAR Y ELIMINAR
const listaUsuarios = document.getElementById('listaUsuarios');

if (listaUsuarios) {
  listaUsuarios.addEventListener('click', (e) => {
    const boton = e.target.closest('button');
    if (!boton) return;

    const accion = boton.getAttribute('data-accion');
    const id = boton.getAttribute('data-id');

    const usuario = usuariosCargados.find((usuario) => usuario.id === id);
    if (!usuario) return;

    // EDITAR
    if (accion === 'editar') {
      const nuevoAlias = prompt('Modificar nombre del usuario:', usuario.alias);
      if (!nuevoAlias) return;

      const nuevoRol = prompt('Modificar rol:\n\nadmin\noperador\nlector', usuario.rol);
      if (!nuevoRol) return;

      usuario.alias = nuevoAlias;
      usuario.rol = nuevoRol.toLowerCase();

      guardarUsuarios();
      mostrarUsuarios(usuariosCargados);
      actualizarEstadisticas();

      console.log('Usuario editado:', usuario);
    }

    // ELIMINAR
    if (accion === 'eliminar') {
      const confirmar = confirm('¿Seguro que querés eliminar al usuario ' + usuario.alias + '?');
      if (!confirmar) return;

      usuariosCargados = usuariosCargados.filter((usuarioActual) => usuarioActual.id !== id);

      guardarUsuarios();
      mostrarUsuarios(usuariosCargados);
      actualizarEstadisticas();

      console.log('Usuario eliminado:', id);
    }
  });
}


// --- FUNCIONALIDAD DE LOS BOTONES DE EXPORTACIÓN ---

function descargarCSV(nombreArchivo, datosArray) {
  if (datosArray.length === 0) {
    alert('No hay datos para exportar.');
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,ID,Nombre,Rol,Estado\n';

  datosArray.forEach(user => {
    const estadoTexto = user.activo ? 'Activo' : 'Inactivo';
    csvContent += `${user.id},"${user.alias}",${user.rol},${estadoTexto}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', nombreArchivo);
  document.body.appendChild(link);

  link.click();
  document.body.removeChild(link);
}

const btnExportarUsuarios = document.getElementById('exportarUsuarios');
if (btnExportarUsuarios) {
  btnExportarUsuarios.addEventListener('click', () => {
    descargarCSV('reporte_usuarios_escuelatec10.csv', usuariosCargados);
  });
}

const btnExportarAdmins = document.getElementById('exportarAdministradores');
if (btnExportarAdmins) {
  btnExportarAdmins.addEventListener('click', () => {
    const soloAdmins = usuariosCargados.filter(usuario => {
      const rol = usuario.rol ? usuario.rol.toLowerCase() : '';
      return rol === 'admin' || rol === 'administrador';
    });
    descargarCSV('reporte_administradores_escuelatec10.csv', soloAdmins);
  });
}


// Iniciar carga de usuarios
cargarUsuarios();