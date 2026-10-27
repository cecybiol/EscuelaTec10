document.addEventListener("DOMContentLoaded", async () => {

    // Verificación de sesión de usuario
    try {
        if (typeof comprobarSesion === 'function') {
            const sesion = await comprobarSesion();
            if (!sesion) return;
            if (typeof aplicarPermisos === 'function') aplicarPermisos();
        }
    } catch (e) {
        console.error("Error comprobando sesión:", e);
    }

    // =========================
    // BUSCAR SIN VOLVER A DESCARGAR 
    // =========================
    document.querySelector('#buscar-prestamo')
        .addEventListener('input', event => {
            const texto = event.target.value.trim().toLocaleLowerCase();
            
            // Adaptación: en vez de insumos, filtramos un arreglo "prestamos"
            const visibles = prestamos.filter(item =>
                item.solicitante.toLocaleLowerCase().includes(texto)
            );
            
            // Adaptación: función para re-dibujar la tabla
            renderizarPrestamos(visibles);
        });
    // Obtener formulario
    const formulario = document.querySelector("#formulario");

    // Obtener botón Registrar
    const botonRegistrar = document.querySelector("#btn-registrar");

    // Obtener tabla
    const tablaHistorial = document.querySelector("#tabla-historial");

    // Obtener cuerpo de la tabla
    const historial = document.querySelector("#historial");
    // ==========================================
    // CARGAR HERRAMIENTAS DESDE EL ALMACENAMIENTO (Equipo Herramientas)
    // ==========================================
    // ==========================================
    // CARGAR HERRAMIENTAS Y SOLICITANTES (API / BD)
    // ==========================================
    async function cargarSelectHerramientas() {
        const selectItem = document.getElementById('item');
        if (!selectItem) return;

        let herramientas = [];
        try {
            if (typeof api === 'function') {
                // Consulta los ejemplares reales registrados en MariaDB
                herramientas = await api('detalle_objeto');
            } else {
                herramientas = typeof getCollection === 'function' ? getCollection('herramientas') : [];
            }
        } catch (e) {
            herramientas = typeof getCollection === 'function' ? getCollection('herramientas') : [];
        }

        selectItem.innerHTML = '<option value="">-- Seleccionar herramienta --</option>';

        herramientas.forEach(h => {
            const opcion = document.createElement('option');
            opcion.value = h.id;
            opcion.setAttribute('data-id', h.id);
            const nombre = h.objeto_nombre || h.nombre || h.id;
            opcion.textContent = `${nombre} (${h.ubicacion || 'Sin ubicación'}) - [${h.estado || 'disponible'}]`;

            if (h.estado === 'en_uso' || h.estado === 'baja' || h.estado === 'rota' || h.estado === 'pendiente') {
                opcion.disabled = true;
            }

            selectItem.appendChild(opcion);
        });
    }

    async function cargarSelectSolicitantes() {
        const selectSolicitante = document.getElementById('solicitante');
        if (!selectSolicitante || selectSolicitante.tagName !== 'SELECT') return;

        try {
            if (typeof api === 'function') {
                const usuarios = await api('usuarios');
                selectSolicitante.innerHTML = '<option value="">-- Seleccionar Solicitante --</option>';
                usuarios.filter(u => u.activo).forEach(u => {
                    const opt = document.createElement('option');
                    opt.value = u.id; // Guarda el ID de usuario (ej: USR-001)
                    opt.textContent = `${u.alias} (${u.rol || 'Usuario'})`;
                    selectSolicitante.appendChild(opt);
                });
            }
        } catch (e) {
            console.error("Error cargando solicitantes:", e);
        }
    }
    // =========================
    // LISTA Y RENDERIZADO (Págs. 11 y 12 de la teoría)
    // =========================
    // =========================
    // LISTA Y RENDERIZADO
    // =========================
    let prestamos = [];

    async function cargarPrestamos() {
        try {
            if (typeof listarPrestamos === 'function') {
                prestamos = await listarPrestamos();
            }
        } catch (e) {
            console.error("Error consultando préstamos:", e);
        }
        renderizarPrestamos(prestamos);
    }

    function renderizarPrestamos(datos) {
        historial.replaceChildren();
        datos.forEach(item => {
            const nuevaFila = document.createElement("tr");

            const detalleId = item.detalle_id || "";
            const esDevuelto = String(item.estado).toLowerCase() === "devuelto";
            const textoBoton = esDevuelto ? "Devuelto" : "Devolver";
            const estadoBoton = esDevuelto ? "disabled" : "";

            nuevaFila.innerHTML = `
                <td>${item.solicitante || '—'}</td>
                <td>${item.item || '—'}</td>
                <td>${item.cantidad || '1'} u.</td>
                <td style="max-width: 250px; overflow-wrap: break-word;">${item.observaciones || 'Sin comentarios'}</td>
                <td><span class="badge">${item.estado || 'activo'}</span></td>
                <td><button type="button" class="btn-sm" data-detalle-id="${detalleId}" ${estadoBoton}>${textoBoton}</button></td>
            `;
            historial.appendChild(nuevaFila);
        });
    }

    // Carga inicial conectada
    await cargarSelectSolicitantes();
    await cargarSelectHerramientas();
    await cargarPrestamos();

    // =========================
    // REGISTRAR PRÉSTAMO LALALA
    // =========================

    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const solicitante = document.querySelector("#solicitante").value;
        const item = document.querySelector("#item");
        const cantidad = document.querySelector("#cantidad").value;
        const observaciones = document.querySelector("#observaciones").value;
        const fechaPrevistaInput = document.querySelector("#fecha_prevista");
        const fecha_prevista = fechaPrevistaInput ? fechaPrevistaInput.value : new Date().toISOString().split('T')[0];

        if (!item.value || !solicitante) {
            alert("Debe seleccionar un solicitante y una herramienta válida.");
            return;
        }

        // Si la función global del backend existe, guarda en MariaDB
        if (typeof crearPrestamo === 'function') {
            try {
                await crearPrestamo({
                    solicitante_id: solicitante,
                    fecha_prevista: fecha_prevista,
                    unidades: [item.value],
                    observaciones: observaciones
                });
                await cargarPrestamos();
                await cargarSelectHerramientas();
            } catch (err) {
                alert(`Error al registrar en BD: ${err.message}`);
                return;
            }
        } else {
            // Respaldo local
            const nombreItem = item.options[item.selectedIndex].text;
            prestamos.push({ solicitante, item: nombreItem, cantidad, observaciones, estado: "Activo" });
            renderizarPrestamos(prestamos);
        }

        formulario.reset();
        if (document.querySelector("#cantidad")) document.querySelector("#cantidad").value = 1;
        console.log("Préstamo registrado correctamente");
    });

    // =========================
    // DEVOLVER PRÉSTAMO
    // =========================

      historial.addEventListener("click", async (evento) => {
        if (evento.target.classList.contains("btn-sm")) {
            const boton = evento.target;
            const detalleId = boton.dataset.detalleId;

            if (detalleId && typeof devolverUnidad === 'function') {
                try {
                    await devolverUnidad(detalleId);
                    await cargarPrestamos();
                    await cargarSelectHerramientas();
                } catch (err) {
                    alert(`Error al registrar devolución: ${err.message}`);
                }
            } else {
                // Respaldo local
                const fila = boton.closest("tr");
                const nombreSolicitante = fila.querySelector("td").textContent;
                const prestamoEncontrado = prestamos.find(p => p.solicitante === nombreSolicitante && p.estado === "Activo");
                if (prestamoEncontrado) prestamoEncontrado.estado = "Devuelto";
                renderizarPrestamos(prestamos);
            }
        }
    });

});