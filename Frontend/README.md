# Insuapliques - Chatbot Admin Dashboard

Panel de administración para gestionar el chatbot de atención al cliente de Insuapliques. Este frontend se conecta con Firebase y el backend de WhatsApp para administrar conversaciones, entrenar el bot y gestionar productos/documentos.

## 🚀 Tecnologías

- **React 18** - Framework frontend
- **React Router v6** - Navegación
- **Tailwind CSS** - Estilos
- **Firebase** - Backend (Firestore, Storage, Authentication)
- **jsPDF + html2canvas** - Exportación de PDF
- **React Icons** - Iconos

## 📋 Requisitos Previos

- Node.js 16+ y npm
- Cuenta de Firebase configurada
- Backend del chatbot desplegado en Cloud Functions

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   cd Frontend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**

   Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

   Edita `.env` con tus credenciales de Firebase (si son diferentes):
   ```env
   REACT_APP_FIREBASE_API_KEY=tu_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=tu_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=tu_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
   REACT_APP_FIREBASE_APP_ID=tu_app_id
   REACT_APP_FIREBASE_MEASUREMENT_ID=tu_measurement_id
   REACT_APP_API_BASE_URL=https://us-central1-tu-proyecto.cloudfunctions.net/api/v1
   ```

4. **Iniciar servidor de desarrollo**
   ```bash
   npm start
   ```

   La aplicación se abrirá en [http://localhost:3000](http://localhost:3000)

## 🔧 Scripts Disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm run build` - Crea el build de producción
- `npm test` - Ejecuta los tests
- `npm run eject` - Expone la configuración de Create React App (irreversible)

## 📁 Estructura del Proyecto

```
Frontend/
├── public/              # Archivos públicos estáticos
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/      # Componentes reutilizables
│   ├── pages/          # Páginas principales
│   │   ├── ChatTiempoReal.jsx         # Chat en vivo con usuarios
│   │   ├── HistorialConversaciones.jsx # Historial de conversaciones
│   │   ├── EntrenamientoConfig.jsx     # Configuración del bot
│   │   ├── ProductosChatbotPanel.jsx   # Gestión de productos
│   │   └── Login.jsx                   # Autenticación
│   ├── App.jsx          # Componente principal
│   ├── firebaseConfig.jsx # Configuración de Firebase
│   ├── index.jsx        # Punto de entrada
│   └── index.css        # Estilos globales
├── .env.example         # Ejemplo de variables de entorno
├── .gitignore
├── package.json
├── tailwind.config.js   # Configuración de Tailwind
└── README.md
```

## 🎯 Funcionalidades

### 1. **Historial de Conversaciones** (`/`)
- Ver todas las conversaciones históricas de WhatsApp
- Buscar por número de teléfono
- Exportar conversaciones a PDF
- Eliminar conversaciones (incluye archivos multimedia)

### 2. **Entrenamiento del Bot** (`/entrenamiento`)
- Configurar prompts base de IA
- Definir palabras clave de cierre
- Subir documentos de entrenamiento (Excel)
- Editar mensajes de bienvenida y plantillas

### 3. **Gestión de Documentos** (`/Documentos`)
- Crear respuestas automáticas por palabra clave
- Subir imágenes, PDFs y videos
- CRUD completo de productos/documentos

### 4. **Chat en Vivo** (`/chat`)
- Interfaz de chat en tiempo real
- Ver solicitudes de atención humana
- Responder a usuarios vía WhatsApp
- Enviar archivos multimedia
- Contadores de mensajes no leídos
- Finalizar conversaciones

## 🔐 Autenticación

El dashboard requiere autenticación con Firebase Auth (email/password). Asegúrate de crear usuarios en Firebase Console:

1. Ve a Firebase Console > Authentication
2. Habilita Email/Password como método de inicio de sesión
3. Crea usuarios manualmente o permite registro

## 🔥 Configuración de Firebase

### Colecciones de Firestore Requeridas:

1. **`conversations`** - Conversaciones históricas
   - Subcollection: `media` (archivos multimedia)

2. **`liveChat`** - Mensajes en tiempo real

3. **`solicitudesHumanas`** - Solicitudes de atención humana

4. **`liveChatStates`** - Estados de chat en vivo

5. **`settings`** - Documentos de configuración:
   - `prompts` - Configuración de IA
   - `welcome_messages` - Mensajes predefinidos
   - `archivo_entrenamiento` - Archivo de entrenamiento actual

6. **`productos_chatbot`** - Productos y respuestas automáticas

7. **`productos`** - Catálogo de productos

### Reglas de Seguridad de Firestore (Recomendadas):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo usuarios autenticados pueden leer/escribir
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Reglas de Storage (Recomendadas):

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

## 🌐 Integración con Backend

El frontend se comunica con el backend de las siguientes formas:

### 1. **Cloud Functions API**
- **Endpoint**: `${API_BASE_URL}/messages`
- **Método**: POST
- **Body**:
  ```json
  {
    "number": "string (teléfono del usuario)",
    "message": "string (mensaje a enviar)",
    "urlMedia": "string | null (URL de archivo multimedia)"
  }
  ```
- **Función**: Envía mensajes del operador al usuario vía WhatsApp

### 2. **Firebase Realtime Listeners**
- Todas las colecciones usan `onSnapshot` para actualizaciones en tiempo real
- No se requieren peticiones HTTP adicionales para datos en tiempo real

## 🚀 Despliegue

### Opción 1: Firebase Hosting

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login en Firebase
firebase login

# Inicializar proyecto
firebase init hosting

# Build de producción
npm run build

# Desplegar
firebase deploy --only hosting
```

### Opción 2: Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Desplegar
vercel
```

### Opción 3: Netlify

```bash
# Build
npm run build

# Subir carpeta build/ a Netlify
```

## 🐛 Solución de Problemas

### Error: "Firebase: Error (auth/configuration-not-found)"
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de que el proyecto Firebase existe y está activo

### Error: "Failed to fetch" en chat en vivo
- Verifica que el backend esté desplegado y funcionando
- Confirma que la URL de `REACT_APP_API_BASE_URL` sea correcta
- Revisa las reglas CORS en Cloud Functions

### Los estilos no se aplican
- Ejecuta `npm install` para asegurar que Tailwind esté instalado
- Verifica que `tailwind.config.js` y `postcss.config.js` existan
- Reinicia el servidor de desarrollo

### Error: "Module not found: Can't resolve 'react-router-dom'"
- Ejecuta `npm install` para instalar todas las dependencias

## 📝 Notas Importantes

1. **Seguridad**: Las claves de Firebase en el frontend son públicas por diseño. Asegúrate de configurar correctamente las reglas de seguridad de Firestore y Storage.

2. **Privacidad**: Los números de teléfono se almacenan como IDs de documentos. Considera implementar hash o encriptación para mayor privacidad.

3. **Límites de Firebase**:
   - Firestore: 50,000 lecturas/día (plan gratuito)
   - Storage: 1GB almacenamiento, 10GB transferencia/mes
   - Cloud Functions: 125K invocaciones/mes

4. **Optimización**: Considera implementar paginación en el historial para reducir el número de lecturas de Firestore.

## 📞 Soporte

Para problemas o preguntas sobre el backend del chatbot, consulta el repositorio: https://github.com/Insuapliques/Chatbot

## 📄 Licencia

Este proyecto es privado y propiedad de Insuapliques.
