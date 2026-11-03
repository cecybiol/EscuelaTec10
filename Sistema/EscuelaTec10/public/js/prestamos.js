document.addEventListener("DOMContentLoaded", () => {

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
    // =========================
    // LISTA Y RENDERIZADO (Págs. 11 y 12 de la teoría)
    // =========================
    let prestamos = [
        {
            solicitante: "Carlos Gómez",
            item: "Amoladora Angular Bosch",
            cantidad: "1",
            observaciones: "Sin comentarios",
            estado: "Activo"
        }
    ];

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
                <td style="max-width: 250px; overflow-wrap: break-word;">${item.observaciones}</td>
                <td><span class="badge">${item.estado}</span></td>
                <td><button type="button" class="btn-sm" ${estadoBoton}>${textoBoton}</button></td>
            `;
            historial.appendChild(nuevaFila);
        });
    }

    // Dibujar los préstamos iniciales en pantalla
    renderizarPrestamos(prestamos);

    // =========================
    // REGISTRAR PRÉSTAMO LALALA
    // =========================

    formulario.addEventListener("submit", (evento) => {

        // Evitar que se recargue la página
        evento.preventDefault();

        // Obtener datos
        const solicitante = document.querySelector("#solicitante").value;
        const item = document.querySelector("#item");
        const cantidad = document.querySelector("#cantidad").value;
        const observaciones = document.querySelector("#observaciones").value;

        // Obtener nombre del ítem
        const nombreItem = item.options[item.selectedIndex].text;

       prestamos.push({
            solicitante: solicitante,
            item: nombreItem,
            cantidad: cantidad,
            observaciones: observaciones,
            estado: "Activo"
        });

        renderizarPrestamos(prestamos);

        // Limpiar formulario
        formulario.reset();

        // Volver cantidad a 1
        document.querySelector("#cantidad").value = 1;

        console.log("Préstamo registrado correctamente");
    });


    // =========================
    // DEVOLVER PRÉSTAMO
    // =========================

   historial.addEventListener("click", (evento) => {

        // Verificar si se hizo click en un botón Devolver
        if (evento.target.classList.contains("btn-sm")) {

            const fila = evento.target.closest("tr");
            const nombreSolicitante = fila.querySelector("td").textContent;

            // Cambiar estado en la lista
            const prestamoEncontrado = prestamos.find(p => p.solicitante === nombreSolicitante && p.estado === "Activo");
            if (prestamoEncontrado) {
                prestamoEncontrado.estado = "Devuelto";
            }

            // Re-dibujar la tabla con el estado actualizado
            renderizarPrestamos(prestamos);

            console.log("Préstamo devuelto correctamente");
        }
    });

});