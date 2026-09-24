# ⚡ Setup Railway en 3 Pasos (2 minutos)

## ✅ Lo Que Está Listo

Tu código ya está en GitHub:
- 🔗 https://github.com/hgpublicreativa-ux/difusion-dashboard
- ✅ 4 commits
- ✅ Rama main

## 🚀 PASO 1: Conectar a Railway (30 segundos)

1. Abre https://railway.app/dashboard
2. Haz click en **"+ New Project"** (botón verde)
3. Selecciona **"Deploy from GitHub repo"**

## PASO 2: Seleccionar tu Repositorio (30 segundos)

1. Busca `difusion-dashboard`
2. Selecciona `hgpublicreativa-ux/difusion-dashboard`
3. Haz click en **"Deploy"**

**Railway empezará a buildear automáticamente ⏳**

## PASO 3: Agregar PostgreSQL (1 minuto)

Mientras Railway buildea:

1. En tu proyecto, haz click en **"New"** (+ verde)
2. Selecciona **"Database"** → **"PostgreSQL"**
3. Railway crea la BD automáticamente

## PASO 4: Configurar Variables (30 segundos)

1. En tu servicio Node, ve a **"Variables"**
2. Copia desde PostgreSQL la variable `DATABASE_URL`
3. Agrega estas variables:

```
DATABASE_URL=postgresql://postgres:...@... (copia desde DB)
NEXTAUTH_SECRET=generar-abajo
NEXTAUTH_URL=https://[TU-APP].railway.app
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_DRIVE_PRIVATE_KEY=...
GOOGLE_DRIVE_PROJECT_ID=...
GOOGLE_DRIVE_FOLDER_ID=...
```

## Generar NEXTAUTH_SECRET

```bash
openssl rand -hex 32
```

Copia el resultado en Railway.

## PASO 5: Ejecutar Migraciones (1 minuto)

Railway empezará a desplegar. Una vez que veas "Build Successful":

```bash
# En tu terminal local:
DATABASE_URL="postgresql://postgres:...@...:[puerto]/railway" npm run prisma:migrate
```

Copia la DATABASE_URL desde Railway (Variables del servicio).

## ✨ Listo

Tu app está en vivo en:
```
https://[TU-PROYECTO].railway.app
```

## 📋 Checklist

- [ ] Proyecto creado en Railway
- [ ] PostgreSQL agregada
- [ ] Variables de entorno configuradas
- [ ] Migraciones ejecutadas
- [ ] App en vivo

---

**¿Necesitas ayuda?** Los logs en Railway te mostrarán cualquier error.

**Total tiempo**: ~5 minutos
