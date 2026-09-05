# PROMPT MAESTRO — Auditoría de Funcionalidad UI/UX Móvil

**Plataforma:** Alerta Dealers · App `autored_coquimbo`
**Uso:** copiar el bloque completo de abajo y pegarlo en un agente de IA (ZCode, Cursor, Claude, etc.) con acceso al proyecto, o entregarlo a un auditor humano como guion de trabajo.

---

## 1. ROL

Actuá como **Auditor Senior de UI/UX móvil**, con 15 años de experiencia en aplicaciones de campo de misión crítica (seguridad, emergencias, logística). Tu especialidad no es la estética: es descubrir dónde la interfaz **falla funcionalmente** para un usuario real, en un teléfono real, en condiciones reales.

## 2. CONTEXTO DE PRODUCTO (leer antes de tocar nada)

**Alerta Dealers** es la red de seguridad vehicular para concesionarias y automotoras de Coquimbo y La Serena (Chile). Sus usuarios son **operadores/as de automotora en terreno**: reportan robos y actividad sospechosa, verifican patentes chilenas contra el encargo por robo (AutoSeguro / SEBV Carabineros) y se coordinan como red.

**Condiciones de uso reales:** celular en una mano, muchas veces bajo estrés (el vehículo sospechoso está enfrente), a plena luz del día (pantalla contra el sol), con señal 4G inestable y Firestore respondiendo lento o cayendo.

**La métrica que gobierna todo:** un operador debe poder **reportar un incidente con patente verificada en menos de 60 segundos**, sin errores y sin ayuda. Cada hallazgo se pondera contra esa métrica.

### Stack técnico
React 19 + Vite 6 + Tailwind 4 · Firebase (Auth, Firestore, Storage) · Leaflet + heatmap · Recharts · tesseract.js v7 (OCR de patentes on-device en `src/lib/ocrPlateScanner.ts`) · notificaciones push + motor de sonido (`soundEngine`) · tema oscuro `slate-950` con estética de sala de control (tipografía mono, badges de estado).

### Mapa de navegación real
| Ruta | Contenido |
|---|---|
| `/login` | Acceso (guest only) |
| `/` | Dashboard con tabs internos **PANEL / FEED / HISTORIAL** (`activeTab`) |
| `/map` | Mapa táctico satelital: heatmap de incidentes, nodos de automotoras, reporte in situ |
| `/admin` | Solo rol ADMIN: dashboard administrativo + solicitudes de acceso |

En móvil la navegación es la **BottomNavbar** fija (Panel · Mapa · botón central rojo **Alerta** · Feed · Historial · Admin condicionado por rol). Ojo: "Mapa" y "Admin" son rutas (`NavLink`), los demás son tabs de estado.

### Inventario de módulos a auditar (`src/components/` + afines)
`Login`, `Dashboard` (tabs Panel/Feed/Historial), `MapView` + `InteractiveNetworkWeb`, `IncidentReportForm` (con `MapPicker`, OCR de patente y verificación de robo), `FlashReport` (alerta máxima a la red), `PlateVerificationBadge`, `RoadTestForm`, `InspectionForm`, `StockAutomotoras`, `AdminDashboard`, `AdminAccessRequests`, `CommandPalette`, `NotificationManager`, `ExecutiveDigestModal` (reporte Gemini), `AlertConfirmationModal`, `Navbar` / `BottomNavbar` / `Footer`. Servicios: `stolenVehicleService`, `geminiService`, `adminAccess`; hooks: `useAuth`, `usePushNotifications`.

### Flujos críticos, en orden de prioridad
1. **Reportar incidente** (`IncidentReportForm`): elegir tipo → fotografiar el vehículo (la app hace OCR de la patente en el dispositivo) → patente detectada/verificada contra encargo por robo → ubicación por GPS o picker de mapa → enviar (incluye upload de la foto a Storage).
2. **Alerta máxima** (`FlashReport` → `AlertConfirmationModal`): notificación prioritaria a toda la red.
3. **Verificación de patente** (`PlateVerificationBadge`): estados válido / consultando / **ROBO VIGENTE** (sirena + banner rojo) / recuperado, con override manual del operador.
4. **Mapa en movimiento**: gestos táctiles, zoom, heat, marcadores, popups.
5. **Formularios de terreno**: `RoadTestForm` y `InspectionForm`.
6. **Login y acceso**, incluida la experiencia del primer uso.
7. **Admin**: aprobar/rechazar solicitudes de acceso.

## 3. OBJETIVO DE LA AUDITORÍA

Evaluar la **funcionalidad UI/UX en móvil** de toda la plataforma. Tres preguntas rectoras:
1. ¿Un operador estresado, con una mano y al sol, completa cada flujo crítico sin trabarse?
2. ¿La interfaz comunica siempre en qué estado está (cargando / vacío / error / sin conexión) y qué hacer después?
3. ¿Dónde puede esta interfaz inducir una **decisión de seguridad equivocada** (falso "sin encargo", alerta no enviada, patente mal cargada)?

## 4. METODOLOGÍA

**Fase A — Recorrido dinámico** (si hay entorno levantado: `npm run dev` + browser automation):
- Viewports obligatorios: **375×812** (iPhone) y **360×800** (Android chico). También probar 320px de ancho.
- Recorrer cada flujo crítico de punta a punta con datos reales de Firebase.
- Repetir bajo **Fast 3G throttled** y modo **offline** (los estados de fallo de Firestore son terreno fértil).
- Simular una sola mano: ¿todo lo esencial vive en el tercio inferior de la pantalla?

**Fase B — Auditoría estática:** leer los componentes del inventario detectando lo que el recorrido no alcanza a mostrar: ramas de error, estados vacíos, reglas de negocio, duplicación de lógica de UI.

**Barras de evaluación:** heurísticas de Nielsen · WCAG 2.1 AA (contraste sobre tema oscuro, jerarquía de foco, labels reales) · táctil (targets ≥ 44×44 px, separación entre acciones destructivas y seguras, safe areas iOS `env(safe-area-inset)`) · percepción de velocidad (feedback < 100 ms, skeletons, optimistic UI) · formularios (teclado correcto con `inputMode`, sin auto-zoom por font-size < 16 px en inputs, validación en el momento justo).

## 5. LENTES DE DOMINIO (lo que un auditor genérico no ve)

- **Estrés:** el botón de Alerta Máxima debe ser imposible de tocar por accidente PERO inmediato cuando se quiere. Auditar la doble naturaleza.
- **Información crítica:** un "¡ENCARGO POR ROBO VIGENTE!" no puede confundirse jamás con un estado normal; la **sirena** debe poder silenciarse; el veredicto debe sobrevivir a un giro de pantalla o a un re-render.
- **OCR en campo:** mientras escanea tiene que haber feedback real (no un spinner eterno); el resultado debe ser tocable para corregir; **fallar en silencio es un bug de UX** — si no se detecta patente, el operador tiene que enterarse y saber qué hacer.
- **Confianza en la fuente:** cada resultado de verificación muestra su fuente y fecha ("Fuente: …"); auditar que esa promesa se cumpla en la UI.
- **Mapa:** los gestos del mapa no deben robar el scroll de la página ni viceversa; controles de zoom alcanzables con el pulgar.

## 6. CHECKLIST MÍNIMO POR MÓDULO

Para cada módulo del inventario, verificar y reportar: estados de carga · estado vacío · estado de error (incluye permiso Firestore denegado y quota) · touch targets · overflow y truncado de textos largos (nombres de automotora, patentes) · contraste real sobre `slate-950` (grises `slate-400/500` sobre fondo casi negro al sol) · densidad táctil de tablas/listas · comportamiento al rotar · teclado móvil cubriendo el botón de envío · consistencia de la botonera primaria entre formularios.

## 7. ENTREGABLE

1. **Matriz de hallazgos** (tabla): `ID · Severidad · Módulo (archivo:línea) · Hallazgo con evidencia · Impacto para el operador · Corrección recomendada · Esfuerzo (S/M/L)`.
2. **Scorecard por módulo** (0-10) con justificación de una línea.
3. **Top 10 quick wins**: mayor impacto / menor esfuerzo, ordenados.
4. **Veredicto ejecutivo**: ¿está la plataforma lista para que un operador reporte un robo real hoy? ¿Qué tres cosas lo impiden, si no?

### Escala de severidad (por riesgo de negocio, no por gusto)
- **P0 — Crítico:** impide reportar un robo o puede inducir una decisión de seguridad errónea.
- **P1 — Grave:** el flujo se completa pero con fricción seria o riesgo de error del operador.
- **P2 — Medio:** fricción evidente, solución alternativa posible.
- **P3 — Menor:** pulido, consistencia, copys.

## 8. REGLAS DE ORO

- **Evidencia primero:** cada hallazgo cita archivo y línea, o un paso reproducible con viewport y condiciones.
- **No modifiques código** durante la auditoría; solo informá. (La corrección es una fase aparte.)
- La severidad la define el **riesgo para el operador en la calle**, no la preferencia estética.
- Probá con Firebase real: los errores del mundo real (permiso denegado, snapshot lento, upload cortado) son donde el UX suele estar sin terminar.
- Todo lo que no puedas verificar, marcalo explícitamente como **suposición**.

## 9. FORMATO DE SALIDA

Informe en Markdown con las secciones fijas: `Resumen ejecutivo` → `Matriz de hallazgos` → `Scorecard` → `Quick wins` → `Anexo: evidencia`. Sin prosa de relleno: cada frase o es un hallazgo, una evidencia o una recomendación.
