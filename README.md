# Difusión Dashboard

App web interna para registrar y revisar el trabajo diario de difusión de varios equipos. Cada miembro llena un reporte por día con sus números, enlaces y evidencias (capturas o videos), y el coordinador de cada equipo revisa los totales en su propio panel.

Hoy la app tiene dos equipos, cada uno con su formulario, su panel y su clave de coordinador:

| | Equipo 1 | Equipo 2 |
|---|---|---|
| Qué registra | WhatsApp y Facebook | TikTok |
| Formulario | `/user` | `/equipo-2` |
| Panel del coordinador | `/admin` | `/equipo-2/admin` |
| Gestión de usuarios | `/admin/users` | `/equipo-2/admin/users` |
| Clave del coordinador | `ADMIN_PASSWORD` | `ADMIN_PASSWORD_TEAM2` |
| Carpeta de evidencias en Drive | `EVIDENCIA_WHATSAPP`, `EVIDENCIA_FACEBOOK` | `EVIDENCIA_TIKTOK` |

Cada panel muestra **solo** a su equipo. La separación la aplica el servidor: una clave de coordinador nunca puede ver, editar ni borrar datos del otro equipo.

---

## Funciones

### Miembros (formulario)
- Eligen su nombre (con buscador) y entran con su clave.
- Llenan un **reporte por día**. Si envían varias veces el mismo día, los números se **suman** y los enlaces y observaciones se agregan.
- Suben evidencias **sin límite de archivos**. Una pantalla de carga muestra el progreso real (%, MB) y no se cierra hasta que todo queda guardado en Drive.
- Todas las fechas usan la hora de Ecuador (`America/Guayaquil`).

**Equipo 1:** grupos de WhatsApp a los que se enviaron mensajes, mensajes enviados, personas contactadas por WhatsApp, posts creados en Facebook (con enlaces), comentarios (con enlaces de los posts), grupos donde se compartió, grupos nuevos, personas contactadas por mensaje directo de Facebook.

**Equipo 2:** comentarios realizados en TikTok y enlaces de las publicaciones comentadas. **Publicaciones comentadas** = cantidad de enlaces, se calcula sola.

### Coordinador (panel)
- Tarjetas de totales, tabla por usuario (total y "hoy"), historial diario por persona, enlaces por fecha y observaciones.
- **Filtro de fechas** con botones rápidos: Hoy, Últimos 7 días, Últimos 30 días, Este mes y Todo. Al abrir, los totales muestran todo el historial y el historial y los enlaces solo los últimos 7 días, para que cargue rápido.
- **Editar** cualquier reporte de su equipo y **descargar PDF** del período elegido.
- **Usuarios:** crear, eliminar, cambiar clave, cambiar teléfono (con historial de números) e **importar una lista** pegada desde Excel (nombre y celular; ignora títulos y dirección, corrige mayúsculas y el 0 inicial del celular, y omite repetidos).

---

## Tecnología

- **Next.js 14** (App Router) + React 18 + TypeScript
- **Tailwind CSS** (sin librerías de componentes)
- **PostgreSQL** + **Prisma**
- **Google Drive API** con OAuth2 (los archivos se suben como una cuenta de Google real)
- **jsPDF** para los reportes
- Sesiones con cookie firmada (HMAC) y claves de miembros cifradas con **bcrypt**
- Publicada en **Railway**: se despliega sola con cada push a `main`, aplica las migraciones al arrancar y se apaga cuando nadie la usa

---

## Estructura

```
app/
  page.tsx                    Inicio: una tarjeta por equipo
  user/                       Formulario Equipo 1
  admin/                      Panel, login y usuarios Equipo 1
  equipo-2/                   Formulario Equipo 2
  equipo-2/admin/             Panel, login y usuarios Equipo 2
  api/upload/                 Recibe el reporte, sube archivos a Drive y guarda en la BD
  api/auth/google/            Conecta la cuenta de Google Drive (OAuth)
components/
  UserSelector.tsx            Elegir nombre + clave del miembro
  UserForm.tsx                Formulario diario y pantalla de carga
  AdminDashboard.tsx          Panel del coordinador
  UsersAdmin.tsx              Gestión de usuarios
  ImportUsers.tsx             Importar usuarios desde una lista
  AdminLogin.tsx, AdminNav.tsx, SiteNav.tsx, LogoutButton.tsx
lib/
  teams.ts                    Configuración de cada equipo (rutas, métricas, enlaces, evidencias)
  actions.ts                  Consultas del servidor, siempre limitadas al equipo del coordinador
  auth.ts, session.ts         Login de miembros y coordinadores
  drive.ts                    Carpetas y subida de archivos a Drive
  importUsers.ts              Limpieza de nombres y celulares para la importación
  dates.ts, labels.ts, db.ts
middleware.ts                 Protege el panel de cada equipo con su propia sesión
prisma/schema.prisma          Modelo de datos (User, ActivityLog, PhoneChange, GoogleAuthToken)
```

### Agregar o cambiar métricas de un equipo
Las métricas, los enlaces y las secciones de evidencias de cada equipo están en [`lib/teams.ts`](lib/teams.ts). El panel, la edición, el PDF y la ruta de envío leen esa configuración. Para una métrica nueva:
1. Agrega la columna en `prisma/schema.prisma` (`Int @default(0)` o `String[] @default([])`) y crea su migración.
2. Agrega la clave en `ALL_METRIC_KEYS` o `ALL_LINK_KEYS` y en el equipo correspondiente de `TEAMS`.
3. Agrega el campo en el formulario de ese equipo (`components/UserForm.tsx`).

### Organización en Google Drive
```
<carpeta principal>/
  <Nombre de la persona>/
    <DD-MM-AAAA>/
      EVIDENCIA_WHATSAPP/   (Equipo 1)
      EVIDENCIA_FACEBOOK/   (Equipo 1)
      EVIDENCIA_TIKTOK/     (Equipo 2)
```
Las carpetas se crean con el nombre de la persona, por eso la app no permite dos usuarios con el mismo nombre, aunque sean de equipos distintos.

---

## Variables de entorno

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL |
| `NEXTAUTH_SECRET` | Firma las cookies de sesión (texto largo y aleatorio) |
| `ADMIN_PASSWORD` | Clave del coordinador del Equipo 1 |
| `ADMIN_PASSWORD_TEAM2` | Clave del coordinador del Equipo 2 |
| `GOOGLE_OAUTH_CLIENT_ID` | Cliente OAuth de Google Cloud |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Secreto del cliente OAuth |
| `GOOGLE_OAUTH_REDIRECT_URI` | `https://<tu-app>/api/auth/google/callback` |
| `GOOGLE_DRIVE_FOLDER_ID` | ID de la carpeta principal de Drive (lo que va después de `/folders/` en su URL) |

En Railway se configuran en **servicio → Variables**. En local van en `.env.local`; usa [`.env.example`](.env.example) como plantilla. Nunca subas claves reales a GitHub.

---

## Conectar Google Drive

1. En [Google Cloud Console](https://console.cloud.google.com), crea un proyecto y habilita **Google Drive API**.
2. En **APIs y servicios → Credenciales**, crea un **ID de cliente OAuth** de tipo "Aplicación web" y agrega como URI de redirección `https://<tu-app>/api/auth/google/callback`.
3. Copia el ID y el secreto a las variables `GOOGLE_OAUTH_*`.
4. Abre `https://<tu-app>/api/auth/google` e inicia sesión con la cuenta de Google dueña de la carpeta. La app guarda el permiso y desde entonces sube los archivos sola.

Si la subida falla con "Google Drive not authorized yet", repite el paso 4.

---

## Desarrollo local

Requiere Node.js 18+ y PostgreSQL.

```bash
npm install
cp .env.example .env.local   # y completa los valores
npm run prisma:migrate       # crea las tablas
npm run dev                  # http://localhost:3000
```

Otros comandos:

```bash
npm run build          # build de producción (genera Prisma y compila)
npm run prisma:studio  # ver y editar la base de datos
npx tsc --noEmit       # revisar tipos
```

---

## Despliegue

Cada push a `main` en GitHub despliega automáticamente en Railway. Antes de arrancar, Railway corre `prisma migrate deploy`, así que las migraciones nuevas se aplican solas.

Las migraciones se escriben para **no borrar datos**: solo agregan columnas o tablas, o relajan restricciones.

---

## Pendiente

- **Envío de accesos por correo** (Equipo 2): cargar los correos de los miembros y enviar a cada uno su usuario, una clave generada y el enlace de acceso, desde una cuenta de Gmail (`GMAIL_USER`, `GMAIL_APP_PASSWORD`, `APP_URL`).
- **Súper administrador** que vea los dos equipos juntos.

---

Proyecto interno, uso restringido.
