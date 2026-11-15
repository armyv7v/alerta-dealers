# AUDITORÍA LAWS OF UX — Alerta Dealers (autored_coquimbo)

**Fecha:** 13 de septiembre de 2026 · **Metodología:** skill `laws-of-ux` (21 leyes, Fase B estática de código)
**Código auditado:** post-correcciones de la auditoría móvil (commits `d8ea519`…`44b4d45` del repo interno, incl. las 8 correcciones de hoy)
**Complementa a:** `AUDITORIA-UIUX-MOVIL-2026-09-05.md` (hallazgos A-01…A-30, lente de UX móvil)

---

## 1. RESUMEN EJECUTIVO

**Veredicto: la base cognitiva y de feedback de la app es sólida; la deuda de UX restante es de jerarquía interna, no de operación.** Después de las correcciones de la auditoría móvil, las 21 leyes pasan o quedan en observación: no hay ninguna violación que bloquee reportar un robo o entender el estado de la red.

Lo que la app hace **bien** según las leyes (y conviene no romper):

- **Tesler's Law** es la gran fortaleza del producto: OCR que autocompleta la patente, GPS que se pide solo, patente que se normaliza y formatea sola, geohash automático, texto de WhatsApp pre-armado. El sistema absorbe la complejidad del terreno.
- **Doherty Threshold**: todo submit táctico usa `TacticalSubmitBar` con spinner + `disabled` (un solo lenguaje), y los estados de conexión muerta ahora son visibles (banner, no silencio).
- **Peak-End Rule**: el final del pánico tiene pantalla de éxito con copys honestos ("los nodos con la app abierta lo están recibiendo"), y el cierre del acceso demo en landing tiene confirmación positiva. El momento más tenso de la app termina bien.
- **Miller + Hick**: navegación de 6 ítems (≤7 ✓), 4 acciones operativas con tono semántico distinto por card, formularios ≤7 campos, filtros agrupados en 4 regiones.
- **Von Restorff**: el botón de Alerta en el centro de la bottom nav es inconfundible (tono, tamaño, posición de pulgar) — decisión correcta de Fitts + Serial Position, documentarla como tal.
- **Uniform Connectedness**: la cronología conecta eventos con línea + dots por tipo; el carrusel de la landing muestra progreso con barra.
- **Similarity**: `TacticalActionCard` / `TacticalSubmitBar` unificaron el lenguaje de CTAs de todo el sistema (commit `f3be1c1`) — inconsistencias de "botones gemelos con funciones distintas" prácticamente eliminadas.

Lo que queda (3 hallazgos medios + 7 menores): demasiadas acciones de igual peso en el modal de detalle, una camada de icon-targets <44px que sobrevivió al barrido de 44px, densidad tipográfica de 9-10px en datos operativos, y código muerto del mapa que confunde el mantenimiento.

**Esfuerzo estimado:** los 3 medios son ~1 día en total; los menores son pulido suelto.

---

## 2. MATRIZ DE HALLAZGOS

Severidad: **M** = fricción real en uso diario o bajo estrés · **B** = menor, con workaround natural · **P** = pulido/higiene de código.

| ID | Ley(es) | Hallazgo (evidencia) | Corrección sugerida | Sev. |
|---|---|---|---|---|
| **UX-01** | Von Restorff + Hick | El modal de detalle apila **3-4 barras tácticas full-width de igual peso** (Resolver, Falsa Alarma, Editar Reporte, Copiar WhatsApp — `Dashboard.tsx`, sección "Gestión de Incidente"). Cada una tiene spinner y tono correcto, pero no hay una acción primaria clara: todas compiten por el mismo golpe de pulgar. Bajo estrés, "Falsa Alarma" e "Resolver" se distinguen solo por color. | Una sola barra primaria según estado (Abierto → "Resolver"; Resuelto → "Reabrir"); las demás acciones como chips/botones secundarios compactos debajo. Falsa Alarma merece confirmación previa (hoy es un tap más). | **M** |
| **UX-02** | Fitts | Camada de icon-targets <44px que sobrevivió al barrido de 44px de `d8ea519`: refresh del badge de patente (`p-1.5` ≈ 28px, `PlateVerificationBadge.tsx`), X de previews de foto (IncidentReport/RoadTest), X del panel "Reportar desde el Mapa" (`p-1.5`), clear de búsquedas (ícono solo, sin padding), volver del Login (`p-2` ≈ 36px), zoom del mapa (~41px, borde). | Subir a `p-2.5`/`min-h-11` los que viven dentro de formularios críticos (badge y previews); el resto es aceptable en desktop. | **M** |
| **UX-03** | Prägnanz + Aesthetic-Usability | **62 usos de texto a 9-10px** (`text-[9px]`/`text-[10px]`, mono uppercase) en datos operativos: badges, contadores, metadatos. Comparte raíz con A-22 (contraste): a plena luz del patio, un badge "ENCARGO ROBO" a 10px es ilegible a un metro. | Piso de 11px para datos de estado y 12px para labels; reservar 9-10px para decoración no operativa. | **M** |
| **UX-04** | Occam | Código muerto en `MapView.tsx`: `handleTriggerAlert` + `alertingId` sin ningún call-site, `copyingId` se setea pero nunca se renderiza, `showMarkers` no tiene toggle UI (estado permanente true). Ruido de mantenimiento y riesgo de que alguien "termine" un feature fantasma. | Eliminar o completar: el botón "Disparar Alerta de Red" del popup existe en el estado pero no en la UI — decidir si vuelve como acción real o se borra con sus estados. | **B** |
| **UX-05** | Zeigarnik | No hay borrador persistente: un descarte confirmado (A-19 ya lo hace seguro) igual **pierde todo lo escrito**; navegarse fuera del tab tampoco conserva el draft. | `sessionStorage` con el draft del IncidentReportForm + toast "borrador restaurado". Bajo esfuerzo, alto valor bajo estrés. | **B** |
| **UX-06** | Doherty | El feed carga con texto plano "Analizando reportes..." (sin skeleton); el admin ya tiene spinner. El resto de la app cumple <400ms percibidos con spinners/disabled correctos. | Skeleton de 2-3 tarjetas mientras `loading` está en true. | **B** |
| **UX-07** | Postel | RUT del formulario de ingreso: valida y normaliza al enviar (`normalizeRut` ✓) pero **no formatea mientras se escribe**; el placeholder muestra el formato esperado y el usuario debe adivinar si va con puntos. | Máscara simple `XX.XXX.XXX-X` en onChange (Tesler: el sistema formatea). | **B** |
| **UX-08** | Miller | La nav de escritorio mezcla 3 dominios con el mismo estilo de ítem: tabs del panel (Panel/Feed/Historial), rutas (/mapa, /admin) y la acción global de Alerta. "Alerta" tiene color rojo (mitiga), pero un usuario nuevo puede leerla como "página de alertas". | Ya resuelto en móvil (botón físico central); en desktop basta mantener el rojo + label de acción ("Disparar Alerta" en el title). Documental, no accional. | **B** |
| **UX-09** | Jakob | El dictado por voz inserta "[Grabando...]" dentro del textarea como indicador de estado (hack funcional); no hay estado visual de grabación aparte. | Pill de grabación sobre el textarea (igual que el hint de OCR). | **P** |
| **UX-10** | Similarity | Dos modales con patrones de cierre distintos: el detalle usa backdrop-clic + X + Escape ✓; los formularios de terreno usan backdrop-con-confirmación + X (sin Escape). | Agregar Escape a los 3 sheets de terreno para paridad de convención. | **P** |

---

## 3. CHECKLIST DE LAS 21 LEYES

| Ley | Estado | Evidencia |
|---|---|---|
| Miller (7±2) | ✓ | Nav 6 ítems; 4 action cards; forms ≤7 campos; filtros en 4 grupos |
| Hick | ⚠ | Tipo de evento 2 opciones ✓; pendiente: jerarquía de acciones del modal (UX-01) |
| Tesler | ✓✓ | OCR auto, GPS auto, patente normalizada, geohash, WhatsApp pre-armado, RUT normalizado |
| Occam | ⚠ | Formularios mínimos ✓; código muerto del mapa (UX-04) |
| Parkinson | ✓ | IncidentReport en un paso corto; RoadTest/Inspection dividen foto → notas → confirmar |
| Pareto | ✓ | Panel pone las 4 acciones operativas primero; Alerta en la zona de pulgar |
| Proximidad | ✓ | Grupos de formulario con gap interno chico y secciones separadas |
| Similitud | ✓ | Tokens tácticos unificados (`TacticalActionCard`); tonos semánticos estables |
| Common Region | ✓ | Cards/bordes/fondos agrupan; filtros en panel propio |
| Uniform Connectedness | ✓ | Timeline con línea + dots por tipo; carrusel con barra de progreso |
| Prägnanz | ⚠ | Jerarquía clara ✓; densidad 9-10px excesiva en datos (UX-03) |
| Von Restorff | ⚠ | Botón de Alerta inconfundible ✓; modal de detalle con acciones gemelas (UX-01) |
| Posición Serial | ✓ | Alerta al centro (deliberado, Fitts); Panel primero, Historial último |
| Fitts | ⚠ | Botón de pánico y submits de 44px+ ✓; camada de icon-targets chica (UX-02) |
| Doherty | ⚠ | Spinners + disabled en todos los submits ✓; skeleton del feed (UX-06) |
| Goal-Gradient | ✓ | Contador "3/4 fotos" en RoadTest; carrusel con progreso; resumen previo en Inspection |
| Jakob | ✓ | Escape en detalle/mapa (hoy), selects nativos, labels arriba, submit abajo; sheets sin Escape (UX-10) |
| Estética-Usabilidad | ⚠ | Lenguaje visual cohesivo y states completos ✓; microtipografía 9-10px (UX-03) |
| Peak-End | ✓ | Pantallas de éxito honestas en pánico, FlashReport y solicitud de ingreso |
| Postel | ⚠ | Patente tolerante ✓; RUT sin máscara en vivo (UX-07); tel ahora con `type="tel"` ✓ |
| Zeigarnik | ⚠ | Estados parciales visibles ✓; sin draft persistente (UX-05) |

**Score: 11 ✓ · 8 ⚠ · 0 ✗** — ningún ✗ es el dato importante: antes de `d8ea519` varias leyes habrían sido ✗ (Doherty con spinner eterno, Peak-End con éxito mudo, Postel con falso verde).

---

## 4. SCORECARD POR MÓDULO (lente Leyes de UX)

| Módulo | Score | Justificación |
|---|---|---|
| Login / Acceso | **7.5** | Tesler sólido (RUT normalizado), Peak-End bueno en "solicitud enviada"; faltan máscara de RUT y targets del modal (volver). |
| Panel (Dashboard) | **7** | Miller/Pareto bien resueltos; el detalle pierde por acciones gemelas (UX-01). |
| Feed / Historial | **8** | Agrupación, timeline conectada y filtros con región propia: lo mejor de la app en leyes visuales. |
| IncidentReportForm | **8.5** | Tesler ejemplar (OCR+GPS+normalización), borrador protegido por confirmación; sin draft persistente. |
| FlashReport / Pánico | **8.5** | Peak-End y Doherty de manual: countdown cancelable → batch atómico → pantalla de éxito honesta. |
| PlateVerificationBadge | **7.5** | Estados UNKNOWN/STOLEN/CLEAN claros y confirmación de overrides nueva; refresh chico y microtipografía. |
| MapView | **6.5** | Completo en regiones y feedback no bloqueante (hoy); le pesa el código muerto (UX-04) y el zoom borderline. |
| Formularios de terreno | **8** | Goal-Gradient real (contador de fotos), similarity perfecta entre los 4 módulos; hover residual eliminado hoy. |
| Admin | **7** | Métricas reales y errores visibles (hoy); densidad tipográfica y targets de tabla menores. |
| Navbar / BottomNavbar | **8** | 6 ítems, Alerta central distintiva, mute real; escritorio mezcla dominios con estilo único (UX-08). |
| NotificationManager | **7** | Nodo offline visible y toast reposicionado (hoy); el toast sigue siendo la 3ª superficie de alerta sin prioridad entre sí. |

---

## 5. TOP 5 QUICK WINS (mayor impacto / menor esfuerzo)

1. **Jerarquía del modal de detalle (UX-01):** primaria única + secundarias compactas + confirmación en Falsa Alarma. ~2-3 h.
2. **Piso tipográfico 11px en datos operativos (UX-03):** grep-and-replace de `text-[9px]`/`text-[10px]` donde llevan datos. ~2 h.
3. **Targets ≥44px en badge y previews (UX-02):** 5-6 clases por cambiar. ~1 h.
4. **Draft persistente del reporte (UX-05):** sessionStorage + restauración. ~2 h.
5. **Skeleton del feed (UX-06):** 3 tarjetas shimmer. ~1 h.

---

## 6. NOTA DE ALCANCE

Auditoría estática de código (Fase B): no hubo recorrido dinámico en navegador en esta pasada. Los hallazgos de la auditoría móvil que requerían verificación en vivo (auto-zoom iOS medido, safe-area, tiles) ya fueron corregidos y verificados en la pasada anterior; esta auditoría no los re-mide, los da por corregidos según el código y sus commits. El hallazgo A-05 (push notifications: VAPID placeholder + cola `push_notifications` sin consumidor) sigue **abierto por diseño**: requiere clave VAPID real de la consola Firebase y un backend que consuma la cola — los copys de la app ya son honestos al respecto ("los nodos con la app abierta lo están recibiendo").
