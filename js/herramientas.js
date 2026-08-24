document.addEventListener('DOMContentLoaded', () => {
  // Elementos de la página
  const modal = document.getElementById('-nueva-herramienta');
  const btnAbrir = document.getElementById('btn-nueva-herramienta');
  const btnCerrar = document.getElementById('btn-cerrar-modal-nueva');
  const btnCancelar = document.getElementById('btn-cancelar-nueva');
  const overlay = document.getElementById('modal-nueva-overlay');
  const form = document.getElementById('form-nueva-herramienta');
  const listaContenedor = document.getElementById('lista-herramientas');

  let herramientas = JSON.parse(localStorage.getItem('herramientas')) || [];

  const abrirModal = () => modal.classList.add('is-visible');
  
  const cerrarModal = () => {
    modal.classList.remove('is-visible');
    form.reset(); // Limpia los campos tras cerrar
  };

  const renderizarHerramientas = () => {
    if (!listaContenedor) return;
    listaContenedor.innerHTML = '';

    if (herramientas.length === 0) {
      listaContenedor.innerHTML = '<p>No hay herramientas registradas.</p>';
      return;
    }

    herramientas.forEach((herramienta, index) => {
      const tarjeta = document.createElement('div');
      tarjeta.classList.add('tarjeta-herramienta');
      tarjeta.innerHTML = `
        <h3>${herramienta.nombre}</h3>
        <p><strong>Estado:</strong> ${herramienta.estado}</p>
        <p><strong>Ubicación:</strong> ${herramienta.ubicacion || 'No especificada'}</p>
        <p><strong>Notas:</strong> ${herramienta.notas || 'Sin notas'}</p>
        <button type="button" class="btn-eliminar" data-index="${index}">Eliminar</button>
      `;
      listaContenedor.appendChild(tarjeta);
    });

    document.querySelectorAll('.btn-eliminar').forEach(boton => {
      boton.addEventListener('click', (e) => {
        const idx = e.target.getAttribute('data-index');
        herramientas.splice(idx, 1);
        localStorage.setItem('herramientas', JSON.stringify(herramientas));
        renderizarHerramientas();
      });
    });
  };

  // ESTA FUNCIÓN HACE AMBAS COSAS AL PRESIONAR "GUARDAR"
  const guardarHerramienta = (e) => {
    e.preventDefault(); // Evita que se recargue la página

    // PASO 1: Captura los datos del formulario
    const nuevaHerramienta = {
      nombre: document.getElementById('nueva-nombre').value.trim(),
      estado: document.getElementById('nueva-estado').value,
      ubicacion: document.getElementById('nueva-ubicacion').value.trim(),
      notas: document.getElementById('nueva-notas').value.trim()
    };

    if (!nuevaHerramienta.nombre || !nuevaHerramienta.estado) {
      alert('Por favor completa el nombre y el estado.');
      return;
    }

    // PASO 2: Guarda la información en memoria
    herramientas.push(nuevaHerramienta);
    localStorage.setItem('herramientas', JSON.stringify(herramientas));

    // PASO 3: Muestra la nueva herramienta en la pantalla
    renderizarHerramientas();

    // PASO 4: OCULTA Y DESAPARECE EL MODAL AUTOMÁTICAMENTE
    cerrarModal();
  };

  // Eventos de botones
  btnAbrir.addEventListener('click', abrirModal);
  btnCerrar.addEventListener('click', cerrarModal);
  btnCancelar.addEventListener('click', cerrarModal);
  if (overlay) overlay.addEventListener('click', cerrarModal);

  // Al hacer clic en "Guardar herramienta"
  form.addEventListener('submit', guardarHerramienta);

  renderizarHerramientas();
});