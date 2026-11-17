document.addEventListener('DOMContentLoaded', async () => {

    const formulario = document.getElementById('formulario');
    const solicitante = document.getElementById('solicitante');
    const fechaPrevista = document.getElementById('fecha_prevista');
    const item = document.getElementById('item');
    const cantidad = document.getElementById('cantidad');
    const observaciones = document.getElementById('observaciones');

    const btnRegistrar = document.getElementById('btn-registrar');
    const btnCamara = document.getElementById('btn-camara');
    const btnDetener = document.getElementById('btn-detener');
    const btnAgregarQR = document.getElementById('btn-agregar-qr');

    const codigoQR = document.getElementById('codigo-qr');
    const estadoLector = document.getElementById('estado-lector');
    const historial = document.getElementById('historial');
    const buscarPrestamo = document.getElementById('buscar-prestamo');

    let herramientas = [];
    let prestamos = [];
    let lectorQR = null;
    let camaraActiva = false;

    // Relaciona el código QR con la unidad individual.
    const unidadesPorQR = new Map();

    // --------------------------------------------------
    // MENSAJES
    // --------------------------------------------------

    function mensaje(texto, tipo = 'info') {
        if (typeof showAlert === 'function') {
            showAlert(texto, tipo);
        } else {
            alert(texto);
        }
    }

    // --------------------------------------------------
    // FECHA LOCAL
    // --------------------------------------------------

    function fechaLocal() {
        const ahora = new Date();
        const anio = ahora.getFullYear();
        const mes = String(ahora.getMonth() + 1).padStart(2, '0');
        const dia = String(ahora.getDate()).padStart(2, '0');

        return `${anio}-${mes}-${dia}`;
    }

    fechaPrevista.min = fechaLocal();
    fechaPrevista.value = fechaLocal();

    // --------------------------------------------------
    // SESIÓN Y PERMISOS
    // --------------------------------------------------

    try {
        if (typeof comprobarSesion === 'function') {
            await comprobarSesion();
        }

        if (typeof aplicarPermisos === 'function') {
            aplicarPermisos();
        }

    } catch (error) {
        console.error('Error verificando sesión:', error);
        mensaje(error.message, 'error');
        return;
    }

    // --------------------------------------------------
    // CARGAR SOLICITANTES
    // --------------------------------------------------

    async function cargarSolicitantes() {

        solicitante.innerHTML = '';

        const inicial = document.createElement('option');
        inicial.value = '';
        inicial.textContent = 'Seleccionar solicitante...';

        solicitante.appendChild(inicial);

        try {

            const usuarios = await api('usuarios');

            if (!Array.isArray(usuarios)) {
                throw new Error('La API no devolvió una lista de usuarios.');
            }

            usuarios
                .filter(u => u.activo === true ||
                    Number(u.activo) === 1 ||
                    u.activo === undefined)
                .forEach(u => {

                    const opcion = document.createElement('option');

                    opcion.value = u.id;
                    opcion.textContent =
                        `${u.alias || u.nombre || u.id} (${u.rol || 'Usuario'})`;

                    solicitante.appendChild(opcion);
                });

        } catch (error) {

            console.error('Error cargando solicitantes:', error);
            mensaje('No se pudieron cargar los solicitantes: ' + error.message, 'error');
        }
    }

    // --------------------------------------------------
    // CARGAR HERRAMIENTAS Y SUS UNIDADES
    // --------------------------------------------------

    async function cargarHerramientas() {

        item.innerHTML = '';
        unidadesPorQR.clear();

        try {

            herramientas = await listarHerramientas();

            if (!Array.isArray(herramientas)) {
                throw new Error('La API no devolvió una lista de herramientas.');
            }

            herramientas.forEach(herramienta => {

                const unidades = Array.isArray(herramienta.unidades)
                    ? herramienta.unidades
                    : [];

                unidades.forEach(unidad => {

                    const qr = String(unidad.qr || '').trim();

                    if (!qr) return;

                    const disponible =
                        unidad.estado === 'disponible' &&
                        !(
                            unidad.prestado === true ||
                            Number(unidad.prestado) === 1
                        );

                    if (!disponible) return;

                    const registro = {
                        id: unidad.id,
                        qr: qr,
                        nombre: herramienta.nombre,
                        ubicacion: unidad.ubicacion || herramienta.ubicacion || 'Sin ubicación'
                    };

                    unidadesPorQR.set(qr.toUpperCase(), registro);

                    const opcion = document.createElement('option');

                    opcion.value = unidad.id;

                    opcion.textContent =
                        `${herramienta.nombre} · ${qr} · ${registro.ubicacion}`;

                    opcion.dataset.qr = qr;

                    item.appendChild(opcion);
                });

            });

            actualizarCantidad();

        } catch (error) {

            console.error('Error cargando herramientas:', error);
            mensaje('No se pudieron cargar las herramientas: ' + error.message, 'error');
        }
    }

    // --------------------------------------------------
    // ACTUALIZAR CANTIDAD
    // --------------------------------------------------

    function actualizarCantidad() {

        cantidad.value = Array.from(item.selectedOptions).length;
    }

    item.addEventListener('change', actualizarCantidad);

    // --------------------------------------------------
    // AGREGAR UNIDAD MEDIANTE SU QR
    // --------------------------------------------------

    function agregarPorQR(codigo) {

        const qr = String(codigo || '').trim().toUpperCase();

        if (!qr) {
            mensaje('Ingresá o escaneá un código QR.', 'warning');
            return false;
        }

        const unidad = unidadesPorQR.get(qr);

        if (!unidad) {
            mensaje(
                `No se encontró una unidad disponible con el código ${qr}.`,
                'warning'
            );
            return false;
        }

        const opcion = Array.from(item.options)
            .find(op => op.value === String(unidad.id));

        if (!opcion) {
            mensaje('La unidad no está disponible para seleccionar.', 'warning');
            return false;
        }

        if (opcion.selected) {
            mensaje(`La unidad ${qr} ya fue agregada.`, 'warning');
            return false;
        }

        opcion.selected = true;

        actualizarCantidad();

        mensaje(
            `Agregada: ${unidad.nombre} · ${qr} · ${unidad.ubicacion}`,
            'success'
        );

        return true;
    }

    // --------------------------------------------------
    // AGREGAR QR MANUALMENTE
    // --------------------------------------------------

    btnAgregarQR.addEventListener('click', () => {

        const agregado = agregarPorQR(codigoQR.value);

        if (agregado) {
            codigoQR.value = '';
            codigoQR.focus();
        }
    });

    codigoQR.addEventListener('keydown', event => {

        if (event.key === 'Enter') {
            event.preventDefault();
            btnAgregarQR.click();
        }
    });

    // --------------------------------------------------
    // CÁMARA Y LECTOR QR
    // --------------------------------------------------

    async function iniciarCamara() {

        if (camaraActiva) return;

        if (!window.isSecureContext) {

            mensaje(
                'La cámara necesita HTTPS. Abrí el sitio mediante una conexión segura o desde localhost.',
                'error'
            );

            estadoLector.textContent =
                'La página no está en un contexto seguro.';

            return;
        }

        if (typeof Html5Qrcode === 'undefined') {

            mensaje(
                'No se encontró la librería del lector QR. Revisá vendor/html5-qrcode.min.js.',
                'error'
            );

            return;
        }

        try {

            estadoLector.textContent = 'Solicitando acceso a la cámara...';

            lectorQR = new Html5Qrcode('lector-qr');

            await lectorQR.start(

                { facingMode: 'environment' },

                {
                    fps: 10,
                    qrbox: {
                        width: 250,
                        height: 250
                    },
                    aspectRatio: 1
                },

                codigoLeido => {

                    const codigo = String(codigoLeido).trim();

                    if (!codigo) return;

                    // Evita agregar varias veces el mismo QR.
                    agregarPorQR(codigo);
                },

                () => {
                    // Los errores de lectura de cada fotograma
                    // son normales mientras se busca un QR.
                }

            );

            camaraActiva = true;

            btnCamara.disabled = true;
            btnDetener.disabled = false;

            estadoLector.textContent =
                'Cámara activa. Enfocá el código QR de la herramienta.';

        } catch (error) {

            console.error('Error iniciando cámara:', error);

            estadoLector.textContent =
                'No se pudo iniciar la cámara. Revisá los permisos del navegador.';

            mensaje(
                'No se pudo iniciar la cámara: ' + (error.message || error),
                'error'
            );

            lectorQR = null;
            camaraActiva = false;
        }
    }

    // --------------------------------------------------
    // DETENER CÁMARA
    // --------------------------------------------------

    async function detenerCamara() {

        if (!lectorQR || !camaraActiva) return;

        try {

            await lectorQR.stop();
            await lectorQR.clear();

        } catch (error) {

            console.error('Error deteniendo cámara:', error);

        } finally {

            lectorQR = null;
            camaraActiva = false;

            btnCamara.disabled = false;
            btnDetener.disabled = true;

            estadoLector.textContent = 'Cámara apagada.';
        }
    }

    btnCamara.addEventListener('click', iniciarCamara);
    btnDetener.addEventListener('click', detenerCamara);

    // --------------------------------------------------
    // CARGAR PRÉSTAMOS
    // --------------------------------------------------

    async function cargarPrestamos() {

        try {

            prestamos = await listarPrestamos();

            if (!Array.isArray(prestamos)) {
                throw new Error('La API no devolvió una lista de préstamos.');
            }

            renderizarPrestamos(prestamos);

        } catch (error) {

            console.error('Error cargando préstamos:', error);

            historial.innerHTML = '';

            const fila = document.createElement('tr');
            const celda = document.createElement('td');

            celda.colSpan = 8;
            celda.textContent = 'Error al cargar los préstamos.';

            fila.appendChild(celda);
            historial.appendChild(fila);
        }
    }

    // --------------------------------------------------
    // MOSTRAR PRÉSTAMOS
    // --------------------------------------------------

    function renderizarPrestamos(datos) {

        historial.innerHTML = '';

        const filtro = buscarPrestamo.value.trim().toLowerCase();

        const filtrados = datos.filter(p => {

            const texto = [
                p.solicitante,
                p.item,
                p.observaciones,
                p.estado
            ].join(' ').toLowerCase();

            return texto.includes(filtro);
        });

        if (!filtrados.length) {

            const fila = document.createElement('tr');
            const celda = document.createElement('td');

            celda.colSpan = 8;
            celda.textContent = 'No hay préstamos para mostrar.';

            fila.appendChild(celda);
            historial.appendChild(fila);

            return;
        }

        filtrados.forEach(p => {

            const fila = document.createElement('tr');

            function agregarCelda(valor) {

                const celda = document.createElement('td');

                celda.textContent =
                    valor === null || valor === undefined || valor === ''
                        ? '-'
                        : String(valor);

                fila.appendChild(celda);
            }

            agregarCelda(p.solicitante);
            agregarCelda(p.item);
            agregarCelda(p.cantidad || 1);
            agregarCelda(p.fechaPrestamo);
            agregarCelda(p.fechaPrevista);
            agregarCelda(p.observaciones || 'Sin comentarios');

            const celdaEstado = document.createElement('td');
            const badge = document.createElement('span');

            badge.className = 'badge';
            badge.textContent = p.estado || 'activo';

            celdaEstado.appendChild(badge);
            fila.appendChild(celdaEstado);

            const celdaAccion = document.createElement('td');

            if (!p.fechaDevolucion) {

                const boton = document.createElement('button');

                boton.type = 'button';
                boton.className = 'btn-sm';
                boton.textContent = 'Devolver';

                boton.addEventListener('click', async () => {

                    if (!confirm(`¿Confirmás la devolución de ${p.item}?`)) {
                        return;
                    }

                    boton.disabled = true;

                    try {

                        await devolverUnidad(p.detalle_id);

                        mensaje('Devolución registrada correctamente.', 'success');

                        await cargarPrestamos();
                        await cargarHerramientas();

                    } catch (error) {

                        console.error(error);

                        mensaje(
                            'No se pudo registrar la devolución: ' + error.message,
                            'error'
                        );

                        boton.disabled = false;
                    }
                });

                celdaAccion.appendChild(boton);

            } else {

                celdaAccion.textContent = 'Devuelto';
            }

            fila.appendChild(celdaAccion);

            historial.appendChild(fila);
        });
    }

    buscarPrestamo.addEventListener('input', () => {
        renderizarPrestamos(prestamos);
    });

    // --------------------------------------------------
    // REGISTRAR PRÉSTAMO
    // --------------------------------------------------

    formulario.addEventListener('submit', async event => {

        event.preventDefault();

        const solicitanteId = solicitante.value;

        const unidades = Array.from(item.selectedOptions)
            .map(opcion => opcion.value);

        const fecha = fechaPrevista.value;

        if (!solicitanteId) {
            mensaje('Seleccioná un solicitante.', 'warning');
            return;
        }

        if (!fecha) {
            mensaje('Seleccioná la fecha prevista de devolución.', 'warning');
            return;
        }

        if (fecha < fechaLocal()) {
            mensaje('La fecha prevista no puede ser anterior a hoy.', 'warning');
            return;
        }

        if (!unidades.length) {
            mensaje('Agregá al menos una herramienta mediante el selector o el QR.', 'warning');
            return;
        }

        const datos = {
            solicitante_id: solicitanteId,
            fecha_prevista: fecha,
            unidades: unidades,
            observaciones: observaciones.value.trim()
        };

        btnRegistrar.disabled = true;
        btnRegistrar.textContent = 'Registrando préstamo...';

        try {

            await crearPrestamo(datos);

            mensaje('¡Préstamo registrado correctamente!', 'success');

            await detenerCamara();

            formulario.reset();

            fechaPrevista.value = fechaLocal();
            fechaPrevista.min = fechaLocal();

            await cargarHerramientas();
            await cargarPrestamos();

        } catch (error) {

            console.error('Error registrando préstamo:', error);

            mensaje(
                'No se pudo registrar el préstamo: ' + error.message,
                'error'
            );

            // Actualiza disponibilidad por si otra persona
            // prestó la unidad mientras se completaba el formulario.
            await cargarHerramientas();

        } finally {

            btnRegistrar.disabled = false;

            btnRegistrar.innerHTML =
                '<i class="fa-solid fa-handshake"></i> Registrar Préstamo';
        }
    });

    // --------------------------------------------------
    // INICIALIZACIÓN
    // --------------------------------------------------

    await Promise.all([
        cargarSolicitantes(),
        cargarHerramientas(),
        cargarPrestamos()
    ]);

});
