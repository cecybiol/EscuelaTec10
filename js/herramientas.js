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
      listaContenedor.innerHTML = '<li class="sin-herramientas">No hay herramientas registradas.</li>';
      return;
    }

    herramientas.forEach((herramienta, index) => {
      // 1. Creamos la fila <li> con las mismas clases que tu ejemplo
      const fila = document.createElement('li');
      fila.classList.add('fila-herramienta');
      fila.setAttribute('data-id', index + 1);
      fila.setAttribute('role', 'button');
      fila.setAttribute('tabindex', '0');
      fila.setAttribute('aria-label', `Ver detalle de ${herramienta.nombre}`);

      // 2. Formateamos el texto del estado (ej: "nueva" -> "Nueva")
      const estadoClase = herramienta.estado.toLowerCase();
      const estadoTexto = herramienta.estado.charAt(0).toUpperCase() + herramienta.estado.slice(1);

      // 3. Insertamos la estructura idéntica a tu ejemplo
      fila.innerHTML = `
        <span class="herramienta-nombre">${herramienta.nombre}</span>
        <span class="badge badge--${estadoClase}">${estadoTexto}</span>
        <span class="herramienta-ubicacion">${herramienta.ubicacion || 'Sin ubicación'}</span>
        <span class="herramienta-qr" aria-label="Código QR">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </span>
      `;

      listaContenedor.appendChild(fila);
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
