# 🚀 Guía de Despliegue - Firebase Hosting

Esta guía te ayudará a desplegar el frontend de Insuapliques en Firebase Hosting.

## 📋 Requisitos Previos

- [x] Node.js 16+ instalado
- [x] Cuenta de Firebase (proyecto: `chat-bot-7ffe3`)
- [x] Firebase CLI instalado globalmente
- [x] Acceso al proyecto Firebase

---

## 🔧 Instalación de Firebase CLI

Si no tienes Firebase CLI instalado:

```bash
npm install -g firebase-tools
```

Verificar instalación:
```bash
firebase --version
```

---

## 🔐 Autenticación en Firebase

```bash
firebase login
```

Esto abrirá tu navegador para autenticarte con tu cuenta de Google.

---

## ⚙️ Configuración Inicial (Solo Primera Vez)

### 1. Verificar Configuración del Proyecto

El proyecto ya está configurado en `.firebaserc`:
```json
{
  "projects": {
    "default": "chat-bot-7ffe3"
  }
}
```

### 2. Verificar que estás en el proyecto correcto

```bash
cd Frontend
firebase projects:list
firebase use chat-bot-7ffe3
```

---

## 🌍 Configurar Variables de Entorno para Producción

### Archivo `.env.production`

Ya está creado en `/Frontend/.env.production`. **IMPORTANTE:** Edita este archivo con tus valores de producción:

```env
# Backend API URL - CAMBIA ESTO A TU BACKEND DE PRODUCCIÓN
REACT_APP_API_BASE_URL=https://tu-backend-produccion.com

# API Key de producción - CAMBIA ESTO
REACT_APP_API_KEY=tu-api-key-de-produccion

# Firebase (ya configurado)
REACT_APP_FIREBASE_API_KEY=AIzaSyDj8z6GlcXBr_K-narXAQhq3QOq2b0Yf5M
# ... (resto de variables Firebase)
```

### Opciones para el Backend en Producción:

#### Opción 1: Backend en Cloud Functions
```env
REACT_APP_API_BASE_URL=https://us-central1-chat-bot-7ffe3.cloudfunctions.net/api
```

#### Opción 2: Backend en Cloud Run
```env
REACT_APP_API_BASE_URL=https://backend-chatbot-xyz.run.app
```

#### Opción 3: Backend en servidor propio
```env
REACT_APP_API_BASE_URL=https://api.insuapliques.com
```

---

## 📦 Build de Producción

### 1. Instalar Dependencias

```bash
cd Frontend
npm install
```

### 2. Crear Build de Producción

```bash
npm run build
```

Esto creará una carpeta `build/` con tu aplicación optimizada.

**Nota:** React automáticamente usará `.env.production` cuando ejecutes `npm run build`.

### 3. Verificar el Build

```bash
ls -la build/
```

Deberías ver:
```
build/
├── index.html
├── static/
│   ├── css/
│   ├── js/
│   └── media/
├── manifest.json
└── robots.txt
```

---

## 🚀 Despliegue en Firebase Hosting

### Método 1: Despliegue Completo (Recomendado)

```bash
firebase deploy --only hosting
```

### Método 2: Despliegue con Mensaje

```bash
firebase deploy --only hosting -m "Integración completa frontend-backend"
```

### Método 3: Vista Previa Antes de Desplegar

```bash
# Crear canal de vista previa
firebase hosting:channel:deploy preview

# Esto te dará una URL temporal como:
# https://chat-bot-7ffe3--preview-abc123.web.app
```

---

## 📊 Verificación Post-Despliegue

### 1. Obtener URL del Sitio

```bash
firebase hosting:sites:list
```

Tu sitio estará en:
```
https://chat-bot-7ffe3.web.app
```
o
```
https://chat-bot-7ffe3.firebaseapp.com
```

### 2. Verificar Funcionalidad

Abre la URL y verifica:

- [x] ✅ El sitio carga correctamente
- [x] ✅ Login con Firebase Auth funciona
- [x] ✅ Puedes acceder a todas las rutas:
  - `/` - Historial de conversaciones
  - `/entrenamiento` - Configuración
  - `/Documentos` - Gestión de productos
  - `/chat` - Chat en vivo
  - `/agent-test` - Prueba del agente AI
- [x] ✅ El agente AI responde (si el backend está desplegado)
- [x] ✅ Firebase Firestore se conecta correctamente
- [x] ✅ Firebase Storage funciona para subir archivos

### 3. Verificar en la Consola del Navegador

Abre DevTools (F12) y verifica que no haya errores en:
- Console
- Network (las peticiones al backend funcionan)

---

## 🔄 Actualizaciones Futuras

Para actualizar el sitio después de hacer cambios:

```bash
# 1. Hacer tus cambios en el código

# 2. Crear nuevo build
npm run build

# 3. Desplegar
firebase deploy --only hosting

# 4. Verificar
# Abre tu sitio en navegador (Ctrl+Shift+R para forzar recarga)
```

---

## 🌐 Configurar Dominio Personalizado (Opcional)

### 1. Agregar Dominio Personalizado

```bash
firebase hosting:sites:create insuapliques-admin
```

### 2. Conectar Dominio en Firebase Console

1. Ve a: https://console.firebase.google.com/project/chat-bot-7ffe3/hosting
2. Click en "Agregar dominio personalizado"
3. Ingresa tu dominio: `admin.insuapliques.com`
4. Sigue las instrucciones para configurar DNS

### 3. Registros DNS Requeridos

Firebase te pedirá agregar estos registros DNS:

```
Tipo: A
Nombre: admin
Valor: 151.101.1.195 (o el que Firebase te indique)

Tipo: A
Nombre: admin
Valor: 151.101.65.195 (o el que Firebase te indique)
```

---

## 🔒 Seguridad en Producción

### 1. Configurar CORS en el Backend

Asegúrate de que tu backend permita requests desde tu dominio de producción:

**En el backend `.env`:**
```env
ALLOWED_ORIGINS=https://chat-bot-7ffe3.web.app,https://chat-bot-7ffe3.firebaseapp.com
```

### 2. Reglas de Seguridad de Firestore

Verifica que las reglas de Firestore estén configuradas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo usuarios autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Actualizar reglas:
```bash
firebase deploy --only firestore:rules
```

### 3. Reglas de Seguridad de Storage

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.resource.size < 10 * 1024 * 1024; // Max 10MB
    }
  }
}
```

Actualizar reglas:
```bash
firebase deploy --only storage:rules
```

---

## 📈 Monitoreo y Analytics

### 1. Ver Estadísticas de Hosting

```bash
firebase hosting:channel:list
```

### 2. Firebase Console

Ve a: https://console.firebase.google.com/project/chat-bot-7ffe3/hosting

Aquí puedes ver:
- Tráfico
- Ancho de banda usado
- Historial de despliegues
- Rollback a versiones anteriores

---

## ⏮️ Rollback (Volver a Versión Anterior)

Si algo sale mal, puedes volver a una versión anterior:

### Ver Historial de Despliegues

```bash
firebase hosting:clone chat-bot-7ffe3:live chat-bot-7ffe3:previous
```

### Desde Firebase Console

1. Ve a: https://console.firebase.google.com/project/chat-bot-7ffe3/hosting
2. Click en "Historial de versiones"
3. Selecciona la versión anterior
4. Click en "Restaurar"

---

## 🐛 Solución de Problemas

### Error: "Failed to build"

**Solución:**
```bash
# Limpiar cache
rm -rf node_modules build
npm install
npm run build
```

### Error: "Firebase login required"

**Solución:**
```bash
firebase logout
firebase login
```

### Error: "Permission denied"

**Solución:**
- Verifica que tienes permisos en el proyecto Firebase
- Pide al administrador que te agregue como Editor o Owner

### Error: "Build succeeds but site shows blank page"

**Causas comunes:**
1. Error de routing (usar `HashRouter` en lugar de `BrowserRouter`)
2. Variables de entorno incorrectas
3. Errores en console del navegador

**Solución:**
1. Abre DevTools (F12) y revisa Console
2. Verifica que `.env.production` tenga los valores correctos
3. Asegúrate de que `firebase.json` tenga la configuración de rewrites

### Backend no responde en producción

**Solución:**
1. Verifica que `REACT_APP_API_BASE_URL` apunte a tu backend de producción
2. Verifica CORS en el backend
3. Verifica que el backend esté desplegado y funcionando
4. Prueba el backend directamente: `curl https://tu-backend.com/api/agent/health`

---

## 📝 Checklist de Despliegue

Antes de desplegar a producción:

- [ ] `npm install` completado sin errores
- [ ] `.env.production` configurado con valores correctos
- [ ] `npm run build` funciona sin errores
- [ ] Backend de producción está desplegado y funcionando
- [ ] CORS configurado en el backend para el dominio de producción
- [ ] Reglas de Firestore actualizadas
- [ ] Reglas de Storage actualizadas
- [ ] Firebase CLI instalado y autenticado
- [ ] Probado en local con `npm start`
- [ ] Verificado que todas las rutas funcionan

Durante el despliegue:

- [ ] `firebase deploy --only hosting` ejecutado exitosamente
- [ ] URL del sitio accesible
- [ ] Login funciona
- [ ] Todas las páginas cargan
- [ ] El agente AI responde
- [ ] Firebase Storage funciona
- [ ] No hay errores en Console del navegador

Post-despliegue:

- [ ] Prueba desde diferentes navegadores
- [ ] Prueba desde móvil
- [ ] Verifica que los archivos se suban correctamente
- [ ] Verifica que el chat en vivo funcione
- [ ] Documenta la URL de producción

---

## 🚀 Script de Despliegue Automático

Crea un archivo `deploy.sh` en `/Frontend/`:

```bash
#!/bin/bash

echo "🚀 Iniciando despliegue a Firebase Hosting..."

# 1. Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# 2. Ejecutar tests (opcional)
# echo "🧪 Ejecutando tests..."
# npm test

# 3. Crear build de producción
echo "🔨 Creando build de producción..."
npm run build

# 4. Verificar que build existe
if [ ! -d "build" ]; then
  echo "❌ Error: Carpeta build no fue creada"
  exit 1
fi

# 5. Desplegar a Firebase
echo "☁️ Desplegando a Firebase Hosting..."
firebase deploy --only hosting

# 6. Mostrar URL
echo ""
echo "✅ ¡Despliegue completado!"
echo "🌐 URL: https://chat-bot-7ffe3.web.app"
echo ""
```

Dar permisos de ejecución:
```bash
chmod +x deploy.sh
```

Usar:
```bash
./deploy.sh
```

---

## 📞 Recursos Adicionales

- **Firebase Console:** https://console.firebase.google.com/project/chat-bot-7ffe3
- **Firebase Hosting Docs:** https://firebase.google.com/docs/hosting
- **Firebase CLI Reference:** https://firebase.google.com/docs/cli

---

## ✅ Comandos Rápidos de Referencia

```bash
# Login
firebase login

# Seleccionar proyecto
firebase use chat-bot-7ffe3

# Build
npm run build

# Desplegar
firebase deploy --only hosting

# Ver sitios
firebase hosting:sites:list

# Preview
firebase hosting:channel:deploy preview

# Ver logs
firebase hosting:logs

# Logout
firebase logout
```

---

**Última actualización:** Octubre 2025
**Proyecto:** chat-bot-7ffe3
**Hosting URL:** https://chat-bot-7ffe3.web.app
