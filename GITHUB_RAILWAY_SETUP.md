# 📝 Pasos Rápidos: GitHub + Railway

## ✅ Lo que ya está hecho

✓ Código completamente funcional y listo para producción  
✓ Git inicializado con 2 commits  
✓ Estilos mejorados con gradientes y diseño profesional  
✓ Documentación completa  

## 🔗 PASO 1: Subir a GitHub (5 minutos)

### 1.1 Crear repositorio en GitHub

1. Ve a **https://github.com/new**
2. Repository name: `difusion-dashboard`
3. Haz click en **"Create repository"**
4. Copia el URL (será algo como `https://github.com/TU_USUARIO/difusion-dashboard.git`)

### 1.2 Conectar y Subir

Copia y pega esto en tu terminal (reemplaza `TU_USUARIO`):

```bash
cd "/Users/henrygomez/Desktop/paginas webs/control difusion"

git remote add origin https://github.com/TU_USUARIO/difusion-dashboard.git
git branch -M main
git push -u origin main
```

**Listo!** Tu código está en GitHub.

---

## 🚀 PASO 2: Desplegar en Railway (10 minutos)

### 2.1 Crear Proyecto en Railway

1. Ve a **https://railway.app**
2. Haz click en **"Deploy from GitHub repo"**
3. Selecciona `difusion-dashboard`
4. Haz click en **"Deploy"**

Railway empezará a buildear automáticamente. ⏳

### 2.2 Agregar PostgreSQL

Mientras Railway buildea:

1. En tu proyecto, haz click en **"New"** (+ verde)
2. Selecciona **"Database"** → **"PostgreSQL"**
3. Railway crea automáticamente la BD y te mostrará las credenciales

### 2.3 Configurar Variables de Entorno

1. Ve a tu servidor Node en Railway
2. Abre la pestaña **"Variables"**
3. Agrega estas variables:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
NEXTAUTH_SECRET=generar-abajo
NEXTAUTH_URL=https://[TU_APP].railway.app
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_DRIVE_PRIVATE_KEY=...
GOOGLE_DRIVE_PROJECT_ID=...
GOOGLE_DRIVE_FOLDER_ID=...
```

#### Cómo obtener cada valor:

**DATABASE_URL**: De tu PostgreSQL en Railway (ya está en "Variables" de la BD)

**NEXTAUTH_SECRET**: Genera uno ejecutando esto en tu terminal:
```bash
openssl rand -hex 32
```

**NEXTAUTH_URL**: Será la URL que Railway te da (ej: `https://difusion-dashboard-prod.railway.app`)

**Google Drive**: Usa los valores que configuraste en `.env.local`

### 2.4 Ejecutar Migraciones

Opción A - Rápido (recomendado):
```bash
# En tu terminal local con la DATABASE_URL de Railway:
DATABASE_URL="postgresql://..." npm run prisma:migrate
```

Opción B - Desde Railway:
1. Ve a "Logs" en tu proyecto
2. Haz scroll hasta el final
3. Copia el comando de conexión SSH
4. Conéctate y ejecuta:
```bash
npm run prisma:migrate
```

### 2.5 Verificar Despliegue

1. Railway te mostrará la URL de tu app
2. Abre esa URL (ej: `https://difusion-dashboard-prod.railway.app`)
3. Deberías ver la landing page
4. Ve a `/admin/users` y crea un usuario de prueba
5. Ve a `/user` y prueba el formulario

---

## 📋 Checklist de Verificación

En Railway después del deploy:

- [ ] App está en vivo (abre la URL)
- [ ] Landing page carga correctamente
- [ ] Puedes crear usuarios en `/admin/users`
- [ ] Puedes ver el dashboard en `/admin`
- [ ] El formulario de usuario funciona en `/user`
- [ ] Los archivos se suben a Google Drive
- [ ] No hay errores en los logs

---

## 🔄 Flujo Futuro de Actualizaciones

Cada vez que hagas cambios:

```bash
# En tu computadora
git add .
git commit -m "Descripción del cambio"
git push origin main

# Railway se actualiza automáticamente (verifica en Deployments)
```

---

## 🆘 Problemas Comunes

### "Git remote already exists"
```bash
git remote remove origin
git remote add origin https://github.com/TU_USUARIO/difusion-dashboard.git
git push -u origin main
```

### "Railway build failed"
- Verifica los logs en "Deployments"
- Asegúrate de que `DATABASE_URL` esté configurada
- Intenta redeployar

### "Base de datos no conecta"
```bash
# Verifica localmente con este comando:
DATABASE_URL="postgresql://..." npm run prisma:studio

# Luego ejecuta las migraciones
DATABASE_URL="postgresql://..." npm run prisma:migrate
```

### "Google Drive files no suben"
- Verifica todas las variables de Google Drive
- Asegúrate que compartiste la carpeta con el service account
- Revisa los logs en Railway para ver el error específico

---

## 📞 URLs Útiles

- **GitHub**: https://github.com/TU_USUARIO/difusion-dashboard
- **Railway**: https://railway.app/project/[PROJECT_ID]
- **Tu App**: https://[SUBDOMINIO].railway.app

---

## ✨ Próximas Mejoras (Opcional)

Después de que funcione:

1. Agregar dominio personalizado en Railway
2. Configurar NextAuth.js con login/logout
3. Agregar gráficos con Recharts
4. Agregar exportación a Excel
5. Mejorar validaciones

---

## 🎉 ¡Listo!

Tu dashboard está en producción. Comparte la URL con tu equipo.

**Documentación adicional**: Ver [DEPLOY.md](./DEPLOY.md) para detalles completos.
