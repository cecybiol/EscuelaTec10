# Estado del proyecto

La versión integrada para exposición se sirve desde `docs/`, con PHP y MariaDB. Leer el [README](README.md) de la raíz para configurar el servidor existente, iniciar sesión y probar QR, stock y préstamos.

Las páginas y las hojas CSS originales de los alumnos se conservaron. Sus controladores por módulo se conectan a `docs/js/api.js`, con adaptadores comunes en `docs/js/bd-ui.js`. No cargar en paralelo storage.js o repositorio.js ni usar datos locales para simular respuestas de la base.

Las correcciones de integración posteriores al corte `b7eabcb` corresponden al asistente. No deben atribuirse automáticamente a los alumnos. La revisión individual entregada a la docente distingue commits, trabajo aún no integrado y pruebas pendientes.
