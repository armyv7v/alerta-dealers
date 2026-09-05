# AUDITORÍA UI/UX MÓVIL — Alerta Dealers (autored_coquimbo)

**Fecha:** 5 de septiembre de 2026 · **Metodología:** PROMPT-AUDITOR-UIUX-MOVIL.md (Fase A dinámica en navegador real + Fase B estática de código)
**Viewports probados:** 375×812 (iPhone) y 360×800 (Android chico) · **Datos:** Firebase real del proyecto (login demo ADMIN)
**Código:** sin modificaciones (regla de la auditoría)

> **Transparencia:** durante el recorrido dinámico, la cuenta regresiva del botón de pánico completó su ciclo antes de poder cancelarla y **despachó una alerta de prueba real** a la base (2 documentos de `DEALERSHIP_DEMO`, 12:17 a. m.). Ambas fueron marcadas `FALSE_ALARM` desde la propia app como remediación. Los documentos siguen existiendo en Firestore: eliminarlos de la consola si se quiere dejar la base prístina.

---

## 1. RESUMEN EJECUTIVO

**Veredicto: la plataforma NO está lista para un robo real hoy.** El flujo de alta de incidente es de lo mejor del producto (2 toques hasta transmitir, bottom-sheet bien resuelto, countdown de pánico con cancelación ejemplar), pero la capa que debería dar **confianza** traiciona justo en el peor momento:

1. **El corazón de la app puede mentir con verde.** Sin conexión o con la cuota agotada, la verificación de patentes devuelve "SIN ENCARGO" (banner verde) **sin haber consultado nada**. La clave de la API oficial es free (5 patentes/día, hardcodeada en el bundle): en el pico de una alerta real se agota y degrada en silencio a ese falso verde.
2. **El mapa táctico está roto en producción**: todos los tiles dicen "API KEY REQUIRED". La conciencia situacional es una pantalla muerta (y sus errores de Firestore se ven igual que "no hay incidentes").
3. **El botón de pánico no sobrevive a un error de red**: spinner eterno, sin mensaje, sin reintento. Y la promesa "todos los nodos han sido notificados" es falsa: las push notifications son una feature muerta (VAPID placeholder, nadie consume la cola).
4. **El teléfono del operador pelea contra él**: sirena insilenciable, auto-zoom de iOS en cada input (medido: 12–14px), ítem "Admin" desaparecido de la navbar en móvil, GPS que envía el centro de Coquimbo sin avisar, y un KPI que muestra "NORMAL / PROTEGIDO — 0 incidentes" mientras los datos aún no llegan.

Lo positivo, para que el veredicto tenga contexto: ruteo protegido sólido, feedback de errores de formulario en Login bien hecho, el banner de "ENCARGO POR ROBO VIGENTE" es inconfundible, `InspectionForm` es el patrón de formulario de terreno a imitar, y el pipeline de OCR de patentes (recién corregido) tiene una base seria.

**Esfuerzo estimado para cambiar el veredicto:** los 6 P0 son abordables en ~1 semana; la mayoría de los P1 son correcciones de menos de un día cada uno.

---

## 2. MATRIZ DE HALLAZGOS

Severidad: **P0** impide reportar un robo o induce decisión de seguridad errónea · **P1** fricción seria o riesgo de error · **P2** fricción evidente con workaround · **P3** pulido.
Evidencia marcada como 📸 = observada dinámicamente en navegador; el resto proviene de lectura estática de código.

### P0 — Críticos

| ID | Módulo (evidencia) | Hallazgo | Impacto operador | Corrección | Esf. |
|---|---|---|---|---|---|
| **A-01** | `stolenVehicleService.ts:388-405` + `PlateVerificationBadge.tsx:117-148` + `Dashboard.tsx:1302-1310` | El fallback offline/quota devuelve `CLEAN / SIN ENCARGO` con detalles inventados ("PADRÓN EN TRÁMITE") y el badge pinta verde todo lo no-robo; asignar patente persiste `hasStolenReport: false` sin esperar verificación. No existe estado "NO VERIFICADO". | Deja ir o recibe un vehículo creyendo que está limpio **sin que ninguna consulta haya ocurrido**. Falso negativo en la función core. | Fallback → `status: UNKNOWN`; badge ámbar "SIN CONEXIÓN — NO VERIFICADO"; no persistir `hasStolenReport` sin consulta real. | M |
| **A-02** | `stolenVehicleService.ts:10-11, 238` 📸 | API key JWT free hardcodeada en el bundle (`plates_daily_limit: 5`); `!response.ok → null` → cae al falso verde de A-01. | Tras 5 consultas/día por terminal, la verificación oficial muere en silencio justo en el pico de una alerta real. | Proxy server-side con la clave; 429/401 → estado "CUOTA AGOTADA" visible. | M |
| **A-03** | `AlertConfirmationModal.tsx:95-99` + `firestoreErrors.ts:46-47` | Si la escritura falla (4G, quota, permiso), el throw dentro del catch salta `setIsSending(false)`: spinner eterno, botón bloqueado, cero mensaje en UI. | El operador bajo ataque ve "enviando…" para siempre; la alerta nunca sale y nadie se lo dice. | `catch` → estado `sendError` legible + botón "Reintentar". | S |
| **A-04** | `MapView` (tiles) 📸 | El mapa táctico renderiza tiles con marca de agua **"API KEY REQUIRED"** (basemap Carto sin clave). Toda la pantalla es ilegible. + `MapView.tsx:274-289`: `onSnapshot` sin callback de error → mapa vacío indistinguible de "no hay incidentes". | La conciencia situacional de la red — motivo de existencia del producto — no funciona en producción. | Basemap con clave válida u OSM (el mini-mapa del formulario sí renderiza: el fix es cambiar la URL); tercer callback de `onSnapshot` con banner "sin conexión". | S |
| **A-05** | `usePushNotifications.ts:31-48` + `NotificationManager.tsx:156-164` + `AlertConfirmationModal.tsx:166-171` | VAPID key placeholder → registro FCM siempre omitido; nadie lee la colección `push_notifications`. El modal de éxito dice "Todos los nodos y automotoras han sido notificados". | En un robo real, solo se enteran los que tienen la app abierta en primer plano — pero el operador cree que la red fue avisada. | VAPID real + consumidor de la cola; mientras tanto, no prometer "todos notificados". | L |
| **A-06** | `Login.tsx:202-239, 687-701, 780-793` 📸 | Acceso demo "1-Tap" **auto-crea cuentas ADMIN** con contraseña fija `alertadealers2026`, publicada en pantalla. Entré a la base real con ella durante esta auditoría. | Cualquiera con el URL se convierte en ADMIN de la red; anula la narrativa de "red cerrada validada por RUT". | Eliminar en producción o tras feature-flag de build. | S |

### P1 — Graves

| ID | Módulo (evidencia) | Hallazgo | Impacto operador | Corrección | Esf. |
|---|---|---|---|---|---|
| **A-07** | `Navbar.tsx:16-22, 88-101` + `soundEngine.ts` (0 llamadas a `toggleMute` en `src/`) 📸 | El toggle de campana es decorativo: no conecta con el mute del motor de audio ni con notificaciones. La sirena de 2.5s del badge ROBO suena sola y **no se puede silenciar desde ninguna UI**. | Un celular haciendo sirena policial junto al vehículo sospechoso, sin botón de apagado: expone al operador. | Conectar toggle → `sound.toggleMute()` + botón silenciar sobre el banner ROBO. | S |
| **A-08** | `PlateVerificationBadge.tsx:209-229` 📸 | "Marcar Recuperado" / "Reportar Robo a la Red": un toque sin confirmación escribe en el registro compartido con denuncia fabricada (`ALERTA-{placa}`, comuna hardcodeada); los botones (~26px) viven **dentro del formulario de reporte**, en zona del pulgar. | Un tap accidental envenena la base que consulta toda la red; o se cree que se marcó y no se guardó (fallo solo en `console.warn`). | Confirmación explícita + captura real de comisaría/N° de parte + error visible. | M |
| **A-09** | `IncidentReportForm.tsx:102` 📸 | Al detectar encargo por robo, el sistema **sobreescribe silenciosamente el tipo de evento** elegido por el operador (observado: "Sospechoso" → "Robo" sin aviso). | Anula la decisión humana: un marcaje deliberado se convierte en denuncia de robo sin que el operador lo sepa. | Sugerir el cambio con toast, nunca reemplazar la elección. | S |
| **A-10** | `Dashboard.tsx` (KPI) 📸 | El KPI de portada muestra **"NORMAL / PROTEGIDO — 0 incidentes"** mientras Firestore no respondió (observado a 2.5s de cargar; luego mostró 12→14). El cero inicial se lee como "todo tranquilo". | Falsa calma en los primeros segundos — justo cuando se abre la app tras una alerta. | Estado de carga explícito (—"…" o skeleton) en vez de cero optimista. | S |
| **A-11** | `IncidentReportForm.tsx:57, 88-97, 136-139` + `AlertConfirmationModal.tsx:27, 38-47` | Negación/timeout de GPS → solo `console.error`; la ubicación default (centro de Coquimbo) **se envía igual** al Firestore. En el pánico, el countdown de 10s vence antes que el timeout de GPS (5s) y despacha con coordenadas falsas. | La red acude al punto equivocado sin que nadie haya avisado que el GPS falló. | Feedback de error de permiso + badge "ubicación aproximada" + bloquear envío sin GPS confirmado. | S |
| **A-12** | `IncidentReportForm.tsx:73-84` + `ocrPlateScanner.ts` (sin timeout) 📸 | Si el OCR no detecta patente o falla, el spinner desaparece sin decir nada; el worker se crea en la primera foto (descarga WASM en 4G, sin timeout ni precarga). El resultado, cuando hay, sí es editable (bien). | El operador no sabe si la app "no vio" la patente o sigue trabajando; quema el tiempo crítico mirando un spinner. | Timeout ~15s + precarga del worker al abrir el form + hint "No se detectó patente — escríbela". | M |
| **A-13** | Inputs de todo el repo 📸 **medido** | Patente 14px, descripción 12px, búsquedas 12px; **0 usos de `inputMode`/`type="tel"`/`autoCapitalize` en `src/`**. Todo input <16px dispara auto-zoom de iOS Safari. | Al tipear la patente con una mano, la página "salta" y el layout queda zoom-eado; el submit queda bajo el teclado. | `text-base` (16px) en inputs + `inputMode` + `autoCapitalize="characters"` en patente + `type="tel"` en teléfonos. | S |
| **A-14** | `BottomNavbar.tsx:25` + `index.html:5` 📸 **medido** | Sin `env(safe-area-inset-bottom)` ni `viewport-fit=cover` (0 resultados en el repo). Además: a 375px el ítem **Admin queda en ancho 0** (Playwright se negó a clickearlo: outside-viewport) y a 360px **desaparece entero**. | El botón de Alerta puede quedar bajo la barra gestual del iPhone; el admin pierde su única entrada de navegación en móviles chicos. | `padding-bottom: max(0.5rem, env(safe-area-inset-bottom))` + `viewport-fit=cover` + nav scrollable o menú "más". | S |
| **A-15** | `Navbar.tsx:67-105` + `PlateVerificationBadge.tsx:157-164` + modales 📸 | Targets <44px: navbar 36px, refrescar 26px, X de modales ~28px; **logout destructivo pegado a la campana, sin confirmación**. Botones de cierre icon-only **sin `aria-label`** (sufrido en el recorrido: no se sabe qué X cierra qué). | Mis-taps bajo estrés: cerrar sesión en vez de silenciar; no poder distinguir acciones. | ≥44px en críticos, logout tras confirmación, `aria-label` en todos los icon-only. | S |
| **A-16** | `MapView.tsx:274-289` + `AdminAccessRequests.tsx:50-64` + `AdminDashboard.tsx:68-89` + `Dashboard.tsx:184-232` | Patrón sistémico: `onSnapshot` sin callback de error y errores renderizados como **bandeja vacía** ("No hay solicitudes" cuando falló la conexión). El `useEffect` del feed se re-suscribe en cada snapshot (deps mal puestas) y el tip IA puede dejar `isAiLoading` eterno. | El operador cree que no hay alertas cuando en realidad la conexión falló — falso estado de calma distribuido por toda la app. | Tercer callback de `onSnapshot` + banner "sin conexión / reintentando" global. | S |
| **A-17** | `FlashReport.tsx:131-159` 📸 | Éxito de Alerta Máxima = el modal se cierra y nada más (sin feedback). Doble `setDoc` secuencial no atómico: 📸 **observado** — un solo dispatch del pánico generó **2 documentos** visibles como 2 tarjetas del feed; un reintento tras fallo duplica el incidente. | El operador no distingue "alerta disparada" de "se cerró el modal"; puede re-disparar o confiarse. | Toast/pantalla de éxito + `writeBatch` atómico. | M |
| **A-18** | `NotificationManager.tsx:95-98, 181-206` | Heartbeat vencido → las alertas de proximidad **se suprimen en silencio** (solo `console.log`); el toast es `bottom-6 right-6` y **tapa el botón de Alerta** del navbar; muestra texto placeholder "Cercano a Dealership Red" en vez del nombre real. | El operador deja de recibir alertas sin saberlo y, cuando llega una, le tapa justo el acceso para reportar. | Banner persistente "tu nodo está OFFLINE"; toast encima del navbar; nombre real. | M |

### P2 — Medios

| ID | Módulo (evidencia) | Hallazgo | Impacto | Corrección | Esf. |
|---|---|---|---|---|---|
| **A-19** | `IncidentReportForm.tsx:217` + `RoadTestForm.tsx:131` + `InspectionForm.tsx:83` | Toque fuera del sheet (backdrop) descarta el reporte en curso sin confirmación ni borrador. | Un pulgar descentrado borra todo lo escrito bajo estrés. | Cerrar solo por X, o confirmar si hay datos. | S |
| **A-20** | `Dashboard.tsx:908-910, 685-693` 📸 | Botones muertos: "Ver Red Completa" sin `onClick` (visible en Feed 📸); "Ver Historial" hace scroll a un elemento de otro tab (no-op); filtro activo con `length < 3` habiendo 4 tipos. | Controles que no hacen nada erosionan la confianza en una app de emergencia. | Navegar al tab correspondiente; comparar contra el default real. | S |
| **A-21** | `Dashboard.tsx:299-301, 408-412, 1412-1414` 📸 | Cambios de estado (Resolver / Falsa Alarma — usados en esta auditoría) con `catch` mudo; **sin confirmación y sin feedback de éxito** (el cambio se ve solo al releer la lista). Copiar portapapeles muestra "Copiado" sin await/catch. | El operador cree que resolvió o copió cuando no ocurrió. | Toast de resultado real + await/catch con fallback. | S |
| **A-22** | `Dashboard.tsx:1062, 1293` + `Login.tsx` 📸 | Contraste al sol: `text-slate-500/600` portando datos (IDs de incidente, contadores, placeholders ≈2.7–3.8:1, bajo AA). El panel admin además **rompe el tema**: fondo claro en medio de la app oscura. | Datos operativos invisibles a plena luz; inconsistencia visual de marca. | `slate-300` mínimo para datos, unificar tema (o justificar el claro). | S |
| **A-23** | 📸 visual (capturas) | Legibilidad de componentes clave a 375px: las etiquetas de las **acciones operativas** ("REPORTE SOSPECHOSO", "PRUEBA EN RUTA") renderizan con un efecto rayado/glitch que a primer vista parece texto corrupto; en Login el logo flotante **tapa el párrafo**; el badge "¡ENCARGO POR ROBO VIGENTE!" se corta en 3 líneas ("VIGEN-TE!"). | Las acciones críticas y el estado crítico se leen mal justo cuando importan. | Revisar el estilo del label (quitar scanline o subir tamaño), `z-index`/margen del logo, badge en fila propia. | S |
| **A-24** | `Login.tsx` 📸 | La portada de login es una vidriera de marketing con interacciones **solo-hover** ("Desplace el cursor sobre los filamentos") y el formulario real escondido tras "Acceso a la Red" (un toque extra para entrar). | Interacciones muertas en táctil; fricción de entrada para el usuario que vuelve todos los días. | Texto sin hover-dependencia; Deep-link directo al form (recordar sesión ya lo mitiga a medias). | S |
| **A-25** | Modales 📸 + `MapView.tsx:316` | El modal de detalle no cierra con `Escape`; `alert()` nativo en MapView; modo "reportar desde el mapa" muerto (`isReportingMode` nunca pasa a true); `InteractiveNetworkWeb` solo responde a mouse (táctil muerto) con rAF+interval permanentes (batería). | Detalles que delatan desktop-first y gastan batería en terreno. | Handler de Escape, reemplazar `alert`, matar o completar el modo reporte, pointer-events táctiles. | M |
| **A-26** | `IncidentReportForm.tsx:414-436` 📸 | El picker Leaflet embebido **captura el arrastre**: 📸 medido — un dedo sobre el mapa panea el mapa (`translate3d(0,-220px)`) en vez de scrollear el sheet; instrucción "Haz clic en el mapa" (lenguaje desktop). `FlashReport` ya resuelve esto con picker fullscreen, pero no se reutiliza. | Fijar ubicación manual se vuelve pelea con el mapa en el flujo crítico. | Reutilizar el picker fullscreen de FlashReport. | S |
| **A-27** | `AdminDashboard.tsx:229` 📸 + datos 📸 | "Sedes Activas: 12" hardcodeada; carga del admin ~8.5s con "Cargando…" plano sin spinner; sede visible como `TEMP_ID`; feed público con tarjetas **sin descripción** (los reportes sin descripción se publican vacíos — A-09/A-21 relacionados). | Métricas que no son reales; datos sucios visibles para toda la red. | Métricas calculadas; spinner real; validar `dealershipId` y descripción mínima o placeholder "Sin detalles". | S |
| **A-28** | `RoadTestForm.tsx:222-227` + `StockAutomotoras.tsx:10-19, 104-137` | "Cambiar" foto solo aparece en hover (invisible en táctil); Stock con datos mock hardcodeados, sin estado vacío del filtro y botón de menú sin handler. | Flujos de terreno con trampas y datos falsos. | Mostrar siempre las acciones; datos reales; estado vacío. | S |

### P3 — Pulido

| ID | Hallazgo | Corrección |
|---|---|---|
| **A-29** | Sin ruta catch-all (`path="*"`): URL desconocida → pantalla vacía. `activeTab` en memoria: recargar en Feed vuelve a Panel. Caso `'MAPA'` muerto en `getActiveStyle`. Jerarquía de headings irregular. IDs hex largos en UI. | Ruta 404, sincronizar tab con URL, limpiar código muerto. |
| **A-30** | `geminiService.ts`: no hay IA real — 4 strings fijas; las claves `ROBBERY/SUSPICIOUS_ACTIVITY` nunca coinciden con `ROBO/SOSPECHOSO`, así que el "Tip de Seguridad IA" es siempre el genérico; copy en voseo rioplatense, no chileno. | Mapear claves o conectar modelo real; localizar copy. |

---

## 3. SCORECARD POR MÓDULO

| Módulo | Score | Justificación |
|---|---|---|
| Login / Acceso | **4** | Feedback de errores de formulario sólido, pero backdoor demo publicada (A-06), landing hover-only y form escondido tras un toque. |
| Dashboard (Panel/Feed/Historial) | **4** | KPI con falso cero (A-10), botones muertos, errores como vacío, catch mudos; la cronología y filtros funcionan bien. |
| IncidentReportForm | **5** | Camino mínimo excelente (2 toques a transmitir, anti-doble-envío), pero GPS y OCR fallan en silencio, mapa atrapa el gesto, backdrop borra borrador y override de tipo (A-09). |
| FlashReport / Pánico | **4** | El countdown con cancelar es la mejor pantalla de la app; lo hunden el spinner eterno ante error (A-03), GPS falso (A-11), éxito mudo y push muerta (A-05). |
| PlateVerificationBadge | **3** | El banner ROBO es inconfundible y muestra fuente (bien); el resto es el falso verde (A-01), sirena insilenciable (A-07) y overrides de un toque (A-08). |
| MapView | **3** | Tiles rotos en producción (A-04), errores como mapa vacío, `alert()` nativo y modo reporte muerto; popups y zoom bien resueltos. |
| Formularios de terreno (RoadTest/Inspection) | **6.5** | Inspection es el patrón a imitar (resumen previo, targets min-h-4rem, vibración); RoadTest pierde por hover-only y estados parciales. |
| StockAutomotoras | **5** | UI limpia y selects h-12; mock hardcodeado, sin estado vacío, menú sin handler. |
| Admin (Dashboard + Accesos) | **5** | Funciona de punta a punta (verificado), pero 8.5s de carga plana, tema claro inconsistente, overflow horizontal y errores como bandeja vacía. |
| Navbar / BottomNavbar | **3** | Toggle falso (A-07), Admin perdido en móvil (A-14), targets <44px, logout destructivo sin confirmación. |
| NotificationManager + Push | **3** | Supresión silenciosa de alertas, toast que tapa el pánico, texto placeholder, feature FCM muerta. |
| CommandPalette | **6** | Teclado, filtrado y estado vacío bien hechos; input 14px y clear de 24px. |
| Servicios (stolenVehicle / gemini / push) | **3** | El servicio core puede mentir con verde (A-01/A-02); "IA" sin IA; push sin backend. |
| OCR patentes (post-fix) | **6.5** | Pipeline ROI serio (Sobel, EXIF, corrección posicional, worker serializado) con resultado editable; falta timeout, precarga y feedback de fallo (A-12). |
| Infra PWA / offline (`index.html`) | **4** | `lang="es"` y zoom no bloqueado (bien); sin manifest, theme-color, cache de app shell ni outbox offline. |

---

## 4. TOP 10 QUICK WINS (mayor impacto / menor esfuerzo)

1. **Matar el falso verde (A-01/A-02, fase 1):** fallback offline → estado ámbar "NO VERIFICADO" en vez de `CLEAN`. Un cambio de retorno + un estado de badge.
2. **Fix de tiles del mapa (A-04):** el mini-mapa del formulario sí funciona — cambiar el basemap de MapView por ese mismo OSM (o poner la clave Carto). Una línea de URL.
3. **`text-base` + `inputMode` en inputs (A-13):** elimina el auto-zoom de iOS en toda la app. Grep-and-replace disciplinado.
4. **Safe-area del BottomNavbar (A-14):** una línea de CSS + `viewport-fit=cover` en el meta.
5. **Catch del pánico con mensaje y Reintentar (A-03):** restaurar `setIsSending(false)` + estado de error visible.
6. **Conectar la campana al mute real (A-07):** `sound.toggleMute()` ya existe — nadie lo llama.
7. **No enviar el centro de Coquimbo en silencio (A-11):** feedback de GPS fallido + badge "ubicación aproximada".
8. **Toast de éxito en FlashReport + `writeBatch` (A-17):** cierra el circuito de la alerta máxima y elimina duplicados.
9. **Feedback de OCR (A-12):** hint "No se detectó patente — escríbela" + timeout de 15s + precarga del worker al abrir el form.
10. **`aria-label` en cierres + logout con confirmación y ≥44px (A-15):** accesibilidad y anti-mis-tap en una tarde.

---

## 5. ANEXO: EVIDENCIA

**Recorrido dinámico (Fase A)** — capturas guardadas en `C:\Users\EnderJavier\.zcode\cli\artifacts\...\`:
1. Login landing 375px: logo tapando el párrafo; vidriera hover-only; credenciales demo visibles.
2. Panel principal 375px: labels "rayados" de acciones operativas; ítem "AD…" cortado en navbar; KPI "ALERTA ACTIVA 12".
3. Formulario de incidente: bottom-sheet; submit disabled poco distinguible; banner ROBO con badge trunco y "Marcar Recuperado" en zona de pulgar.
4. Mapa táctico: tiles "API KEY REQUIRED" en toda la pantalla.
5. Admin: tema claro, scrollbar horizontal sobre la navbar, "Cargando…" plano (8.5s).
6. 360×800: ítem Admin desaparecido; KPI "NORMAL / PROTEGIDO — 0" antes de que llegaran los datos.

**Mediciones dinámicas:**
- Inputs: patente 14px, descripción 12px, `inputmode: null` en todos (auto-zoom iOS garantizado).
- Enlace Admin a 375px: caja de ancho 0, fuera de viewport (no clicable).
- Gesto sobre el mapa embebido: `mapTransform translate3d(0,-220px)` — el mapa captura el arrastre, el sheet no scrollea.
- Escapes: el modal de detalle no responde a `Escape`; cierre icon-only sin nombre accesible.
- Login demo ADMIN → dashboard: ~7s (incluye creación de perfil en Firestore).
- Dispatch de pánico: ciclo completo de ~10s, escribió 2 documentos (incidente + alerta) visibles como tarjetas separadas del feed (confirma doble `setDoc`). **Remediado: ambos en `FALSE_ALARM`.**

**Auditoría estática (Fase B):** 2 pasadas paralelas sobre 27 archivos de `src/`, 30 hallazgos consolidados en la matriz (los IDs de agentes se fusionaron; los supuestos de los agentes fueron verificados dinámicamente cuando fue posible — el h1 "invisible" del Admin resultó falso: el fondo de esa pantalla es claro, aunque eso reveló la inconsistencia de tema A-22).

**No ejecutado (y por qué):**
- **Submit de reporte y alerta** (más allá del pánico accidental ya divulgado): escribir datos de prueba a la base compartida de producción no es proporcional al beneficio; el mecanismo quedó demostrado con el incidente del pánico.
- **Throttling de red / modo offline real:** el entorno de navegador embebido no expone throttling; los estados offline se auditaron por lectura de código (fallbacks A-01, A-16).
- **Pruebas en dispositivo iOS/Android físico:** el auto-zoom y la safe-area son por especificación de plataforma + medición de CSS, no por prueba en hardware.
