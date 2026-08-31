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
//edicion de herramientas
document.addEventListener("DOMContentLoaded", () => {
  // 1. Selección de elementos del DOM 
  const filaHerramienta = document.querySelector(".fila-herramienta");
  const panelInfo = document.getElementById("panel-info");
  const formEditar = document.getElementById("form-editar-herramienta");
  const btnVolver = document.getElementById("btn-volver");
  const btnCancelarEdicion = document.getElementById("btn-cancelar-edicion");

  // Campos del formulario
  const campoNombre = document.getElementById("campo-nombre");
  const campoEstado = document.getElementById("campo-estado");
  const campoUbicacion = document.getElementById("campo-ubicacion");
  const campoNotas = document.getElementById("campo-notas");
  const detalleTitulo = document.getElementById("detalle-titulo");

  let herramientaSeleccionadaId = null;

  // paso 1: Mantener oculto el panel de edición de inicio
  if (panelInfo) {
    panelInfo.style.display = "none";
  }

  // paso 2: Al hacer clic en la herramienta, desplegar el panel y cargar sus datos
  if (filaHerramienta) {
    filaHerramienta.addEventListener("click", () => {
      herramientaSeleccionadaId = filaHerramienta.getAttribute("data-id");

      // Consultar datos almacenados en storage.js
      const coleccion = getCollection("herramientas");
      const datosGuardados = coleccion.find((item) => String(item.id) === String(herramientaSeleccionadaId));

      const nombre = datosGuardados?.nombre || filaHerramienta.querySelector(".herramienta-nombre")?.textContent || "";
      const ubicacion = datosGuardados?.ubicacion || filaHerramienta.querySelector(".herramienta-ubicacion")?.textContent || "";
      const estado = datosGuardados?.estado || "nueva";
      const notas = datosGuardados?.notas || "";

      // Rellenar formulario
      if (campoNombre) campoNombre.value = nombre;
      if (campoUbicacion) campoUbicacion.value = ubicacion;
      if (campoEstado) campoEstado.value = estado;
      if (campoNotas) campoNotas.value = notas;
      if (detalleTitulo) detalleTitulo.textContent = nombre;

      // Desplegar sección
      if (panelInfo) {
        panelInfo.style.display = "block";
      }

      // Alerta con app.js
      if (typeof showAlert === "function") {
        showAlert(`Editando herramienta: ${nombre}`, "info");
      }
    });
  }

  // paso 3: Guardar los cambios editados
  if (formEditar) {
    formEditar.addEventListener("submit", (event) => {
      event.preventDefault(); // Evita recargar la página

      const cambios = {
        nombre: campoNombre?.value.trim(),
        estado: campoEstado?.value,
        ubicacion: campoUbicacion?.value.trim(),
        notas: campoNotas?.value.trim(),
      };

      // Guardar actualización en storage.js
      if (herramientaSeleccionadaId) {
        updateItem("herramientas", herramientaSeleccionadaId, cambios);
      }

      // Actualizar vista visual
      if (detalleTitulo && cambios.nombre) {
        detalleTitulo.textContent = cambios.nombre;
      }

      const nombreSpan = filaHerramienta?.querySelector(".herramienta-nombre");
      const ubicacionSpan = filaHerramienta?.querySelector(".herramienta-ubicacion");
      if (nombreSpan && cambios.nombre) nombreSpan.textContent = cambios.nombre;
      if (ubicacionSpan && cambios.ubicacion) ubicacionSpan.textContent = cambios.ubicacion;

      // Alerta de confirmación con app.js
      if (typeof showAlert === "function") {
        showAlert("Cambios guardados correctamente", "success");
      }
    });
  }

  // Ocultar sección al cancelar o volver
  const ocultarEdicion = () => {
    if (panelInfo) panelInfo.style.display = "none";
    if (formEditar) formEditar.reset();
  };

  if (btnCancelarEdicion) btnCancelarEdicion.addEventListener("click", ocultarEdicion);
  if (btnVolver) btnVolver.addEventListener("click", ocultarEdicion);
});
