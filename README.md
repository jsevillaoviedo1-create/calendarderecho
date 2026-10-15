# Calendario Derecho Pro

Aplicación de calendario privada y segura desarrollada por **Jorge Sevilla** con **React**, **Vite**, **Tailwind CSS**, **FullCalendar**, **WebAuthn** y almacenamiento seguro.

---

## 🚀 Características Principales

* 📅 **FullCalendar Interactivo**: Vistas de Mes (`dayGridMonth`), Semana (`timeGridWeek`), Día (`timeGridDay`) y Agenda (`listWeek`). Permite crear eventos con un clic, reprogramar con arrastrar y soltar (drag & drop) y redimensionar la duración en tiempo real.
* 🔒 **Firebase Authentication**: Inicio de sesión mediante cuenta de **Google** (Popup) y **Email / Contraseña**, incluyendo flujo de recuperación de contraseña.
* 🛡️ **Cloud Firestore con Aislamiento Estricto (Zero-Trust ABAC)**: Reglas de seguridad (`firestore.rules`) que garantizan que ningún usuario pueda consultar, listar o modificar los eventos o datos de otro usuario.
* 🧬 **Desbloqueo Biométrico Local (WebAuthn)**: Soporte para Touch ID, Face ID y Windows Hello mediante la API de `PublicKeyCredential`. Bloquea la sesión de la pantalla en cualquier momento y reanúdala con tu huella o rostro sin volver a introducir credenciales.
* 📥 **Importación y Exportación ICS**: Procesamiento de archivos `.ics` con **`ical.js`**, vista previa de eventos antes de importar, importación por lotes en Firestore y descarga de tu calendario en formato RFC 5545 iCalendar estándar.
* ✨ **Escaneo de horarios con IA**: Sube o pega una foto del horario, revisa los eventos detectados y añádelos al calendario y a la agenda.
* 🔔 **Notificaciones Push con FCM (Firebase Cloud Messaging)**: Service worker en segundo plano (`firebase-messaging-sw.js`), alertas push para eventos que inician en menos de 15 minutos, avisos por cambios importantes en la agenda y centro de notificaciones con bandeja de leídos/no leídos.
* 🏷️ **Categorización por Colores**: Etiquetas organizativas (Trabajo, Personal, Estudio, Salud & Deporte, Finanzas, Urgente) con filtrado instantáneo por píldoras.

---

## 🛠️ Tecnologías Utilizadas

* **Frontend**: React 19, TypeScript, Vite
* **Estilos**: Tailwind CSS v4, Lucide Icons
* **Calendario**: `@fullcalendar/react`, `@fullcalendar/core`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`, `@fullcalendar/list`
* **Parser ICS**: `ical.js`
* **Backend en la Nube**: Firebase Authentication, Cloud Firestore, Firebase Cloud Messaging
* **Seguridad Biométrica**: W3C Web Authentication API (`navigator.credentials`)

---

## 💻 Instalación y Desarrollo Local

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   cd TU_REPOSITORIO
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar las claves**: copia `.env.example` a `.env` y completa `GEMINI_API_KEY` y las variables públicas de Firebase. La clave de Gemini solo se usa desde el servidor.

4. **Iniciar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

5. **Compilar para producción**:
   ```bash
   npm run build
   ```

---

## 🔐 Seguridad de la Base de Datos

Las reglas de Firestore están definidas en `firestore.rules` y aplican las siguientes directivas:
1. **Denegación por defecto** en todas las rutas no declaradas.
2. **Validación estricta de esquemas**: Longitud máxima de títulos, fechas ISO válidas y tipos de datos obligatorios.
3. **Propiedad inmutable**: El campo `userId` debe coincidir con `request.auth.uid` tanto en creación como en actualización.
4. **Protección contra enumeración de usuarios**: La lista global de perfiles está bloqueada para prevenir escaneos no autorizados.

---

## 🌐 Despliegue en Producción

* **Netlify**: El repositorio incluye `netlify.toml` y `public/_redirects` listos para desplegar automáticamente al conectar con tu rama `main`.
* **Firebase Hosting**: Ejecuta `firebase deploy --only hosting` para publicar directamente en los servidores de Google.

*Recuerda añadir tu dominio final a la lista de **Dominios Autorizados** en Firebase Console (Authentication → Settings → Authorized Domains).*
