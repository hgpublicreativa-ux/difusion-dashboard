# Quick Start Guide

Guía rápida para poner en funcionamiento el dashboard en 5 minutos.

## 1️⃣ Instalación Inicial

```bash
# Instalar dependencias
npm install

# Generar cliente de Prisma
npm run prisma:generate
```

## 2️⃣ Configurar Base de Datos

### Opción A: PostgreSQL Local

```bash
# Si tienes PostgreSQL instalado, crea una base de datos
createdb difusion_db

# En .env.local
DATABASE_URL="postgresql://tu_usuario:tu_contraseña@localhost:5432/difusion_db"

# Ejecutar migraciones
npm run prisma:migrate
```

### Opción B: Railway (Recomendado para Producción)

```bash
# Railway crearemos la BD por ti
# Solo configura DATABASE_URL en Railway's environment variables
```

## 3️⃣ Configurar Google Drive

1. Sigue la guía en `GOOGLE_DRIVE_SETUP.md`
2. Llena estas variables en `.env.local`:
   ```
   GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL="..."
   GOOGLE_DRIVE_PRIVATE_KEY="..."
   GOOGLE_DRIVE_PROJECT_ID="..."
   GOOGLE_DRIVE_FOLDER_ID="..."
   ```

## 4️⃣ Configurar NextAuth (Opcional)

```bash
# Generar un secreto
openssl rand -hex 32
```

En `.env.local`:
```
NEXTAUTH_SECRET="tu-secreto-de-arriba"
NEXTAUTH_URL="http://localhost:3000"
```

## 5️⃣ Ejecutar en Desarrollo

```bash
npm run dev
```

Abre http://localhost:3000 en tu navegador.

## 🧪 Prueba Rápida

### 1. Crear un usuario (Admin)
- Ve a http://localhost:3000/admin/users
- Completa el formulario:
  - Name: "Juan"
  - Email: "juan@example.com"
  - Password: "123456"
- Click "Create User"

### 2. Registrar actividad (Usuario)
- Ve a http://localhost:3000/user
- Completa el formulario diario
- Sube una captura de pantalla (cualquier imagen)
- Click "Submit Activity Report"
- **Verifica**: Deberías ver un mensaje de éxito con el link de Google Drive

### 3. Ver Dashboard (Admin)
- Ve a http://localhost:3000/admin
- Deberías ver tu actividad registrada en las tablas
- Prueba los filtros por fecha

## 📁 Estructura Creada

He creado la siguiente estructura para ti:

```
control-difusion/
├── app/                    # Páginas y rutas
├── components/             # Componentes React
├── lib/                    # Utilidades y Server Actions
├── prisma/                 # Esquema de BD
├── package.json            # Dependencias
├── .env.local             # Variables (llenar tú)
├── .env.example           # Plantilla
└── README.md              # Documentación completa
```

## 🔑 Variables de Entorno Necesarias

**Mínimas para funcionamiento local**:
```env
# Base de Datos
DATABASE_URL="postgresql://..."

# NextAuth (puedes dejar default)
NEXTAUTH_SECRET="tu-secreto-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Google Drive
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL="..."
GOOGLE_DRIVE_PRIVATE_KEY="..."
GOOGLE_DRIVE_PROJECT_ID="..."
GOOGLE_DRIVE_FOLDER_ID="..."
```

## 📊 Cálculos Implementados

### Alcance Estimado (WhatsApp)
```
Alcance = Groups Reached × 150 (promedio de personas por grupo)
```

### Impactos Totales (WhatsApp)
```
Impactos = Alcance × Messages Per Group
```

## 🚀 Desplegar en Railway

```bash
# 1. Push a GitHub
git add .
git commit -m "Initial commit"
git push

# 2. Ve a railway.app
# 3. Conecta tu repositorio
# 4. Railway crearará PostgreSQL automáticamente
# 5. Agrega variables de entorno en el dashboard
# 6. Listo! Tu app estará en vivo
```

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm run dev

# Compilar para producción
npm run build
npm run start

# Base de datos
npm run prisma:generate      # Generar cliente
npm run prisma:migrate       # Crear/actualizar BD
npm run prisma:studio       # Ver BD con GUI

# Lint
npm run lint
```

## 📝 Próximos Pasos

1. ✅ Instalar y configurar (tú ya lo hiciste)
2. ✅ Configurar Google Drive API
3. ✅ Crear base de datos
4. ✅ Ejecutar localmente y probar
5. ⬜ (Opcional) Implementar NextAuth.js para login real
6. ⬜ (Opcional) Desplegar en Railway
7. ⬜ (Opcional) Agregar más métricas o campos

## ❓ Preguntas Frecuentes

**P: ¿Dónde cambio el promedio de personas por grupo?**
R: En `components/AdminDashboard.tsx`, línea con `AVERAGE_PEOPLE_PER_GROUP = 150`

**P: ¿Cómo agrego más campos al formulario?**
R: 
1. Agrega el campo en `prisma/schema.prisma`
2. Corre `npm run prisma:migrate`
3. Agrega el input en `components/UserForm.tsx`
4. Agrega el campo en `/app/api/upload/route.ts`

**P: ¿Cómo cambio los colores?**
R: Usa clases de Tailwind directamente en los componentes. Ej: cambiar `bg-blue-500` a `bg-purple-500`

**P: ¿Es seguro desplegar en Railway?**
R: Sí, pero:
- Usa variables de entorno seguras
- No commits `.env.local`
- Cambia `NEXTAUTH_SECRET` por un valor aleatorio

## 🆘 Troubleshooting

### "npm: command not found"
→ Instala Node.js desde nodejs.org

### "Database connection failed"
→ Verifica que PostgreSQL esté corriendo y la `DATABASE_URL` sea correcta

### "Files not uploading to Drive"
→ Revisa `GOOGLE_DRIVE_SETUP.md` y asegúrate de:
- Haber creado la Service Account
- Compartido la carpeta principal con el email de la Service Account
- Copiado correctamente el `PRIVATE_KEY`

### "Component errors"
→ Revisa la consola del navegador (F12) y la consola de la terminal

## 📞 Soporte

Si encuentras problemas:
1. Revisa `README.md` para documentación completa
2. Revisa `GOOGLE_DRIVE_SETUP.md` para configuración de Drive
3. Revisa `STRUCTURE.md` para entender el proyecto
4. Abre un issue en tu repositorio con el error exacto

## ✨ Lo Que Tienes

- ✅ **Frontend profesional** con Tailwind CSS puro
- ✅ **Backend seguro** con Server Actions y validación
- ✅ **Google Drive integrado** para almacenar evidencias
- ✅ **Base de datos relacional** con Prisma
- ✅ **Dashboard completo** con filtros y cálculos
- ✅ **Código modular** y fácil de mantener
- ✅ **Documentación detallada** en varios archivos

## 🎉 ¡Listo!

Ya puedes empezar a usar el dashboard. ¡Que disfrutes! 🚀
