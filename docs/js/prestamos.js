// El listener inicial debe ser async
document.addEventListener("DOMContentLoaded", async () => {
    
    const formulario = document.querySelector("#formulario");
    const historial = document.querySelector("#historial");
    let prestamosGlobales = []; 

    // ==========================================
    // F17: Cargar opciones para los Selectores
    // ==========================================
    async function cargarOpciones() {
        try {
            // Consumimos la API para usuarios (activos) y detalles de objetos
            const usuarios = await api('usuarios');
            const items = await api('detalle_objeto');
            
            const selectSolicitante = document.querySelector('#solicitante');
            const selectItem = document.querySelector('#item');
            
            // Limpiamos y llenamos Solicitantes
            selectSolicitante.innerHTML = '<option value="">Seleccione un solicitante...</option>';
            usuarios.filter(u => u.activo).forEach(user => {
                selectSolicitante.innerHTML += `<option value="${user.id}">${user.nombre} (${user.legajo})</option>`;
            });

            // Limpiamos y llenamos Items
            selectItem.innerHTML = '';
            items.forEach(item => {
                selectItem.innerHTML += `<option value="${item.id}">${item.nombre} - ${item.codigo}</option>`;
            });
            
        } catch (error) {
            console.error("Error al cargar las opciones:", error);
        }
    }

    // ==========================================
    // F10 y F12: Listar y Renderizar Préstamos
    // ==========================================
    function renderizarPrestamos(datos) {
        historial.replaceChildren();
        datos.forEach(item => {
            const nuevaFila = document.createElement("tr");

            const textoBoton = item.estado === "Devuelto" ? "Devuelto" : "Devolver";
            const estadoBoton = item.estado === "Devuelto" ? "disabled" : "";

            nuevaFila.innerHTML = `
                <td>${item.solicitante}</td>
                <td>${item.item}</td>
                <td>${item.cantidad} u.</td>
                <td style="max-width: 250px; overflow-wrap: break-word;">${item.observaciones || 'Sin comentarios'}</td>
                <td><span class="badge">${item.estado}</span></td>
                <!-- Añadido data-detalle-id como lo pide la guía -->
                <td><button type="button" class="btn-sm btn-devolver" data-detalle-id="${item.detalle_id}" ${estadoBoton}>${textoBoton}</button></td>
            `;
            historial.appendChild(nuevaFila);
        });
    }

    async function cargarPrestamos() {
        historial.innerHTML = "<tr><td colspan='6' style='text-align:center;'>Cargando datos...</td></tr>";
        try {
            // Suponiendo que listarPrestamos o api('prestamos') es tu endpoint real
            prestamosGlobales = await api('prestamos'); 
            renderizarPrestamos(prestamosGlobales);
            
            // Si tienes un script app.js que maneja permisos
            if (typeof aplicarPermisos === "function") {
                aplicarPermisos();
            }
        } catch (error) {
            console.error("Error al cargar:", error);
            historial.innerHTML = "<tr><td colspan='6'>Error al conectar con la base de datos.</td></tr>";
        }
    }

    // ==========================================
    // F11: Alta de Préstamo
    // ==========================================
    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault(); // Evitar recarga

        const solicitante_id = document.querySelector("#solicitante").value;
        const fecha_prevista = document.querySelector("#fecha-prevista").value;
        const observaciones = document.querySelector("#observaciones").value;
        
        // Obtener array de IDs de las opciones seleccionadas en el select múltiple
        const selectItem = document.querySelector("#item");
        const unidades = Array.from(selectItem.selectedOptions).map(option => option.value);

        const nuevoPrestamo = {
            solicitante_id,
            fecha_prevista,
            unidades,
            observaciones
        };

        try {
            await crearPrestamo(nuevoPrestamo); // O await api('prestamos', 'POST', nuevoPrestamo) según tu api.js
            console.log("Préstamo registrado correctamente");
            
            formulario.reset();
            await cargarPrestamos();
            await cargarOpciones(); // Refrescar stock visual

        } catch (error) {
            console.error("Error al registrar préstamo:", error);
        }
    });

    // ==========================================
    // F17: Devolución por Detalle
    // ==========================================
    historial.addEventListener("click", async (evento) => {
        // Atrapamos el elemento más cercano que tenga el data-detalle-id
        const boton = evento.target.closest('[data-detalle-id]');
        
        if (boton && !boton.disabled) {
            const detalleId = boton.dataset.detalleId;
            
            try {
                await devolverUnidad(detalleId); // O await api(`prestamos/devolver/${detalleId}`, 'POST')
                console.log("Préstamo devuelto correctamente");
                
                await cargarPrestamos();
                await cargarOpciones(); // Refrescar stock visual

            } catch (error) {
                console.error("Error al devolver la unidad:", error);
            }
        }
    });

    // ==========================================
    // BUSCADOR EN TIEMPO REAL
    // ==========================================
    document.querySelector('#buscar-prestamo').addEventListener('input', event => {
        const texto = event.target.value.trim().toLocaleLowerCase();
        const visibles = prestamosGlobales.filter(item =>
            item.solicitante.toLocaleLowerCase().includes(texto)
        );
        renderizarPrestamos(visibles);
    });

    // ==========================================
    // INICIALIZACIÓN
    // ==========================================
    await cargarOpciones();
    await cargarPrestamos();
});