# 🚀 Guía de Despliegue: GitHub + Railway

## Paso 1: Crear Repositorio en GitHub

1. Ve a [github.com/new](https://github.com/new)
2. **Repository name**: `difusion-dashboard` (o el nombre que prefieras)
3. **Description**: "Dashboard para registro de métricas de difusión masiva en WhatsApp y Facebook"
4. Elige **Public** o **Private** (recomendado: Private si es interno)
5. **NO** inicialices con README (ya lo tenemos)
6. Haz click en **"Create repository"**

## Paso 2: Conectar Repositorio Local a GitHub

Después de crear el repositorio, GitHub te mostrará comandos. Usa estos en tu terminal:

```bash
cd "/Users/henrygomez/Desktop/paginas webs/control difusion"

# Agregar el remote de GitHub
git remote add origin https://github.com/TU_USUARIO/difusion-dashboard.git

# Renombrar rama a main (si es necesario)
git branch -M main

# Hacer push del código
git push -u origin main
```

**Reemplaza `TU_USUARIO` con tu nombre de usuario de GitHub**

## Paso 3: Verificar en GitHub

1. Recarga tu repositorio en GitHub
2. Deberías ver todos los archivos del proyecto
3. Verifica que el `README.md` se muestre automáticamente

## Paso 4: Configurar Railway

### 4.1 Crear Cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Haz click en **"Login with GitHub"** o crea una cuenta
3. Conecta tu cuenta de GitHub si es necesario

### 4.2 Crear Nuevo Proyecto

1. En tu dashboard de Railway, haz click en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Busca y selecciona tu repositorio `difusion-dashboard`
4. Haz click en **"Deploy"**

Railway creará automáticamente:
- Un entorno de producción
- Un servidor Node.js
- Necesitaremos agregar PostgreSQL manualmente

### 4.3 Agregar PostgreSQL

1. En tu proyecto de Railway, haz click en **"New"** (+ en la interfaz)
2. Selecciona **"Database"** → **"PostgreSQL"**
3. Railway creará automáticamente la base de datos
4. Verás las credenciales en el panel

### 4.4 Configurar Variables de Entorno

En tu proyecto de Railway:

1. Ve a la pestaña **"Variables"** del servidor Node
2. Agrega estas variables (copia los valores desde PostgreSQL):

```env
# Auto-generada por Railway (copiar desde PostgreSQL)
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_SECRET=generaado-con-openssl-rand-hex-32
NEXTAUTH_URL=https://TU_APP.railway.app

# Google Drive (de tu configuración)
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_DRIVE_PRIVATE_KEY=...
GOOGLE_DRIVE_PROJECT_ID=...
GOOGLE_DRIVE_FOLDER_ID=...
```

### 4.5 Generar NEXTAUTH_SECRET

```bash
# En tu terminal, ejecuta:
openssl rand -hex 32
```

Copia el resultado y pégalo en `NEXTAUTH_SECRET` en Railway.

## Paso 5: Ejecutar Migraciones en Railway

Railway ejecutará automáticamente el build, pero necesitamos migrar la BD:

1. En el dashboard de Railway, ve a tu proyecto
2. Haz click en **"Deployments"** o en el servidor Node
3. Ve a la pestaña **"Logs"**
4. Abre una **"Railway CLI"** o usa SSH para conectarte
5. Ejecuta:

```bash
npm run prisma:migrate -- --skip-generate
```

O alternativamente, en el dashboard:
1. Ve a **"Variables"**
2. Agrega esta variable temporal:
   ```
   DATABASE_URL=postgresql://...
   ```
3. Crea un script de deploy que ejecute las migraciones

Alternativamente, ejecuta localmente:
```bash
# Con tu DATABASE_URL de Railway
DATABASE_URL="postgresql://..." npm run prisma:migrate
```

## Paso 6: Verificar Despliegue

1. Railway te mostrará la URL de tu app (algo como `https://difusion-dashboard-prod.railway.app`)
2. Abre esa URL en tu navegador
3. Deberías ver la landing page

## Paso 7: Pruebas Post-Deploy

### Crear usuario
1. Ve a `/admin/users`
2. Crea un usuario de prueba

### Registrar actividad
1. Ve a `/user`
2. Completa y envía el formulario
3. **Verifica que**: Los archivos se suben a Google Drive

### Ver Dashboard
1. Ve a `/admin`
2. Deberías ver los datos agregados

## 🔄 Flujo de Actualización Futura

Cada vez que hagas cambios y quieras actualizar:

```bash
# 1. Commitear cambios
git add .
git commit -m "Descripción del cambio"

# 2. Push a GitHub
git push origin main

# 3. Railway se actualiza automáticamente
# (verifica en Deployments que el build sea exitoso)
```

## 🛠️ Variables de Entorno Importantes

### PostgreSQL (Auto-generada)
```
DATABASE_URL=postgresql://user:password@host:5432/railway
```

### NextAuth (Genera tú)
```
NEXTAUTH_SECRET=<generar-con-openssl-rand-hex-32>
NEXTAUTH_URL=https://TU_SUBDOMINIO.railway.app
```

### Google Drive (De tu configuración)
```
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
GOOGLE_DRIVE_PROJECT_ID=google-cloud-project-id
GOOGLE_DRIVE_FOLDER_ID=id-de-carpeta-en-drive
```

## ⚠️ Consideraciones Importantes

1. **`.env.local`** no se sube a GitHub (está en `.gitignore`)
2. Todas las variables deben estar en Railway's environment
3. La `PRIVATE_KEY` de Google Drive contiene saltos de línea; mantenlos exactos
4. El `NEXTAUTH_SECRET` debe ser único y aleatorio

## 🆘 Troubleshooting

### "Build failed in Railway"
- Revisa los logs en "Deployments" → "Logs"
- Verifica que `package.json` y `tsconfig.json` sean correctos

### "Database connection failed"
- Verifica que `DATABASE_URL` esté configurada en Railway
- Ejecuta migraciones con `npm run prisma:migrate`

### "Files not uploading to Drive"
- Verifica las variables de Google Drive en Railway
- Asegúrate de que la carpeta en Drive está compartida con la Service Account

### "App crashes after deploy"
- Abre "Logs" en el dashboard de Railway
- Busca mensajes de error
- Verifica que todas las variables de entorno estén configuradas

## 📊 Monitoreo Post-Deploy

Usa el dashboard de Railway para:
- Ver logs en tiempo real
- Monitorear uso de recursos
- Ver estadísticas de deployments
- Configurar alertas (plan Pro)

## 🎉 ¡Listo!

Tu dashboard debería estar en vivo. Comparte la URL (algo como `https://difusion-dashboard-prod.railway.app`) con tu equipo.

## 📝 Próximas Mejoras

Después del despliegue inicial, considera:
1. Habilitar https (Railway lo hace automáticamente)
2. Configurar dominio personalizado
3. Agregar monitoreo y logs
4. Implementar NextAuth.js completo con login
5. Agregar backup automático de la BD

---

**¿Preguntas?** Revisa los logs en Railway o abre un issue en GitHub.
