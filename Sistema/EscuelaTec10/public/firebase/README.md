# Firebase: preparación local, no despliegue

La carpeta contiene una configuración de emuladores y reglas **cerradas** (`allow read, write: if false`). No es una app conectada ni permite grabar. Su primer uso es comprobar una denegación y luego construir reglas explícitas por colección y rol.

1. Seguir la [guía oficial de instalación de Firebase CLI y emuladores](https://firebase.google.com/docs/emulator-suite/install_and_configure), verificar requisitos actuales de Node/Java y usar una cuenta/proyecto de práctica de la escuela según sus permisos.
2. Desde **esta carpeta** ejecutar `firebase emulators:start --project demo-escuelatec10`. El identificador `demo-...` es un proyecto simulado, no un proyecto real.
3. Abrir UI en `http://127.0.0.1:4000`. Auth escucha en 9099 y Firestore en 8080 según `firebase.json`. Conectar una aplicación al emulador solo con las llamadas documentadas `connectAuthEmulator` y `connectFirestoreEmulator`; usar el **mismo projectId** en app y emulador.
4. Crear una petición de lectura de ensayo. Debe denegarse con las reglas iniciales. Diseñar la matriz de permisos lector/operador/admin, implementar reglas y probar lectura/escritura permitida y denegada en emulador.
5. La primera vez que se usa un proyecto real, seguir la configuración web oficial; `config.example.mjs` muestra únicamente nombres de campos. No poner claves administrativas ni cuentas de servicio en el frontend. La configuración pública del cliente no autoriza acceso; las reglas lo hacen.
6. Tras aprobar pruebas, integrar una colección de prueba y revisar en dos sesiones. Publicación y migración de datos reales requieren las decisiones y permisos de la institución.

Esta configuración no inicia el laboratorio HTML/JSON. Son rutas independientes: **laboratorio HTTP primero, emulador Firebase después**. Las operaciones de una app web se implementan con el SDK modular adecuado al método de carga elegido (npm/bundler o módulos CDN documentados en la versión actual). No mezclar importaciones npm en un `<script>` clásico sin preparación.

Fuentes: [emuladores](https://firebase.google.com/docs/emulator-suite/install_and_configure), [conexión Firestore](https://firebase.google.com/docs/emulator-suite/connect_firestore), [conexión Auth](https://firebase.google.com/docs/emulator-suite/connect_auth), [SDK web](https://firebase.google.com/docs/web/setup), [reglas](https://firebase.google.com/docs/firestore/security/get-started).
