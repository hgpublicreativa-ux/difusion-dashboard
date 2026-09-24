# Difusión Dashboard

Dashboard interno para registro y visualización de métricas de difusión masiva en WhatsApp y Facebook.

## 🚀 Características

- ✅ Formulario diario para usuarios registren sus métricas
- ✅ Subida automática de evidencias (screenshots/videos) a Google Drive
- ✅ Dashboard administrativo con filtros por fecha
- ✅ Tablas de agregación por usuario y por campaña
- ✅ Cálculos automáticos de alcance e impactos de WhatsApp
- ✅ Interfaz diseñada con Tailwind CSS puro (sin librerías de componentes)

## 📋 Requerimientos

- Node.js 18+
- PostgreSQL (local o en Railway)
- Google Cloud Service Account con acceso a Google Drive API
- npm o yarn

## 🔧 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd control-difusion
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto y completa lo siguiente:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/difusion_db"

# NextAuth
NEXTAUTH_SECRET="tu-secreto-aleatorio-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Google Drive Service Account
# 1. Ve a Google Cloud Console
# 2. Crea un nuevo proyecto
# 3. Habilita Google Drive API
# 4. Crea una Service Account
# 5. Descarga las credenciales JSON
# 6. Llena los valores desde ese JSON:

GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL="tu-service-account@proyecto.iam.gserviceaccount.com"
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_DRIVE_PROJECT_ID="tu-google-cloud-project-id"

# ID de la carpeta principal en Drive donde se guardarán las evidencias
# Para obtenerlo: abre la carpeta en Google Drive, copia el ID de la URL
# https://drive.google.com/drive/folders/FOLDER_ID_AQUI
GOOGLE_DRIVE_FOLDER_ID="tu-folder-id"
```

### 3. Configurar Base de Datos

```bash
# Generar cliente Prisma
npm run prisma:generate

# Crear/migrar la base de datos
npm run prisma:migrate
```

### 4. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
.
├── app/                    # Next.js App Router
│   ├── api/
│   │   └── upload/        # Route Handler para subir archivos a Drive
│   ├── admin/             # Páginas del administrador
│   ├── user/              # Páginas del usuario
│   ├── globals.css        # Estilos globales Tailwind
│   └── layout.tsx         # Layout raíz
├── components/            # Componentes React
│   ├── UserForm.tsx       # Formulario diario del usuario
│   └── AdminDashboard.tsx # Dashboard administrativo
├── lib/                   # Utilidades y librerías
│   ├── actions.ts         # Server Actions (consultas a BD)
│   ├── db.ts              # Cliente Prisma
│   └── drive.ts           # Integración Google Drive
├── prisma/
│   └── schema.prisma      # Esquema de base de datos
└── package.json
```

## 🗄️ Esquema de Base de Datos

### Modelo: User
```
- id (String, PK)
- name (String)
- email (String, unique)
- password (String, hashed)
- role (ADMIN | USER)
- createdAt (DateTime)
- updatedAt (DateTime)
```

### Modelo: ActivityLog
```
- id (String, PK)
- userId (String, FK)
- date (DateTime, default: now)
- campaignName (String)
- whatsappGroupsReached (Int)
- whatsappMessagesPerGroup (Int)
- fbOwnPostsCreated (Int)
- fbOwnPostsLinks (String[])
- fbCommentsMade (Int)
- fbGroupsShared (Int)
- fbNewGroupsJoined (Int)
- driveEvidenceFolderUrl (String)
```

## 📊 Cálculos Implementados

### Alcance Estimado (WhatsApp)
```
Alcance = whatsappGroupsReached × AVERAGE_PEOPLE_PER_GROUP (150)
```

### Impactos Totales (WhatsApp)
```
Impactos = Alcance × whatsappMessagesPerGroup
```

## 🌐 Endpoints de API

### POST /api/upload
Sube evidencias a Google Drive y registra la actividad

**Body:**
```json
{
  "userId": "user-id",
  "userName": "Nombre del Usuario",
  "campaignName": "Nombre de Campaña",
  "date": "2024-10-24",
  "whatsappGroupsReached": 150,
  "whatsappMessagesPerGroup": 5,
  "fbOwnPostsCreated": 3,
  "fbOwnPostsLinks": ["https://..."],
  "fbCommentsMade": 10,
  "fbGroupsShared": 20,
  "fbNewGroupsJoined": 5,
  "files": [File, File, ...]
}
```

## 🚀 Despliegue en Railway

### 1. Preparar el Proyecto

```bash
# Crear archivo .env.production con variables de producción
# Asegúrate de que no incluya secretos sensibles (usa Railway's environment variables)
```

### 2. Conectar a Railway

```bash
# Instalar Railway CLI (si no lo tienes)
npm i -g @railway/cli

# Autenticarte
railway login

# Crear nuevo proyecto
railway init

# Desplegar
railway up
```

### 3. Configurar Variables en Railway

En el dashboard de Railway:
1. Ve a tu proyecto
2. Abre "Environment"
3. Añade todas las variables de `.env.local`
4. Railway crearán automáticamente PostgreSQL si lo conectas

### 4. Ejecutar Migraciones

```bash
railway run npm run prisma:migrate
```

## 🔒 Seguridad

- Las contraseñas se hashean con bcrypt
- Las variables sensibles deben estar en `.env.local` (gitignored)
- Google Drive API usa Service Account (no OAuth interactivo)
- Los archivos se suben directamente desde el servidor (no expone credenciales al cliente)

## 📝 Uso de la Aplicación

### Para Usuarios
1. Accede a `/user`
2. Completa el formulario diario con:
   - Nombre de la campaña
   - Métricas de WhatsApp y Facebook
   - Sube capturas/videos de evidencia
3. Haz click en "Submit" - los archivos se suben a Google Drive automáticamente

### Para Administradores
1. Accede a `/admin/users` para crear nuevos usuarios
2. Ve a `/admin` para ver el dashboard
3. Usa los filtros de fecha para analizar períodos específicos
4. Las tablas muestran agregados por usuario y por campaña

## 🛠️ Desarrollo

```bash
# Ver base de datos con Prisma Studio
npm run prisma:studio

# Generar cliente Prisma después de cambios en schema
npm run prisma:generate

# Crear nueva migración
npm run prisma:migrate
```

## 🐛 Troubleshooting

### "Failed to connect to database"
- Verifica que PostgreSQL esté corriendo
- Comprueba la `DATABASE_URL` en `.env.local`

### "Failed to upload file to Drive"
- Verifica que el `GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL` sea correcto
- Asegúrate de que la Service Account tiene permiso de escritura en Google Drive
- Comprueba que la `GOOGLE_DRIVE_PRIVATE_KEY` está bien formateada

### Los campos de número no se guardan
- Asegúrate de enviar valores numéricos válidos (>= 0)
- Revisa la consola del servidor para mensajes de error

## 📚 Referencias

- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma ORM](https://www.prisma.io/docs)
- [Google Drive API](https://developers.google.com/drive/api/v3/quickstart)
- [Tailwind CSS](https://tailwindcss.com)

## 📄 Licencia

Proyecto interno - Uso restringido

## 👨‍💻 Soporte

Para preguntas o problemas, contacta al equipo de desarrollo.
