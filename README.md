# Alerta Dealers

Espacio de trabajo del proyecto **Alerta Dealers** (repo `armyv7v/alerta-dealers`).

## Contenido

- **`autored_coquimbo/`** — App principal (React + Vite + Firebase, generada con AI Studio). Repositorio git independiente; no se versiona dentro de este workspace. Las variantes "light" (operations, incident-badge, incident-sheet, incident-integration) viven como ramas `feat/light-*` de ese repo — las carpetas fork que había en el workspace se eliminaron tras verificar byte a byte que coincidían con sus ramas.
- **`branding/`** — Identidad corporativa "Alerta Dealers" (sin duplicados):
  - `svg/` — 9 SVG fuente (logo y versiones, ícono, iconografía, tarjeta, paleta, tipografía)
  - `render/` — láminas de presentación en JPG/PNG, incluida la general (`alerta-dealers-identidad-corporativa.png`)
  - `iconos/` — `.ico` para web/app
  - `vector/` — logo vectorial (SVG/PDF/PNG 2400px)
  - `original-exacto/` — assets originales exactos (logos e íconos)
  - `packs/` — zips de distribución
- **`docs/auditorias/`** — Historial de auditorías UX/UI: auditoría móvil (30 hallazgos P0–P3), Laws of UX, cierre del plan de mejora (fases D/E con contraste WCAG medido) y el prompt maestro del auditor.
- **`_qa-browser/`** — Herramienta de QA en navegador (playwright-core): `run-matrix.js` recorre las apps en móvil/desktop y `scan.js` mide contraste WCAG y targets táctiles. La evidencia que genera (`out/`, `shots/`) se regenera en cada corrida y está ignorada.
- **`crecex/`** — Reservado (actualmente sin archivos de proyecto).

## Notas

- `.zcode/`, `.agents/`, `.idea/` y los logs son metadatos de herramientas, excluidos vía `.gitignore`.
- Configuración de Firebase y secretos nunca deben commitearse (`firebase-applet-config.json` vive en su propio repo; los `.env` están ignorados).
- El repo antes se llamaba `autosafe`; GitHub redirige automáticamente las URLs antiguas.
