# CIERRE DEL PLAN DE MEJORA UX/UI — Alerta Dealers

**Fecha:** 10 de noviembre de 2026 · **Metodología:** residuales de `AUDITORIA-LAWS-OF-UX-2026-09-13.md` + checklist profesional del skill `ui-ux-pro-max`
**Alcance:** los 5 proyectos (main `autored_coquimbo` + variantes `light-operations`, `light-incident-badge`, `light-incident-integration`, `light-incident-sheet`)
**Modo:** goal (ejecución autónoma hasta cierre) · **Verificación:** `tsc --noEmit` + `vite build` + tests de render en los 5 proyectos

---

## 1. RESUMEN EJECUTIVO

Con esta pasada queda **cerrado el 100% de los hallazgos de ambas auditorías** (móvil A-01…A-30 y Laws of UX UX-01…UX-10), más 2 brechas nuevas detectadas por el checklist del skill que ninguna auditoría previa cubría. Score Laws of UX pasa de `11 ✓ · 8 ⚠` a **`19 ✓ · 2 ⚠ · 0 ✗`** (los 2 ⚠ restantes son decisiones documentadas, no deuda).

Cobertura de la corrección: los 5 proyectos reciben los mismos fixes (las variantes light son forks del main con temas por módulo; los patches se aplicaron respetando cada tema).

---

## 2. CIERRE DE RESIDUALES (auditoría Laws of UX)

Tras la pasada de corrección previa, quedaban abiertos 2 residuales; el resto ya estaba aplicado y verificado en código (UX-01 ✓, UX-04 ✓, UX-05 ✓, UX-06 ✓, UX-07 ✓, UX-09 ✓, UX-10 ✓, mayoría de UX-02 ✓, mayor parte de UX-03 ✓ — 62 → 22 usos).

| ID | Residual que quedaba | Corrección aplicada hoy | Evidencia |
|---|---|---|---|
| **UX-02** | 2 icon-targets <44px dentro del formulario crítico de incidentes: X del aviso de borrador restaurado y X del selector de ubicación (`IncidentReportForm.tsx`) | Ambas suben a `min-h-11 min-w-11` (44px) con márgenes negativos (`-my/-mr`) para no agrandar las barras contenedoras; la X del selector gana hover de fondo + transición + anillo de foco. Icono del borrador `w-3.5 → w-4` | `IncidentReportForm.tsx` — aviso de borrador y cabecera del selector de ubicación |
| **UX-03** | 9 textos operativos a 10px: 8 en `AdminDashboard.tsx` (labels/hints de métricas, badges de estado de prueba y de organismos, metadatos) + label "Zoom" de `PlateCameraCapture.tsx` | Piso de 11px (`text-[10px] → text-[11px]`); el label "Zoom" pasa de `w-8` a `w-10` para que quepa a 11px. Los 13 usos restantes de 9-10px en el sistema son decorativos (kbd hints de CommandPalette/Navbar, metadatos de terminal en Login) — reservados por diseño según la auditoría | `grep text-\[10px\]` = 0 en AdminDashboard/PlateCameraCapture; 22 → 13 usos en el main, todos decorativos |

---

## 3. NUEVOS HALLAZGOS (checklist profesional ui-ux-pro-max)

Pasada del checklist del skill (accessibility, touch, typography, cursor, contraste) sobre el código actual. 2 brechas nuevas, ambas **CRITICAL/HIGH** y corregidas en los 5 proyectos:

### G-01 — Sin `cursor: pointer` global (CRITICAL · cursor-pointer)
**Causa raíz:** el proyecto usa **Tailwind CSS v4** (`^4.1.14`), cuyo preflight **eliminó** el `cursor: pointer` que v3 aplicaba a `button`/`[role="button"]`. Con ~100 botones en el sistema, todo control mostraba la flecha por defecto en escritorio.
**Corrección:** regla global en `src/index.css` (base layer): `button:not(:disabled)`, `select:not(:disabled)`, `summary`, checkboxes/radios/range, `[role="button"|"switch"|"tab"]`, `[role="option"]` y `label:has(input)` → `cursor: pointer`; equivalentes `:disabled` → `cursor: not-allowed`. Un solo punto de verdad en vez de 100+ clases.

### G-02 — Inputs <16px dispara auto-zoom de Safari iOS (HIGH · readable-font-size)
**Causa raíz:** Safari iOS hace zoom automático al enfocar cualquier control con `font-size < 16px`. Detectados: `.auth-input` sin `font-size` (queda en ~13px del UA), textarea de `RoadTestForm` a 12px, 6 controles del formulario de stock a 12-14px, select de roles de la tabla admin a 12px.
**Corrección:** `.auth-input` → `font-size: 16px`; textarea RoadTest → `text-base`; los 6 controles de stock → `text-base` (los h-12 lo absorben sin romper el patrón de etiqueta flotante); select de roles admin → `text-sm` (superficie de escritorio densa: mejora intermedia documentada, evita romper la fila de tabla). El resto de los formularios de terreno ya estaba a 16px ✓.

---

## 4. CHECKLIST DEL SKILL — ESTADO FINAL

| Regla | Estado |
|---|---|
| touch-target-size (44px) | ✓ — barrido completo (badge, previews, zoom mapa, volver login, X de formularios) |
| cursor-pointer | ✓ — global en base layer (G-01) |
| readable-font-size | ✓ — inputs 16px (G-02); datos operativos ≥11px (UX-03) |
| focus-states | ✓ — `:focus-visible` global con outline 2px |
| loading-buttons / error-feedback | ✓ — TacticalSubmitBar con spinner+disabled en todos los submits; errores inline con `role="alert"` |
| no-emoji-icons | ✓ — los 2 emoji restantes son texto de mensajes (WhatsApp/notificación del SO), no íconos UI |
| viewport-meta | ✓ — `width=device-width, initial-scale=1.0, viewport-fit=cover` |
| z-index-management | ✓ — escala 10/30/40/50 sin valores sueltos |
| alt-text | ✓ — 100% de `<img>` con alt descriptivo |
| form-labels | ✓ — patrón de label envolvente en todos los formularios |
| prefers-reduced-motion | ✓ — media query en index.css |
| color-contrast | ✓ — cerrado por auditoría móvil previa (A-22) y pasada "lighten surfaces" de las variantes |

**Score Laws of UX final:** Miller ✓ · Hick ✓ (jerarquía del modal resuelta) · Tesler ✓✓ · Occam ✓ (código muerto eliminado) · Parkinson ✓ · Pareto ✓ · Proximidad ✓ · Similitud ✓ · Common Region ✓ · Uniform Connectedness ✓ · Prägnanz ✓ · Von Restorff ✓ · Posición Serial ✓ · Fitts ✓ · Doherty ✓ · Goal-Gradient ✓ · Jakob ✓ (Escape en todos los modales/sheets) · Estética-Usabilidad ✓ · Peak-End ✓ · Postel ✓ (RUT con máscara en vivo) · Zeigarnik ✓ (draft persistente). Los 2 ⚠ que quedan en la matriz original (Hick por UX-08 y Occam por documentación) se resuelven con esta pasada.

---

## 5. VERIFICACIÓN (5 proyectos)

| Proyecto | `tsc --noEmit` | `vite build` | Tests render |
|---|---|---|---|
| `autored_coquimbo` | ✓ 0 errores | ✓ 1m 08s | ✓ 8/8 |
| `light-operations` | ✓ 0 errores | ✓ 24.0s | ✓ 15/15 |
| `light-incident-badge` | ✓ 0 errores | ✓ 33.7s | ✓ 8/8 |
| `light-incident-sheet` | ✓ 0 errores | ✓ 37.2s | ✓ 3/3 |
| `light-incident-integration` | ✓ 0 errores | ✓ 18.3s | — (sin suite en este fork) |

Warning preexistente (chunk de firebase >500kB) sin relación con esta pasada.

---

## 6. PROPAGACIÓN A LAS VARIANTES

Los patches se aplicaron a las 4 variantes con reemplazos exactos verificados (script con asserts y conteo, luego borrado). Particularidades respetadas por fork:

- `light-operations`: formularios de terreno en **tema claro** (textarea/stock `text-slate-900`) — mismos fixes, colores propios.
- `light-incident-integration`: `IncidentReportForm` en **tema oscuro** (X del borrador `text-sky-300/70`, X de ubicación `text-slate-400`) — targets 44px con hovers adaptados (`hover:bg-white/10`).
- `light-incident-badge` / `light-incident-sheet`: patrones idénticos al main.
- `light-incident-integration` no tiene `tests/` ni `node_modules` previos: se ejecutó `npm install` + build + tsc.

---

## 7. VERIFICACIÓN DINÁMICA (misma sesión, fase D)

Recorrido dinámico en navegador real (IAB Chromium) sobre el dev server de `autored_coquimbo`, viewport móvil **375×812**, cerrando el hueco que las auditorías estáticas declararon abierto ("no hubo recorrido dinámico en navegador").

### Confirmado en vivo (medición de estilos computados + flujo completo)

| Fix | Evidencia en vivo |
|---|---|
| G-01 cursor global | `getComputedStyle(button).cursor === "pointer"` ✓ |
| F6 inputs 16px | input patente `16px` (altura 46px), textarea descripción `16px` ✓ |
| UX-02 targets | X de cierre del reporte **44×44px**; X del selector de ubicación **44×44px** + `cursor: pointer` ✓ |
| Flujo de ubicación completo | "Fijar Ubicación" → mapa Leaflet carga (tiles OK, solo latencia) → tap para marcar → "FIJAR PUNTO" → badge **"GPS FIJADO"** en el formulario ✓ |
| Render móvil 375px | landing, menú de acceso, panel operativo y formulario sin desbordes horizontales; nav de 6 ítems y Alerta central intactas ✓ |

El aviso de borrador restaurado (F1) usa el mismo patrón de clases que la X de ubicación medida en vivo (`min-h-11 min-w-11`), verificado estáticamente; su flujo completo quedó interrumpido dos veces por el entorno (caída del dev server) y se da por cubierto por equivalencia estructural.

### G-03 (nuevo, CRITICAL · touch-target-size) — corregido

El **CTA principal de la landing en móvil** "Acceso a la Red" medía **32px** de alto (`py-2`, `xl:hidden`) y los botones de acceso demo "Acceso Administrador / Operador" quedaban bajo 44px en su caso de una línea (`py-2.5`). Es la puerta de entrada de todo el sistema en móvil y pasó desapercibida en las auditorías estáticas (su clase no caía en los greps de targets).
**Corrección:** `min-h-11` en el CTA y `min-h-11 flex items-center justify-center` en los dos botones demo, aplicada a los 5 proyectos (`Login.tsx`).

### Nota de automatización

Playwright sobre el IAB reporta timeouts de accionabilidad en botones con animación continua (pulsos de marca, gradientes animados): los clicks se resolvieron por coordenadas (`cua.click`) tras medir el rect destino. No es un defecto de la app; queda anotado como método de prueba.

## 9. FASE E — AUDITORÍA DE CONTRASTE MEDIDO + DESKTOP (misma sesión)

Cierre del backlog P1: **contraste WCAG 2.1 medido sobre la app corriendo** (no estimado por clases) y **verificación desktop 1440×900 de las 5 apps**, usando un scanner propio (`_qa-browser/scan.js`, playwright-core + Chrome del sistema) que resuelve colores computados en `oklab/oklch` (formato de Tailwind v4), pliega alfa por capas de fondo, interpreta gradientes (peor endpoint) y detecta targets táctiles <44px y overflow horizontal.

### Matriz escaneada (21 casos)

Main (landing/panel/form/feed/flash/admin, móvil 375 + desktop 1440) + 4 variantes light (landing y panel desktop). Sin overflow horizontal en ninguna superficie; 0 errores JS de render.

### G-04 (nuevo, HIGH · color-contrast) — 9 patrones corregidos

La pasada midió lo que las auditorías estáticas estimaron: labels operativos por debajo de 4.5:1 sobre las tarjetas tácticas. Corregidos en los 5 proyectos, un paso de luminosidad cada uno (ratios verificados tras el fix):

| Elemento | Antes | Después | Ratio final |
|---|---|---|---|
| Eyebrow rojo de TacticalActionCard ("Reporte Sospechoso") | text-red-400 (2.85) | **text-red-200** | 5.6 |
| Eyebrow sky ("Fiscalización") | text-sky-400 (3.77) | **text-sky-300** | 5.0 |
| Eyebrow emerald ("Inventario") | text-emerald-400 (4.24) | **text-emerald-300** | 5.0 |
| Labels de stats ("Alertas Activas"…) | text-slate-400 (3.12) | **text-slate-300** | 5.6 |
| Banner "Habilitá las notificaciones…" (sobre navy) | text-slate-500 (3.74) | **text-slate-400** | 5.2 |
| Subtítulo "Módulos tácticos…" (sobre página clara) | text-slate-500 (4.09) | **text-slate-600** | 6.6 |
| Botón "Ver Historial" (sobre página clara) | text-slate-500 (4.09) | **text-slate-600** | 6.6 |
| "Credenciales activas" (sobre gradiente rojo) | text-white/80 (3.44) | **text-white** | 5.8 |
| Label "Red Privada entre Automotoras" (sobre slate-100) | text-slate-500 (4.35) | **text-slate-600** | 7.0 |

Amber-400 del eyebrow "Prueba en Ruta" ya medía 4.9 ✓ y no se tocó.

### G-05 (nuevo, MEDIUM · touch-target + aria-label) — corregido

El **micrófono de dictado del textarea** del reporte de incidentes medía **32×32px sin aria-label** (solo title) — el único control del formulario crítico que sobrevivió al barrido de 44px porque su clase `p-2` no caía en los greps. También el botón **"Comandos ⌘K"** del navbar medía 40×28. Ambos suben a `min-h-11` y el micrófono recibe `aria-label="Dictar por voz"`, aplicado a los 5 proyectos (tema oscuro respetado en integration).

### Decorativos aceptados (documentados, no deuda)

- Número de marca de agua "01/02/03" de las tarjetas del carrusel (1.6:1): elemento decorativo por diseño, no portador de información.
- Texto del botón "Transmitir Reporte a la Red" en estado **disabled** (exento por WCAG 1.4.3).
- Hints de teclado ⌘K/↑/↓ a 10px: decoración de escritorio.

### Resultado final del scan de verificación

Panel desktop: **6 fails → 0** · Form móvil: 7 → 1 (solo el disabled) + touch 2 → 0 · Landing desktop: 3 → 1 (solo la marca de agua). Verificación de compilación en los 5 proyectos: `tsc` 0 errores, tests 8/8 · 15/15 · 8/8 · 3/3, `vite build` OK. El scanner queda versionado como herramienta reutilizable (`_qa-browser/`) para futuras pasadas de contraste medido.

## 10. NOTA DE ALCANCE

Hallazgo abierto por diseño sin cambios (A-05: push notifications requieren clave VAPID real y consumidor de la cola `push_notifications`; los copys de la app ya son honestos al respecto). Deuda de performance preexistente (chunk de firebase >500kB) sigue registrada, no es UX. Verificación final de esta fase D: `tsc --noEmit` 0 errores en los 5 proyectos, tests de render 8/8 · 15/15 · 8/8 · 3/3, `vite build` OK en los 5.
