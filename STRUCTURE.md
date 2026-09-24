# Estructura del Proyecto

## Descripción General

Este proyecto es un dashboard built con **Next.js 14** (App Router), **Prisma ORM**, **PostgreSQL** y **Tailwind CSS**. Está diseñado para que un equipo registre sus métricas diarias de difusión masiva.

## Árbol de Directorios

```
control-difusion/
├── app/
│   ├── api/
│   │   └── upload/
│   │       └── route.ts           # Route Handler para subir archivos a Drive
│   ├── admin/
│   │   ├── page.tsx              # Dashboard principal del admin
│   │   └── users/
│   │       └── page.tsx          # Gestión de usuarios
│   ├── user/
│   │   └── page.tsx              # Página de usuario (formulario diario)
│   ├── globals.css               # Estilos globales Tailwind
│   ├── layout.tsx                # Layout raíz de la app
│   └── page.tsx                  # Página de inicio (home)
├── components/
│   ├── UserForm.tsx              # Componente del formulario diario
│   └── AdminDashboard.tsx        # Componente del dashboard admin
├── lib/
│   ├── actions.ts                # Server Actions (Prisma queries)
│   ├── db.ts                     # Cliente de Prisma (singleton)
│   └── drive.ts                  # Integración con Google Drive API
├── prisma/
│   ├── schema.prisma             # Esquema de la base de datos
│   └── migrations/               # Migraciones (se crea automáticamente)
├── .env.local                    # Variables de entorno (local, no en Git)
├── .env.example                  # Plantilla de variables de entorno
├── .gitignore                    # Archivos ignorados por Git
├── package.json                  # Dependencias y scripts
├── tsconfig.json                 # Configuración de TypeScript
├── tsconfig.node.json            # TS config para node scripts
├── next.config.js                # Configuración de Next.js
├── tailwind.config.ts            # Configuración de Tailwind
├── postcss.config.js             # Configuración de PostCSS
├── README.md                     # Documentación principal
├── GOOGLE_DRIVE_SETUP.md         # Guía para configurar Google Drive API
└── STRUCTURE.md                  # Este archivo

```

## 📱 Rutas de la Aplicación

### Página Pública
- **`/`** - Página de inicio (home page con enlaces a user y admin)

### Para Usuarios
- **`/user`** - Formulario diario donde usuarios registran sus métricas
  - Campos: campaña, fecha, métricas de WhatsApp y Facebook
  - Upload de evidencias (capturas, videos)
  - Integración automática con Google Drive

### Para Administradores
- **`/admin`** - Dashboard principal con:
  - Filtros por fecha (Fecha Inicio / Fecha Fin)
  - Tabla 1: Acumulados por usuario
  - Tabla 2: Acumulados por campaña
  - Cálculos: Alcance Estimado e Impactos Totales

- **`/admin/users`** - Gestión de usuarios:
  - Formulario para crear nuevos usuarios
  - Tabla con lista de usuarios registrados

### API Endpoints
- **`POST /api/upload`** - Subir evidencias a Drive y registrar actividad
  - Recibe FormData con archivos y métricas
  - Crea estructura de carpetas en Drive
  - Guarda el registro en la BD

## 🏗️ Componentes

### `UserForm.tsx` (Client Component)
**Ubicación**: `/components/UserForm.tsx`

Formulario diario para que usuarios registren su actividad:
- Input de campaña (texto)
- Input de fecha (HTML5 date picker)
- Inputs numéricos para WhatsApp (grupos, mensajes)
- Inputs numéricos para Facebook (posts, comentarios, etc.)
- Inputs dinámicos para links de posts de Facebook
- Input file multiple para evidencias
- Submit button con estado de carga

**Props**:
```typescript
interface UserFormProps {
  userName: string;  // Nombre del usuario
  userId: string;    // ID del usuario en la BD
}
```

### `AdminDashboard.tsx` (Client Component)
**Ubicación**: `/components/AdminDashboard.tsx`

Dashboard administrativo con análisis de datos:
- Panel de filtros por fecha (Inicio y Fin)
- Estadísticas resumen (Alcance Total, Impactos)
- Tabla 1: Agregados por usuario
- Tabla 2: Agregados por campaña
- Cálculos automáticos de métricas de WhatsApp

## 🔑 Server Actions

**Ubicación**: `/lib/actions.ts`

Todas las funciones son `"use server"` y están pensadas para ser usadas desde componentes Client:

### `createUser(name, email, password, role)`
- Crea nuevo usuario con contraseña hasheada
- Retorna: `{ success: boolean, user?: User, error?: string }`

### `getActivityLogsByDateRange(startDate?, endDate?)`
- Obtiene todos los registros de actividad en un rango de fechas
- Retorna: `{ success: boolean, data: ActivityLog[], error?: string }`

### `getAggregatedByUser(startDate?, endDate?)`
- Agrupa actividades por usuario con sums totales
- Retorna: `{ success: boolean, data: AggregatedUser[], error?: string }`

### `getAggregatedByCampaign(startDate?, endDate?)`
- Agrupa actividades por nombre de campaña con sums totales
- Retorna: `{ success: boolean, data: AggregatedCampaign[], error?: string }`

### `getUserForActivityLog(userId)`
- Obtiene datos de un usuario específico

### `getAllUsers()`
- Obtiene lista de todos los usuarios registrados

## 🚀 API Route Handlers

### `POST /api/upload`

**Ubicación**: `/app/api/upload/route.ts`

Maneja la subida de archivos a Google Drive y el registro de actividades.

**Proceso**:
1. Recibe FormData con archivos y métricas
2. Valida datos requeridos
3. Crea estructura de carpetas en Google Drive:
   - Carpeta principal: nombre del usuario
   - Subcarpeta: fecha actual (DD-MM-YYYY)
4. Sube todos los archivos a la subcarpeta
5. Registra la actividad en la base de datos
6. Retorna URL de la carpeta de Drive

**Response**:
```json
{
  "success": true,
  "message": "Activity logged successfully. X files uploaded.",
  "folderUrl": "https://drive.google.com/drive/folders/...",
  "activityLog": { ... }
}
```

## 📊 Modelos de Datos (Prisma)

### User
```typescript
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String   // bcryptjs hasheada
  role      Role     @default(USER)  // ADMIN | USER
  activityLogs ActivityLog[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### ActivityLog
```typescript
model ActivityLog {
  id                      String   @id @default(cuid())
  userId                  String
  user                    User     @relation(fields: [userId])
  date                    DateTime @default(now())
  campaignName            String
  
  // WhatsApp
  whatsappGroupsReached   Int      @default(0)
  whatsappMessagesPerGroup Int     @default(0)
  
  // Facebook
  fbOwnPostsCreated       Int      @default(0)
  fbOwnPostsLinks         String[] @default([])
  fbCommentsMade          Int      @default(0)
  fbGroupsShared          Int      @default(0)
  fbNewGroupsJoined       Int      @default(0)
  
  driveEvidenceFolderUrl  String?
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
}
```

## 🎨 Estilos

### Tailwind CSS
- **Configuración**: `tailwind.config.ts`
- **Estilos globales**: `app/globals.css`
- **Enfoque**: Usar clases Tailwind puras, sin componentes preconstruidos
- **Colores principales**: 
  - Azul: `blue-500`, `blue-600`
  - Verde: `green-500`, `green-600`
  - Gris: `gray-100` a `gray-900`

**Componentes diseñados con Tailwind**:
- Botones
- Inputs de texto, número, date, file
- Tablas
- Formularios
- Tarjetas
- Estados de carga y error

## 🔐 Seguridad

### Contraseñas
- Se hashean con `bcryptjs` en la creación de usuario
- Se comparan en el login (cuando se implemente NextAuth)

### Archivos
- Se suben desde el servidor hacia Google Drive (no desde el cliente)
- Las credenciales de Google Drive nunca se exponen al cliente

### Variables de Entorno
- `.env.local` está en `.gitignore` (no se sube a Git)
- `NEXTAUTH_SECRET` debe ser aleatorio en producción
- `GOOGLE_DRIVE_PRIVATE_KEY` es sensible y debe protegerse

## 📦 Dependencias Principales

```json
{
  "next": "^14.2.0",
  "react": "^18.2.0",
  "@prisma/client": "^5.14.0",
  "googleapis": "^139.0.0",
  "bcryptjs": "^2.4.3",
  "tailwindcss": "^3.4.0"
}
```

## 🔄 Flujo de Datos

### Registro de Actividad (Usuario)

```
Usuario completa formulario
    ↓
UserForm (Client Component)
    ↓
POST /api/upload (Route Handler)
    ↓
Google Drive API (crear carpetas y subir archivos)
    ↓
Prisma (guardar activityLog en BD)
    ↓
Respuesta con URL de Drive
```

### Visualización de Datos (Admin)

```
Admin accede a /admin
    ↓
AdminDashboard (Client Component)
    ↓
getAggregatedByUser (Server Action)
getAggregatedByCampaign (Server Action)
    ↓
Prisma (groupBy + _sum)
    ↓
Datos agregados
    ↓
Cálculos (Alcance, Impactos)
    ↓
Mostrar tablas y gráficos
```

## 🚀 Próximas Mejoras (Sugerencias)

1. **NextAuth.js**: Implementar login/logout para autenticación real
2. **Exportar datos**: Agregar botón para exportar a CSV/Excel
3. **Gráficos**: Usar library como Recharts para visualizar tendencias
4. **Notificaciones**: Toast notifications con feedback de usuario
5. **Roles y permisos**: Mejorar seguridad con validación de roles en Server Actions
6. **Paginación**: Para tablas grandes, agregar paginación
7. **Búsqueda**: Agregar filtros por usuario o campaña
