# Revisión técnica y correcciones de Calendario Derecho Pro

## Correcciones aplicadas

### Análisis de horarios con IA
- Se ha extraído la lógica de análisis a `server/parseScheduleImage.ts`, compartida por el servidor Express y por la función de Netlify.
- Se inicializa Gemini con la clave del servidor (`GEMINI_API_KEY` o `GOOGLE_API_KEY`) y se devuelve un error explicativo cuando no está configurada o es rechazada. La clave no se expone en el frontend.
- Se actualizó la lista de modelos candidatos a identificadores actuales documentados por Google y se mantienen alternativas de respaldo.
- Se valida el tipo MIME, el Base64 y el tamaño de la imagen antes de enviarla al proveedor.
- Netlify ahora tiene una función para `/api/ai/parse-schedule-image`, y su redirección se coloca antes del fallback general de la SPA. Antes, la configuración estática de Netlify podía devolver el HTML en lugar de ejecutar el endpoint.

### Importación desde fotos y guardado
- Las imágenes se preparan en el navegador, se limitan a un máximo de 2000 px por lado y se convierten a JPEG para evitar discrepancias entre los bytes y el MIME declarado.
- Se rechazan archivos de más de 15 MB y se mejoran los mensajes de lectura y conversión.
- Una fecha ilegible ya no se transforma silenciosamente en la fecha de hoy; la persona puede corregirla antes de guardar.
- Se normalizan fechas europeas y horas de 12/24 horas cuando es posible; no se inventa una hora de inicio.
- Se valida que el título, la fecha y ambas horas sean válidos y que la hora final sea posterior a la inicial.
- La fecha de los borradores manuales se calcula en hora local, evitando el desfase de día que podía provocar `toISOString()`.
- Si se produce un error guardando varios eventos, los ya creados se retiran de la lista pendiente para evitar duplicarlos al reintentar.

### Apariencia e iconos
- Se ha unificado el acento visual en tonos oscuros, blanco y amarillo/dorado, dejando el rojo para alertas y categorías urgentes.
- La imagen facilitada se ha convertido en variantes cuadradas para favicon, Android/PWA de 192 y 512 px, icono *maskable* de 512 px e icono de Apple de 180 px.
- El icono se usa también en la marca de la barra superior, pantalla de bienvenida, carga y guía de instalación iOS, así como en notificaciones.
- `scripts/generate-icons.js` ahora copia los iconos reales y no vuelve a sobrescribirlos con iconos genéricos.
- El service worker de Firebase Messaging usa un ámbito separado (`/fcm-messaging/`) para evitar que reemplace al service worker de la PWA, que necesita el ámbito raíz para la caché/offline.

## Verificaciones realizadas
- 33 archivos TypeScript/TSX pasaron la comprobación de sintaxis sin errores.
- La lógica compartida del backend y la función de Netlify pasaron una comprobación de tipos aislada.
- Se probaron las respuestas de validación del parser: imagen ausente (400), MIME no compatible (415), Base64 inválido (400), clave de IA ausente (503) y método HTTP incorrecto en Netlify (405).
- Se comprobaron las dimensiones y la integridad de todos los PNG de icono, así como la regeneración desde sus copias fuente.

## Pendiente de verificación en el entorno real
No se pudo ejecutar una compilación completa (`npm run build`) porque la instalación de dependencias quedó bloqueada por un error DNS al contactar con `registry.npmjs.org` (`EAI_AGAIN`). Tampoco se ha realizado una llamada real a Gemini porque el ZIP no incluye una clave privada válida.

Para activar el análisis con IA, configura `GEMINI_API_KEY` en el archivo `.env` local y reinicia el servidor; en Netlify, configúrala en **Site configuration → Environment variables** y vuelve a desplegar. No la pongas en variables `VITE_` ni en código del navegador.
