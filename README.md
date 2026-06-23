# EscuelaTEC10 — Sistema Integral de Gestión Escolar
Proyecto Anual 2026 —Adaptación al Ambiente de Trabajo
Plataforma web colaborativa para administrar herramientas, insumos, préstamos y
usuarios, con una interfaz moderna, accesible y adaptable a dispositivos móviles.
##
 📌 Estado del proyecto
Fase actual: **Etapa 1-3 (HTML + CSS base)**. Ver
| Etapa | Tecnología | Estado |
|---|---|---|
 | 1 | HTML5 + CSS3 |
 🔄
 En curso |
| 2 | JavaScript |
 ⏳
 Pendiente (Semana 4) |
| 3 | POO |
 ⏳
 Pendiente |
| 4 | APIs |
 ⏳
 Pendiente |
| 5 | Firebase |
 ⏳
 Pendiente |
| 6 | QR y Automatización |
 ⏳
 Pendiente |
##
 👥 Equipos y módulos
| Equipo | Módulo | Rama | Archivo HTML | Componente compartido a cargo |
|---|---|---|---|---|
| Equipo 1 | Dashboard | `feature-dashboard` | `pages/dashboard.html` | Header,
navbar/sidebar, `.btn`, `.card` |
| Equipo 2 | Herramientas | `feature-herramientas` | `pages/herramientas.html` | — |
| Equipo 3 | Insumos | `feature-insumos` | `pages/insumos.html` | `.table`, `.alert` |
| Equipo 4 | Préstamos | `feature-prestamos` | `pages/prestamos.html` | `.form-group`, `.input`,
`.select`, `.textarea` |
| Equipo 5 | Administración | `feature-admin` | `pages/admin.html` | `.badge` |
**Entrega Fase HTML/CSS:** 29 de junio de 2026.
##
 🌳 Estrategia de ramas
```
main
 → versión estable / publicada en GitHub Pages
└─ deploy
 → integración de todos los equipos
├─ feature-dashboard
├─ feature-herramientas
├─ feature-insumos
├─ feature-prestamos
└─ feature-admin
```
Cada equipo trabaja **únicamente** en su rama `feature-*`, hace commits ahí
(mínimo 8-10), y abre un Pull Request hacia `deploy` para que se revise e
integre. `deploy` se fusiona a `main` cuando la fase está completa y
validada.
##
 🚀 Cómo clonar y arrancar (paso a paso)
```bash
# 1. Cloná el repositorio
git clone https://github.com/cecybiol/EscuelaTec10.git
cd EscuelaTec10
# 2. Traé todas las ramas remotas
git fetch --all
# 3. Movete a la rama deploy
git checkout deploy
# 4. Creá o movete a TU rama de equipo (ejemplo: Equipo 2 — Herramientas)
git checkout feature-herramientas
# Si la rama todavía no existe en tu copia local:
# git checkout -b feature-herramientas origin/feature-herramientas
# 5. Abrí el proyecto en VS Code
code .
# 6. Probá la página con Live Server
# Click derecho sobre pages/herramientas.html → "Open with Live Server"
```
### Flujo de trabajo diario
```bash
git checkout feature-herramientas # asegurate de estar en tu rama
git pull origin feature-herramientas
# ... trabajás, guardás cambios ...
git add .
git commit -m "feat(herramientas): agrego tabla de listado"
git push origin feature-herramientas
# Cuando tengas un avance importante: abrí un Pull Request hacia develop en GitHub
```
##
 📁 Estructura del repositorio
```
escuelatec/
├── index.html
├── pages/
│ ├── dashboard.html
│ ├── herramientas.html
│ ├── insumos.html
│ ├── prestamos.html
│ └── admin.html
├── css/
│ ├── variables.css (paleta institucional, tipografía, espaciado)
│ ├── layout.css
 (container, header, navbar, sidebar, main-content)
│ ├── components.css (.btn .card .table .form-group .input .alert .badge)
│ └── responsive.css (media queries — mobile first)
├── js/
│ └── app.js
├── assets/
│ ├── img/ (logo.svg incluido)
│ └── icons/
├── data/
 (JSON de ejemplo: herramientas.json, insumos.json)
├── docs/
│ └── EscuelaTEC10_Guia_Wireframes.docx
└── README.md
```
##
 🎨 Identidad visual
**Tipografía:** Poppins (400, 500, 600, 700) — importada desde Google Fonts en cada página.
**Paleta institucional** (definida en `css/variables.css`):
| Uso | Variable CSS | Hex |
|---|---|---|
| Principal | `--color-principal` | `#2496D8` |
| Primario Oscuro | `--color-primario-oscuro` | `#1C78AD` |
| Secundario | `--color-secundario` | `#4A6C82` |
| Éxito | `--color-exito` | `#2E8B57` |
| Advertencia | `--color-advertencia` | `#F4A261` |
| Error | `--color-error` | `#C94C4C` |
##
 🧩 Componente compartido: Header / Navbar
El header y el menú principal deben ser **idénticos** en las 5 páginas
(estructura HTML y clases CSS). Ya está incluido en cada `pages/*.html`;
si necesitás cambiarlo, coordiná con el Equipo 1 y avisá a todos los equipos
antes de modificarlo.
##
 ✅ Antes de pedir el Pull Request
- [ ] Código validado con [W3C Validator](https://validator.w3.org/)
- [ ] Responsive probado en Chrome DevTools (Mobile, Tablet, Desktop)
- [ ] Mínimo 8-10 commits en tu rama `feature-*`
- [ ] No duplicaste clases que ya existen en `components.css`
- [ ] El header/navbar es idéntico al de las demás páginas
##
 🛠️ Herramientas de trabajo
Figma · Visual Studio Code (Live Server, Prettier, GitLens) · Git + GitHub ·
W3C Validator · Chrome DevTools (Lighthouse)
---
llegamos **Regla de más oro:** lejos Comunicación, — éste es nuestro Respeto proyecto. y Compromiso. ¡Manos aSi la trabajamos obra!
 🚀
 juntos
