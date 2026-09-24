# 🔧 Configuración Final de Railway - Paso a Paso

## ⚠️ Estado Actual

Tu app está deployada pero necesita **variables de entorno** para funcionar. Sin ellas, Railway no puede iniciar la aplicación.

## ✅ Configurar Variables (5 minutos)

### Paso 1: Ir al Dashboard de Railway

1. Abre **https://railway.app/dashboard**
2. Selecciona tu proyecto **"difusion-dashboard"**
3. Haz click en el servicio **"difusion-dashboard-app"** (Node.js)
4. Ve a la pestaña **"Variables"**

### Paso 2: Agregar DATABASE_URL

1. Haz click en **"+ Add Variable"**
2. Key: `DATABASE_URL`
3. Value: (copia esto desde tu PostgreSQL)
   ```
   postgresql://postgres:PASSWORD@HOST:PORT/railway
   ```

**¿Dónde encuentras estos valores?**
- Ve a tu servicio **PostgreSQL** en el mismo proyecto
- Ve a su pestaña **"Variables"**
- Copia la variable `DATABASE_URL` completa
- Pégala en tu servicio Node

### Paso 3: Agregar NextAuth Variables

Haz click en **"+ Add Variable"** para cada una:

```
NEXTAUTH_SECRET = (genera con: openssl rand -hex 32)
NEXTAUTH_URL = https://difusion-dashboard-production.up.railway.app
```

**Generar NEXTAUTH_SECRET:**

En tu terminal:
```bash
openssl rand -hex 32
```

Copia el resultado y pégalo como valor.

### Paso 4: Agregar Google Drive Variables

Haz click en **"+ Add Variable"** para cada una:

```
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL = your-service-account@project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
GOOGLE_DRIVE_PROJECT_ID = your-google-cloud-project-id
GOOGLE_DRIVE_FOLDER_ID = your-drive-folder-id
```

**¿Dónde encuentras estos valores?**
- Ve a tu Google Cloud Console
- Abre la Service Account (la que descargaste como JSON)
- Copia los valores desde ahí
- Para la PRIVATE_KEY, asegúrate de incluir los `\n` para los saltos de línea

### Paso 5: Guardar y Redeployar

1. Después de agregar todas las variables, Railway debería mostrar un botón **"Deploy"** 🚀
2. Haz click en **"Deploy"**
3. Espera 1-2 minutos a que el build termine

### Paso 6: Ejecutar Migraciones

Después de que Railway diga "✅ Success", ejecuta:

```bash
DATABASE_URL="postgresql://postgres:PASSWORD@HOST:PORT/railway" npm run prisma:migrate
```

Reemplaza los valores de la DATABASE_URL con los reales de Railway.

---

## 📋 Resumen de Variables Necesarias

```
DATABASE_URL                          ✓ PostgreSQL
NEXTAUTH_SECRET                       ✓ Generar
NEXTAUTH_URL                          ✓ Tu URL de Railway
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL    ✓ Google Cloud
GOOGLE_DRIVE_PRIVATE_KEY              ✓ Google Cloud
GOOGLE_DRIVE_PROJECT_ID               ✓ Google Cloud
GOOGLE_DRIVE_FOLDER_ID                ✓ Tu carpeta en Drive
```

---

## 🚀 Verificación Final

Después de configurar todo y hacer deploy:

1. Abre: https://difusion-dashboard-production.up.railway.app
2. Deberías ver la **landing page** con gradientes azul-púrpura
3. Ve a `/user` → Deberías ver el **formulario diario**
4. Ve a `/admin` → Deberías ver el **dashboard**

---

## 🆘 Si Algo Falla

1. Ve a "Deployments" en Railway
2. Haz click en el deploy rojo (fallido)
3. Scrollea a los logs
4. Busca la línea con el error
5. Comparte el error conmigo

**Errores comunes:**

- **"Cannot find module '@prisma/client'"** → Falta `postinstall` script (ya está arreglado)
- **"ECONNREFUSED database"** → DATABASE_URL falta o es incorrecta
- **"NEXTAUTH_SECRET not found"** → Falta NEXTAUTH_SECRET

---

## ✅ Checklist

- [ ] Abrí https://railway.app/dashboard
- [ ] Seleccioné el proyecto "difusion-dashboard"
- [ ] Fui a la pestaña "Variables" del servicio Node
- [ ] Copié DATABASE_URL desde PostgreSQL
- [ ] Agregué NEXTAUTH_SECRET (generado)
- [ ] Agregué NEXTAUTH_URL
- [ ] Agregué variables de Google Drive
- [ ] Hice click en "Deploy"
- [ ] Esperé a que Terminal dijera "✅ Success"
- [ ] Ejecuté `npm run prisma:migrate`
- [ ] Abrí https://difusion-dashboard-production.up.railway.app
- [ ] ¡Vi la app funcionando! 🎉

---

## 📞 Siguientes Pasos

1. Configura las variables (arriba)
2. Espera el deploy
3. Ejecuta migraciones
4. ¡Tu app estará lista!

**Tiempo total: 10 minutos**
