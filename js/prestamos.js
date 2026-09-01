document.addEventListener("DOMContentLoaded", () => {

    // Obtener formulario
    const formulario = document.querySelector("#formulario");

    // Obtener botón Registrar
    const botonRegistrar = document.querySelector("#btn-registrar");

    // Obtener tabla
    const tablaHistorial = document.querySelector("#tabla-historial");

    // Obtener cuerpo de la tabla
    const historial = document.querySelector("#historial");


    // =========================
    // REGISTRAR PRÉSTAMO
    // =========================

    formulario.addEventListener("submit", (evento) => {

        // Evitar que se recargue la página
        evento.preventDefault();

        // Obtener datos
        const solicitante = document.querySelector("#solicitante").value;
        const item = document.querySelector("#item");
        const cantidad = document.querySelector("#cantidad").value;

        // Obtener nombre del ítem
        const nombreItem = item.options[item.selectedIndex].text;

        // Crear nueva fila
        const nuevaFila = document.createElement("tr");

        nuevaFila.innerHTML = `
            <td>${solicitante}</td>

            <td>${nombreItem}</td>

            <td>${cantidad} u.</td>

            <td>
                <span class="badge">Activo</span>
            </td>

            <td>
                <button type="button" class="btn-sm">
                    Devolver
                </button>
            </td>
        `;

        // Agregar fila
        historial.appendChild(nuevaFila);

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

            // Obtener la fila
            const fila = evento.target.closest("tr");

            // Obtener el estado
            const estado = fila.querySelector(".badge");

            // Cambiar estado
            estado.textContent = "Devuelto";

            // Cambiar botón
            evento.target.textContent = "Devuelto";

            // Desactivar botón
            evento.target.disabled = true;

            console.log("Préstamo devuelto correctamente");
        }
    });

});