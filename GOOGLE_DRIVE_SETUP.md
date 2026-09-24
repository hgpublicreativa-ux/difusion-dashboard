# Configuración de Google Drive API

Esta guía te ayudará a configurar Google Drive API para que el dashboard pueda subir automáticamente archivos a Google Drive.

## Paso 1: Crear un Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Haz click en el selector de proyectos en la parte superior
3. Haz click en "Nuevo Proyecto"
4. Dale un nombre a tu proyecto (ej: "Difusión Dashboard")
5. Haz click en "Crear"

## Paso 2: Habilitar Google Drive API

1. En la barra de búsqueda de Google Cloud Console, escribe "Google Drive API"
2. Selecciona "Google Drive API" en los resultados
3. Haz click en "Habilitar"

## Paso 3: Crear una Service Account

1. En el menú de la izquierda, ve a "Credenciales"
2. Haz click en "Crear credenciales" en la parte superior
3. Selecciona "Service Account"
4. Completa los detalles:
   - Service Account name: "difusion-dashboard" (o el nombre que prefieras)
   - Service Account ID: Se llenará automáticamente
   - Descripción: "Service account para subir archivos al dashboard"
5. Haz click en "Crear y continuar"
6. En la siguiente pantalla, haz click en "Continuar" (sin asignar roles)
7. Haz click en "Hecho"

## Paso 4: Crear una Clave JSON

1. Ve de nuevo a "Credenciales"
2. En la tabla de "Service Accounts", haz click en el email de la service account que acabas de crear
3. Ve a la pestaña "Claves"
4. Haz click en "Agregar clave" → "Crear clave nueva"
5. Selecciona "JSON" como formato
6. Haz click en "Crear"
7. **Importante**: Se descargará un archivo JSON. **Guárdalo en un lugar seguro** - es tu credencial privada

## Paso 5: Llenar las Variables de Entorno

Abre el archivo JSON que descargaste. Deberá tener esta estructura:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "difusion-dashboard@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

En tu archivo `.env.local`, completa lo siguiente:

```env
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL="client_email del JSON"
GOOGLE_DRIVE_PRIVATE_KEY="private_key del JSON (incluye los saltos de línea como \n)"
GOOGLE_DRIVE_PROJECT_ID="project_id del JSON"
```

## Paso 6: Crear la Carpeta Principal en Google Drive

1. Ve a [Google Drive](https://drive.google.com)
2. Haz click en "Nuevo" → "Carpeta"
3. Dale un nombre (ej: "Evidencias Difusión")
4. Haz click en "Crear"
5. Abre la carpeta y copia el ID de la URL

La URL se verá así: `https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j`

El ID es la última parte: `1a2b3c4d5e6f7g8h9i0j`

En tu `.env.local`:
```env
GOOGLE_DRIVE_FOLDER_ID="1a2b3c4d5e6f7g8h9i0j"
```

## Paso 7: Compartir la Carpeta con la Service Account

1. Abre la carpeta principal en Google Drive
2. Haz click en "Compartir" (botón azul)
3. Copia el email de la service account (`client_email` del JSON)
4. Pégalo en el campo de "Agregar personas o grupos"
5. Selecciona "Editor" como nivel de acceso
6. Haz click en "Compartir"

## ¡Listo!

Ahora tu dashboard puede:
- Crear carpetas automáticamente para cada usuario
- Crear subcarpetas por fecha
- Subir archivos directamente a Google Drive
- Guardar los links en la base de datos

## Troubleshooting

### Error: "Failed to authenticate with Google Drive"
- Verifica que `GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL` sea exacto
- Comprueba que `GOOGLE_DRIVE_PRIVATE_KEY` esté bien formateado (con `\n` para saltos de línea)

### Error: "Folder not found"
- Asegúrate de que `GOOGLE_DRIVE_FOLDER_ID` es correcto
- Verifica que compartiste la carpeta con el email de la service account

### Error: "Permission denied"
- Comprueba que la service account tiene acceso "Editor" en la carpeta
- Revisa los permisos en Google Cloud Console

## Renovación de Credenciales

Las credenciales JSON pueden expirar. Para renovar:
1. Ve a la service account en Google Cloud Console
2. Ve a "Claves"
3. Haz click en el menú de tres puntos de la clave actual
4. Selecciona "Eliminar"
5. Crea una nueva clave siguiendo el Paso 4 nuevamente

## Seguridad

⚠️ **IMPORTANTE**:
- Nunca compartas tu `GOOGLE_DRIVE_PRIVATE_KEY` públicamente
- No commits `.env.local` a Git (está en `.gitignore`)
- En producción (Railway), usa las variables de entorno seguras del dashboard
- La `PRIVATE_KEY` contiene espacios especiales; mantenlos intactos
