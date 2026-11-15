# RE-AUDITORÍA UI/UX MÓVIL — Alerta Dealers (autored_coquimbo)

**Fecha:** 15 de noviembre de 2026 · **Metodología:** PROMPT-AUDITOR-UIUX-MOVIL.md · **Tipo:** re-auditoría de verificación (30 hallazgos del 05-09) + caza de hallazgos nuevos en el código post-auditoría
**Código auditado:** `main` @ `69ac6a7` (25-10-2026), 21 commits después de la auditoría previa
**Fase A (dinámica):** ejecutada en este sandbox con Chromium headless + Playwright, viewports 375×812 y 360×800, `npm run dev` + Firebase real del proyecto (login demo ADMIN, dev-only), cámara falsa para OCR, simulación offline. **Fase B (estática):** 3 pasadas sobre ~12.250 líneas de `src/`, `api/` y reglas Firestore/Storage.
**Código sin modificaciones (regla de la auditoría).**

> **Transparencia de la fase dinámica:** al abrir el sheet de Alerta Máxima, la cuenta regresiva se arma sola (ver N-D1). Esta vez NO se despachó nada: el navegador se cerró con la cuenta en 8 segundos, antes de que el temporizador llegara a cero, y ninguna escritura ocurrió. A diferencia del 05-09, no quedaron datos de prueba en Firestore.

---

## 1. RESUMEN EJECUTIVO

**Veredicto: el flujo de reporte ya está listo para un robo real — los 6 P0 de septiembre están cerrados y verificados en runtime — pero la plataforma todavía NO: lo que ahora la frena ya no es la UI sino la seguridad de los datos. Las reglas de Firestore permiten que cualquier usuario encole pushes falsos a cualquier automotora y que cualquiera se promueva a ADMIN.**

**Lo verificado en runtime (los fixes de septiembre funcionan de verdad):**
1. **El falso verde murió.** Patente inexistente → badge ámbar "NO VERIFICADO / SIN CONEXIÓN — NO SE PUDO VERIFICAR" (captura `06`). Patente con encargo (BJZG35) → banner rojo inconfundible, badge "¡ENCARGO POR ROBO VIGENTE!" en una línea, fuente declarada ("Registro local de DEMOSTRACIÓN (no oficial)") (captura `07`).
2. **El mapa táctico funciona.** 8/8 tiles Esri ArcGIS cargados, nodo con pulso, heatmap al toggle, modo "REPORTAR" con instrucción visible (capturas `08`–`10`).
3. **El OCR ya no falla en silencio.** Captura con cámara falsa (sin patente): a los ~5 s devuelve "No se detectó patente en la foto — escríbela manualmente" y la foto queda cargada (captura `21`).
4. **El pánico ya no se cuelga ni duplica:** `writeBatch` atómico, pantalla "¡Alerta Emitida a la Red!", error legible con "Reintentar Envío".

**Lo que ahora impide el veredicto positivo (en orden):**
1. **P0 de reglas, no de UI** — `push_notifications` acepta `create` de cualquier autenticado sin validar un solo campo (spoofing de alertas de robo a cualquier sede vía push-dispatch), y `users.update` permite que cualquier operador se asigne `role: 'ADMIN'`. Cerrado el VAPID sin estas reglas, el pipeline de push transmitiría lo que cualquiera escriba en la cola.
2. **El botón de pánico sigue armándose solo.** Tocar "ALERTA" en la navbar abre directamente la cuenta regresiva de 10 s hacia un despacho automático. Es el mismo mecanismo que causó el accidente de septiembre; esta re-auditoría rozó el segundo accidente.
3. **La pérdida de red sigue sin avisar.** El `ConnectionBanner` (bien implementado) solo reacciona a errores de listener (permiso/cuota); al caer la red los listeners ya establecidos no fallan y el Panel muestra los últimos datos congelados como si estuvieran vivos (probado offline: sin banner a los 6 s).

Además, la caza de código nuevo (OCR v3, push, deep link, admin) produjo 21 hallazgos nuevos, 2 de ellos P0. **Esfuerzo estimado para el veredicto positivo: ~3 días** (reglas Firestore es lo más grueso).

---

## 2. VERIFICACIÓN DE LOS 30 HALLAZGOS DEL 05-09-2026

Veredictos contra el código actual; 📸 = además verificado en runtime de esta re-auditoría.

### P0

| ID | Veredicto | Evidencia y residual |
|---|---|---|
| **A-01** falso verde | ✅ RESUELTO 📸 | `stolenVehicleService.ts:398-427` fallback con `status: UNKNOWN` por tipo de fallo; badge ámbar "NO VERIFICADO" (`PlateVerificationBadge.tsx:129-167`); asignar patente persiste "PENDIENTE DE VERIFICACIÓN NACIONAL" (`Dashboard.tsx:1458-1469`). Verificado con patente inexistente. |
| **A-02** API key en bundle | ✅ RESUELTO | Sin JWT/clave en `src/`; proxy `api/vehicle-plate.mjs` con clave solo en `process.env.BOOSTR_API_KEY`; 429→CUOTA y 401/403→AUTH visibles (`stolenVehicleService.ts:238-241`). Configurar la env var en Vercel es runtime-inverificable. |
| **A-03** spinner eterno | ✅ RESUELTO | `AlertConfirmationModal.tsx:27,109-119,249-254,267`: `sendError` visible + "Reintentar Envío", `finally` restaura `isSending`. |
| **A-04** tiles rotos | ✅ RESUELTO 📸 | Basemap Esri público (`MapView.tsx:457-461`, mismo fix en el picker de `FlashReport.tsx`); tercer callback de error + `ConnectionBanner` (`:276-298,544`). Runtime: 8/8 tiles cargados. |
| **A-05** push muerta | 🟡 PARCIAL (excluido por el usuario) | Pipeline construido y honesto ("Los nodos con la app abierta lo están recibiendo ahora", `AlertConfirmationModal.tsx:189-191`); falta solo la credencial VAPID/`FIREBASE_SERVICE_ACCOUNT`. **Fuera de alcance por decisión del usuario (15-11).** Antes de activarla: cerrar N-01. |
| **A-06** demo login público | ✅ RESUELTO | Ambos bloques demo tras `import.meta.env.DEV` (`Login.tsx:709,813`); no llega al bundle de producción. |

### P1

| ID | Veredicto | Evidencia y residual |
|---|---|---|
| **A-07** sirena insilenciable | ✅ RESUELTO | Campana conectada a `sound.toggleMute()` que corta la sirena en pleno playback (`Navbar.tsx:21-24`, `soundEngine.ts:31-37,221-245`); botón 46px con aria-label. |
| **A-08** overrides de un toque | 🟡 PARCIAL | Confirmación `pendingOverride` + error visible (`PlateVerificationBadge.tsx:26,225-290,264-268`). **Residual:** al confirmar, la "denuncia" sigue siendo fabricada (`ALERTA-{placa}`, comisaría y comuna fijas, `:70-74`), y los botones disparadores siguen ~28px dentro del form. La confirmación evita el tap accidental; no da legitimidad al registro compartido. |
| **A-09** override de tipo | ✅ RESUELTO | `IncidentReportForm.tsx:262-263`: `setType(prev => prev ?? 'ROBO')` — solo sugiere si no hubo elección. |
| **A-10** KPI falso cero | ✅ RESUELTO 📸 | "Conectando… / —" durante carga (`Dashboard.tsx:678-703`) + skeleton de feed. Runtime: cero no apareció. |
| **A-11** GPS silencioso | ✅ RESUELTO 📸 | Badge "Sin GPS: se enviará la ubicación aproximada" (`AlertConfirmationModal.tsx:240-244`), GPS auto al abrir el form, avisos "Ubicación aproximada (centro de Coquimbo)". Runtime: "GPS FIJADO" visible. |
| **A-12** OCR sin feedback | ✅ RESUELTO 📸 | Timeout 15 s (`ocrPlateScanner.ts:458`), precarga al abrir el form, hint "No se detectó patente — escríbela manualmente". Runtime: hint apareció a los ~5 s. |
| **A-13** auto-zoom iOS | 🟡 PARCIAL | Flujo crítico de despacho a 16px con `inputMode`/`autoCapitalize` (verificado en runtime). **Residual:** 3 textareas <16px: editar incidente 14px (`Dashboard.tsx:1282`), notas de prueba en ruta 12px (`RoadTestForm.tsx:306`), admin accesos 12px (`AdminAccessRequests.tsx:437`). |
| **A-14** safe-area y Admin | ✅ RESUELTO 📸 | `viewport-fit=cover` + `env(safe-area-inset-bottom)`; Admin fuera de la bottom-nav con botón dedicado en header 46px (`BottomNavbar.tsx:25-30`, `Navbar.tsx:81-90`). Runtime 360px: 5 ítems completos ≥44px, sin overflow de página. |
| **A-15** targets y logout | ✅ RESUELTO | Logout con `window.confirm` (`Navbar.tsx:107-116`), refresh 44px, 29 aria-labels. Residual menor: X del filtro de fecha ~20px (`Dashboard.tsx:1132-1135`). |
| **A-16** errores como vacío | 🟡 PARCIAL 📸 | Toda la app operativa con tercer callback + `ConnectionBanner` (`Dashboard.tsx:237-380`, `MapView.tsx:276-298`, `AdminAccessRequests.tsx:53-66`). **Residuales:** (1) `AdminDashboard.tsx:106-141` mantiene 6 `onSnapshot` sin callback de error; (2) **runtime: al perder red los listeners ya establecidos no fallan → sin banner** — el patrón cubre permiso/cuota, no caída de red. |
| **A-17** éxito mudo y duplicados | ✅ RESUELTO | `writeBatch` atómico (`FlashReport.tsx:143-153`) + pantalla "¡Alerta Emitida a la Red!" (`:155-162,486-501`) + error con `handleFirestoreError`. |
| **A-18** supresión silenciosa | ✅ RESUELTO | Banner "Tu nodo está OFFLINE: no recibirás alertas de proximidad…" persistente, toast en `bottom-24 right-4` (no tapa el pánico), nombre real de la automotora (`NotificationManager.tsx:131-138,203-215,254`). |

### P2 / P3

| ID | Veredicto | Residual |
|---|---|---|
| **A-19** backdrop borra borrador | ✅ RESUELTO | Confirmación antes de descartar en los 3 sheets + borrador sessionStorage con aviso de restauración (`IncidentReportForm.tsx:156-175,49-135`). |
| **A-20** botones muertos | ✅ RESUELTO | "Ver Red Completa" navega al mapa, "Ver Historial" al tab (`Dashboard.tsx:815,1049-1052`); filtro con los 4 tipos. |
| **A-21** acciones sin feedback | ✅ RESUELTO | Resolver/Falsa Alarma con loading/éxito/error por acción y confirmación inline; copiar con await + fallback (`Dashboard.tsx:443-469,581-605`). |
| **A-22** contraste y tema | 🟡 PARCIAL | Shell claro unificado, placeholders slate-300, KPI con color al tener datos. Residual: ID en Historial sigue `text-slate-500` (`Dashboard.tsx:1205-1207`). |
| **A-23** legibilidad crítica | ✅ RESUELTO 📸 | Sin scanline en `src/`; logo inline en header; badge ROBO una línea. Runtime confirmado en capturas. |
| **A-24** landing hover-only | 🟡 PARCIAL | Texto hover-dependiente eliminado, acceso móvil en header. Residual: el form sigue detrás del paso `'intro'` del modal (`Login.tsx:140,677-693`). |
| **A-25** desktop-first en mapa | 🟡 PARCIAL | Escape OK, `alert()` eliminado (0 matches), **modo reportar desde el mapa funciona** (runtime). Residual: `InteractiveNetworkWeb.tsx:664-666` sigue mouse-only (táctil muerto) con rAF+interval permanentes (batería). |
| **A-26** picker atrapa el gesto | ✅ RESUELTO | Picker fullscreen "Toca el mapa para marcar el punto" (`IncidentReportForm.tsx:714-744`), mismo patrón que FlashReport (duplicado, no extraído a módulo compartido). |
| **A-27** métricas admin falsas | 🟡 PARCIAL 📸 | Sedes = `dealerships.length` real, `TEMP_ID` validado en envío, placeholder "Sin descripción". Residuales en runtime: loading sin spinner (estado muerto en `AdminDashboard.tsx:85,113`) y feed mostrando "Sede: TEMP_ID" crudo cuando el id no corresponde a una sede real. |
| **A-28** hover-only y mock | ✅ RESUELTO | Overlay "Cambiar" siempre visible (`RoadTestForm.tsx:248-255`); stock real en Firestore con doble estado vacío (`StockAutomotoras.tsx:77-89,346-353`). |
| **A-29** 404 y tab↔URL | 🟡 PARCIAL | `path="*"` → Panel (`App.tsx:162`); código muerto eliminado. Residual: `activeTab` sin sincronizar con URL. |
| **A-30** tips IA genéricos | ✅ RESUELTO | Claves mapeadas y copy chileno (`geminiService.ts:9-22,45-64`). Sigue siendo rule-based (no modelo), dentro de lo prescrito. |

**Balance: 22 resueltos · 8 parciales · 0 vigentes en su totalidad · A-05 excluido por decisión del usuario.** Los residuales de los parciales están recogidos como hallazgos nuevos abajo.

---

## 3. MATRIZ DE HALLAZGOS NUEVOS

Severidad por riesgo para el operador en la calle. N-D = hallado en fase dinámica; N-S = en fase estática; N-R = verificado en las reglas de Firestore/Storage.

### P0 — Críticos

| ID | Módulo (evidencia) | Hallazgo | Impacto operador | Corrección | Esf. |
|---|---|---|---|---|---|
| **N-R1** | `firestore.rules:117-119` + `NotificationManager.tsx:178` + `api/push-dispatch.mjs` | **Cola de push escritible sin validación.** `allow create: if isSignedIn()` admite un doc con `recipientDealerId` de otra sede y título arbitrario; push-dispatch lo reenvía por FCM a los tokens de esa sede. Verificado textualmente en las reglas. | Con VAPID activado (A-05), cualquier cuenta puede hacer creer a cualquier automotora que hay un robo en su patio → despacho de personal/Carabineros a un lugar sin incidente, además de spam ilimitado contra la cuota FCM (la cola no es legible ni limpiable desde la UI). | Validar en la regla `recipientDealerId == perfil del autor`, `hasOnly` campos permitidos y `type == 'INCIDENT_ALERT'`; idealmente mover el encolado a una callable function. | M |
| **N-R2** | `firestore.rules:19-30` | **Auto-promoción a ADMIN.** `allow update` de `users/{uid}` se valida con `isValidUser`, que admite `role: 'ADMIN'`: cualquier operador puede escribir su propio perfil y volverse ADMIN (aprueba accesos, borra registros, promueve a otros). | Un operador hostil o una cuenta comprometida obtiene control total de la red sin rastro de aprobación. | Exigir `isAdmin()` para cualquier cambio de `role`; self-update solo para `displayName`/teléfono. | S |
| **N-R3** | `firestore.rules:121-124` + `storage.rules:15-23` | **`roadTests` e `inspectionAlerts` legibles por cualquier autenticado** (la pestaña Registros del admin lee ahí; la restricción admin existe solo en la UI). Storage: fotos de licencias de conducir en `road-tests/**` legibles por cualquier autenticado. | Datos personales de clientes de test-drive (patente, notas, foto de licencia) expuestos a toda la red de operadores. | `allow get, list: if isAdmin()` en ambas colecciones; lectura de `road-tests` en Storage restringida a admin/sede dueña. | S |

### P1 — Graves

| ID | Módulo (evidencia) | Hallazgo | Impacto operador | Corrección | Esf. |
|---|---|---|---|---|---|
| **N-D1** | `App.tsx:108-111` + `FlashReport.tsx:196-199` + `AlertConfirmationModal.tsx:123-138` 📸 | **El botón de pánico se arma con un tap de navegación.** "ALERTA" en la BottomNavbar abre directamente la cuenta regresiva de 10 s hacia el despacho automático (observado: sheet abierto ya contando en 8 s). Es el mismo mecanismo del accidente del 05-09; esta sesión lo rozó de nuevo y solo la muerte del proceso lo detuvo. | Un mis-tap en el centro de la navbar — el gesto más frecuente de la app — inicia una bomba de 10 s contra toda la red, con una sola salida pequeña ("CANCELAR (FALSA ALARMA)") y bajo estrés. | Armar la cuenta SOLO con una acción deliberada dentro del sheet: long-press (~1.5 s) en el botón ALERTA o botón "ACTIVAR BOTÓN DE PÁNICO" en el sheet. La cuenta de 10 s se conserva una vez armada. | M |
| **N-S1** | `usePushNotifications.ts:75` + `NotificationManager.tsx:145` | **`new Notification(...)` lanza `TypeError: Illegal constructor` en Chrome Android** (el dispositivo principal del operador). El throw interrumpe `triggerAlert` antes de encolar FCM y de disparar push-dispatch: en una red Android, ni la cola ni el deep link en foreground funcionan aunque VAPID esté configurada. [parcialmente a-verificar-en-runtime] | La red de notificación estaría muerta justo en los teléfonos que más la usan. | `try/catch` + `ServiceWorkerRegistration.showNotification()` (el SW ya existe), gated tras `'ServiceWorkerRegistration' in navigator`. | S |
| **N-S2** | `api/vehicle-plate.mjs:8-22` | **Proxy de patentes sin autenticación ni rate limit.** curl o un script pueden llamarlo en loop y agotar la cuota diaria de la API paga (y enumerar patentes en serie). | Cuando la cuota muere, toda la red pierde la verificación oficial (queda NO VERIFICADO — honesto, pero sin la capa oficial). | Exigir Firebase ID token (Authorization Bearer + Admin SDK) y rate limit por uid/IP. | M |
| **N-S3** | `ocrPlateScanner.ts:494-558` + `PlateCameraCapture.tsx:159-189,313-320` | **El escaneo multi-frame no tiene timeout** (el de 15 s cubre solo la foto única) y durante el análisis el botón Cancelar desaparece (observable: ya no está en el DOM). En gama baja el pipeline 4 frames × 5 ROIs × 2 pasadas puede pasar de 30 s; el operador queda atrapado sin salida. En esta máquina el ciclo terminó en ~5 s, lo que baja la urgencia pero no el riesgo en teléfonos reales. | El operador que solo quería la foto pierde el sheet y el borrador queda detrás. | Envolver `scanLicensePlatesFromFrames` en el mismo `Promise.race` y mantener Cancelar activo durante el análisis (con confirmación). | S |
| **N-S4** | `firestore.rules:87-89` + `Dashboard.tsx:304` + `App.tsx:31-46` 📸 | **Deep link de notificación sin estados de fallo:** (a) incidente borrado → el mapa aterriza sin marcador ni mensaje; (b) incidente fuera del top-50 del feed → el handler se da por atendido y no pasa nada; (c) sesión expirada → `ProtectedRoute` redirige a `/login` sin preservar el query y tras reloguear cae en `/`: la alerta se pierde. | El operador toca la notificación de la alerta y la app "no hace nada" — el peor momento para descubrirlo. | Guardar el fullPath en el redirect de ProtectedRoute; estado "incidente no encontrado — buscá en Historial" en MapView/Dashboard. | M |

### P2 — Medios

| ID | Módulo (evidencia) | Hallazgo | Corrección | Esf. |
|---|---|---|---|---|
| **N-D2** | `Dashboard.tsx` (suscripciones) 📸 | **Caída de red sin banner.** Offline 6 s en runtime: sin `ConnectionBanner`; los listeners vivos no fallan, el Panel congela "ALERTA ACTIVA 11" como si estuviera vivo. El banner cubre error de listener, no pérdida de red. | Detectar offline con `navigator.onLine` + evento `online/offline`, o `snapshot.metadata.fromCache`. | S |
| **N-S5** | `api/push-dispatch.mjs:57-66,76-84` | Reclamo de la cola no transaccional (dos POST paralelos → envío doble); sede sin tokens se marca entregada (`NO_TOKENS`) y el emisor no lo ve; docs con >500 tokens se reintentan eternamente (doc venenoso); tokens `unregistered` nunca se limpian. | `runTransaction` para reclamar, trocear lotes de 500, exponer `deliveredTo`, borrar tokens muertos según respuesta FCM. | M |
| **N-S6** | `usePushNotifications.ts:27,58-61` + `Dashboard.tsx:655-669` | Permiso de notificaciones se pide al montar sin gesto de usuario (iOS PWA lo rechaza) y no hay ningún botón para re-solicitarlo; el banner "Notificaciones en Espera" es informativo. Además `updateDoc` de `fcmTokens` falla en silencio si el doc de usuario no existe → token nunca guardado. | Pedir permiso desde un botón dentro del banner; `setDoc(..., {merge:true})` para el token. | S |
| **N-S7** | `IncidentReportForm.tsx:49-138` | El borrador no se limpia al cerrar sesión: en dispositivo compartido, el operador B que entre en la misma pestaña recibe el borrador de A (patente, GPS, descripción) y puede transmitirlo bajo su identidad. | `clearDraft()` en signOut, o key del borrador por uid. | S |
| **N-S8** | `Dashboard.tsx:1282,1573,1582` + `PlateCameraCapture.tsx:317,313-320` + `NotificationManager.tsx:237-243` | Targets residuales <44px: textarea de edición 14px (auto-zoom), "Sí, Marcar"/"No" de Falsa Alarma 36px, Cancelar de cámara 36px, X de descarte de toast ~28px. | `min-h-11` + `text-base` en los tres casos. | S |
| **N-S9** | `AdminDashboard.tsx:106-141,616-619,657-660` | Los 6 `onSnapshot` del admin sin callback de error y `loading` muerto (nunca renderizado): un fallo de Firestore se lee como "Sin pruebas de manejo registradas aún". El anti-patrón A-16 sobrevive solo en la superficie admin. | Tercer callback + `ConnectionBanner` en el admin. | S |
| **N-S10** | `MapView.tsx:316-317,378-382` | "Reportar desde el mapa" sube la foto sin comprimir (3-8 MB por evidencia en datos móviles) y `handleShare` copia sin await/catch/feedback (TypeError mudo sin HTTPS). | `compressImageFile` + replicar el patrón de copiado de Dashboard. | S |
| **N-D3** | `AdminDashboard.tsx` (tabs) 📸 | Row de pestañas del admin se desborda horizontalmente a 375px (scrollWidth 581 vs 309px): "SOLICITUDES" queda cortada sin affordance de scroll. | Tabs scrollables con scroll-snap o grid 2×2. | S |
| **N-D4** | `dateUtils.ts:5-6` + Historial 📸 | Fallback de fecha = `new Date()`: docs sin `createdAt` renderizan la hora de "ahora". En runtime, todas las tarjetas del Historial mostraban la misma hora ("04:58 a. m. 15 NOV 2026") — o son datos sembrados con timestamp idéntico, o el fallback está máscara-ndo fechas desconocidas. En ambos casos el operador no puede confiar en la hora mostrada. | Fallback explícito "fecha desconocida" + auditar la semilla de datos. | S |

### P3 — Pulido

| ID | Hallazgo | Corrección |
|---|---|---|
| **N-D5** | KPI "NODOS EN RED: 0" junto a "EFICACIA OPERATIVA: 100%" — métricas contradictorias sin datos (100% de dividir por cero). Runtime. | Estado "—" para métricas sin base de cálculo. |
| **N-D6** | KPI de portada: píldora "ALERTA ACTIVA" se parte en 2 líneas y "INCIDENTES ACTIVOS" roza el borde derecho en 375/360px. Runtime (capturas 04/14). | Badge en fila propia o truncado controlado. |
| **N-S11** | Landing: los 4 botones "Ver …" miden 64×6 px (colapsados — interacción muerta en táctil); "Acceso a la Red" 32px de alto. Runtime. | Botones reales ≥44px o eliminarlos del render táctil. |
| **N-S12** | Copy en voseo rioplatense en landing y mapa: "Explorá la red: tocá un nodo…", "TOCÁ EL MAPA… (ESC CANCELA)" — lenguaje de teclado y acento no chilenos en la cara pública del producto. | Localizar a registro neutro chileno; "ESC" solo en desktop. |
| **N-S13** | `IncidentReportForm.tsx:239` `URL.createObjectURL` sin `revokeObjectURL` (fuga por captura); `ocrPlateScanner.ts:471-485` el timeout no cancela el trabajo zombi (encola detrás). | Revocar en `resetForm`; AbortSignal por tarea. |
| **N-S14** | `Dashboard.tsx:149` + `NotificationManager.tsx:48`: `usePushNotifications` montado dos veces en `/` → doble `getToken` y doble `onMessage` (dos notificaciones del sistema por push en foreground). | Guard singleton del listener. |
| **N-S15** | `AdminDashboard.tsx:205-216` métrica "Acierto Implícito" subestima al OCR: re-escribir la patente idéntica a la sugerencia la degrada a MANUAL (`IncidentReportForm.tsx:514-519` no compara antes de marcar). | Comparar `normalizePlate(input)` con la sugerencia antes de degradar. |
| **N-S16** | `MapView.tsx:152-188` búsqueda Nominatim sin debounce ni AbortController (respuestas fuera de orden); `:719-723` el popup del deep link se reabre en cada snapshot. | Debounce + abort; abrir solo en la primera selección. |
| **N-R4** | `firestore.rules:16` `users` get público entre autenticados expone email/teléfono/`fcmTokens` de toda la red; `:108` `stolenVehiclesRegistry` lectura pública y **create/update por cualquier autenticado** (envenenar el registro que consulta la red — A-08 agregó confirmación de UI, no reglas). | Lectura de perfil propia/sede; escritura del registro solo SECURITY/ADMIN con validación de campos. |

---

## 4. SCORECARD POR MÓDULO (vs. 05-09)

| Módulo | 05-09 | Hoy | Cambio principal |
|---|---|---|---|
| Login / Acceso | 4 | **7** | Demo gateado en dev, acceso en header móvil, modal fullscreen; quedan el paso 'intro' y botones colapsados (N-S11). |
| Dashboard (Panel/Feed/Historial) | 4 | **7.5** | KPI honesto, acciones vivas con feedback, ConnectionBanner por listener; quedan offline silencioso (N-D2) y métricas contradictorias (N-D5). |
| IncidentReportForm | 5 | **8.5** | Borrador persistente, picker fullscreen, OCR con feedback verificado, GPS avisado, sin override de tipo; queda cancelar durante análisis (N-S3). |
| FlashReport / Pánico | 4 | **7** | Batch atómico, éxito visible, error con reintento; el auto-armado por tap (N-D1) es ahora el mayor riesgo del módulo. |
| PlateVerificationBadge | 3 | **8** | UNKNOWN honesto verificado en runtime, overrides con confirmación, badge en una línea; queda la denuncia fabricada (A-08 residual). |
| MapView | 3 | **8** | Tiles Esri verificados en runtime, reportar desde el mapa vivo, Escape; queda compresión de foto y share sin feedback. |
| Formularios de terreno | 6.5 | **8** | Acciones siempre visibles, confirmación de descarte; queda textarea 12px (N-S8). |
| StockAutomotoras | 5 | **8** | Stock real en Firestore, doble estado vacío, menú muerto eliminado. |
| Admin (Dashboard + Accesos) | 5 | **6.5** | Tema unificado, métricas reales, pestaña Registros; quedan onSnapshot sin error, spinner muerto y tabs desbordadas. |
| Navbar / BottomNavbar | 3 | **8** | Safe-area, Admin en header, logout confirmado, mute real de sirena. |
| NotificationManager + Push | 3 | **5.5** | Banner de nodo offline, toast reposicionado, nombre real; queda el constructor ilegal en Android (N-S1) y permiso sin gesto (N-S6). |
| CommandPalette | 6 | **7** | Input a 16px. |
| Servicios (verificación / push / IA) | 3 | **7.5** | UNKNOWN honesto, proxy sin clave en bundle, tips mapeados; las reglas de escritura abiertas son el techo (N-R1/R2/R4). |
| OCR patentes v3 | 6.5 | **8** | Timeout, precarga y feedback verificados en runtime; queda multi-frame sin timeout (N-S3). |
| Infra PWA / offline | 4 | **5.5** | viewport-fit, SW de push con deep link; queda manifest/theme-color y el offline silencioso. |

**Promedio: 4.7 → 7.3.**

---

## 5. TOP 10 QUICK WINS (mayor impacto / menor esfuerzo, ordenados)

1. **Cerrar las reglas de Firestore (N-R1, N-R2, N-R3, N-R4):** validación de `push_notifications`, bloquear self-promo a ADMIN, lectura admin de `roadTests`/`inspectionAlerts`. Es lo único que separa el veredicto positivo, y son ~40 líneas de reglas.
2. **Notificación vía ServiceWorker (N-S1):** reemplazar `new Notification()` por `registration.showNotification()` con try/catch — sin esto el pipeline de push está muerto en Android aunque llegue VAPID.
3. **Armar el pánico con long-press (N-D1):** matar la bomba de 10 s por mis-tap manteniendo la velocidad de despacho.
4. **Banner de conexión por red real (N-D2):** `online/offline` + `metadata.fromCache` en Dashboard y MapView.
5. **Token FCM con `setDoc merge` + botón "Activar" en el banner de permiso (N-S6).**
6. **Cancelar durante el análisis OCR + timeout multi-frame (N-S3) + botón "Reintentar" en el error de cámara (N-S11/N-S7 de cámara).**
7. **`text-base`/`min-h-11` en los residuales (A-13, N-S8):** tres textareas y tres botones, una tarde.
8. **`onSnapshot` con error en AdminDashboard (N-S9):** cerrar el último rincón del patrón "fallo = bandeja vacía".
9. **Comprimir la foto en "reportar desde el mapa" (N-S10) + feedback de copiar enlace.**
10. **`clearDraft()` al cerrar sesión (N-S7) y fallback "fecha desconocida" (N-D4).**

---

## 6. VEREDICTO EJECUTIVO

**¿Está lista para que un operador reporte un robo real hoy? El flujo de reporte, sí: verificación honesta de patente, GPS con aviso, OCR con feedback, envío atómico con reintento y mapa vivo — todo verificado en runtime en esta re-auditoría. La plataforma como red de confianza, todavía no, por tres cosas:**

1. **Las reglas de datos permiten fraude interno** (push falsa a cualquier sede, auto-ADMIN, registro de robos escribible por cualquiera): el riesgo se movió de la UI a la capa de datos, y ahí sigue siendo una decisión de seguridad equivocada en potencia.
2. **El pánico sigue armándose con un tap de navegación**: dos sesiones de auditoría consecutivas estuvieron a segundos de despachar alertas falsas a una red que ya tiene operadores reales usándola.
3. **La caída de red no se anuncia**: en 4G inestable el Panel muestra datos congelados como vivos — la falsa calma que la auditoría original declaró guerra, ahora solo en el caso offline.

Cerradas esas tres frentes (~3 días) y cargada la credencial VAPID (excluida de este alcance por decisión del usuario), el veredicto pasa a positivo.

---

## 7. ANEXO: EVIDENCIA

**Capturas de la fase dinámica** (Chromium headless 375×812 y 360×800, DPR 2, touch, es-CL): `/tmp/audit-dyn/shots/` en este sandbox — copiadas a `alerta-dealers/scratch/auditoria-2026-11-15/` (excluido de git):
- `01` landing 375px · `02` modal acceso · `04` panel 375px · `05` form abierto · `06` patente inexistente → NO VERIFICADO · `07` BJZG35 → banner ROBO con fuente demo · `08` mapa táctico 8/8 tiles · `09` heatmap · `10` modo reportar ("ESC CANCELA") · `12` admin claro · `13` pestaña Registros · `14` panel 360px · `15` feed · `16` historial (timestamps uniformes) · `17` cuenta regresiva armada a 8 s · `18` offline sin banner · `21` OCR "No se detectó patente".

**Mediciones dinámicas:**
- Tiles del mapa: 8 cargados / 0 fallidos (Esri World Dark Gray).
- Inputs: patente 16px con `inputMode="text"`; verificado en runtime.
- BottomNavbar 360px: Panel 71px · Mapa 63px · Alerta 56×77px · Feed 59px · Historial 93px; Admin vía header (46px). Sin overflow horizontal de página.
- Landing: "Ver Disuasión/…" 64×6px; "Acceso a la Red" 177×32px.
- Admin tabs 375px: scrollWidth 581 vs clientWidth 309.
- Offline (context.setOffline, 6 s): sin ConnectionBanner; KPI congelado con datos.
- OCR cámara falsa: captura → análisis → hint "No se detectó patente" en ~5 s; botón Cancelar ausente durante análisis.
- Pánico: tap en "ALERTA" → modal de cuenta regresiva ya en curso (8 s al fotografiarlo); sin escritura en Firestore (proceso terminado antes de cero).

**Auditoría estática:** 3 pasadas en paralelo — verificación de A-01..A-30, verificación de A-19..A-30, caza en código post-auditoría (OCR v3, push, deep link, admin Registros, reglas). Las reglas de Firestore (N-R1..R4) fueron verificadas además por lectura directa del auditor principal.

**No ejecutado (y por qué):**
- **Dispositivo físico iOS/Android:** el auto-zoom restante (textareas) y el constructor `Notification` en Chrome Android son por especificación de plataforma + lectura de código; N-S1 marca su runtime como parcialmente a-verificar.
- **Push real:** requiere VAPID — excluido del alcance por decisión del usuario.
- **API Boostr real:** la clave vive solo en Vercel; la cascada se verificó hasta el fallback demo y el estado UNKNOWN del fallo de proxy.
- **Escrituras en Firestore:** ninguna; la sesión no dejó datos de prueba (ver transparencia arriba).
