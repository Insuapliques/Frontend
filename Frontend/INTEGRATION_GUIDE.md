# 🔗 Guía de Integración Frontend-Backend

Este documento describe cómo el frontend de Insuapliques se integra con el backend del chatbot.

## 📋 Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Endpoints del Backend](#endpoints-del-backend)
3. [Archivos Nuevos Agregados](#archivos-nuevos-agregados)
4. [Configuración Requerida](#configuración-requerida)
5. [Flujo de Datos](#flujo-de-datos)
6. [Guía de Uso](#guía-de-uso)
7. [Solución de Problemas](#solución-de-problemas)

---

## 🏗️ Arquitectura General

### Backend (Puerto 3008)
- **Framework**: Express.js + BuilderBot
- **IA**: OpenAI GPT-4o
- **Base de Datos**: Firebase Firestore
- **WhatsApp**: Meta Business API
- **Autenticación**: API Key (`X-Api-Key` header)

### Frontend (Puerto 3000)
- **Framework**: React 18
- **Estado**: Firebase Realtime Listeners
- **Comunicación**: REST API + Firebase SDK

### Flujo de Comunicación

```
Usuario WhatsApp
      ↓
Meta Business API
      ↓
Backend (BuilderBot + OpenAI)
      ↓
Firebase Firestore (liveChat, conversations, etc.)
      ↓
Frontend React (onSnapshot listeners)
      ↓
Operador Dashboard
```

---

## 🔌 Endpoints del Backend

### Base URL
- **Desarrollo**: `http://localhost:3008`
- **Producción**: Tu URL desplegada

### Autenticación
Todos los endpoints requieren el header:
```
X-Api-Key: your-api-key-here
```

### Endpoints Disponibles

#### 1. **Agent API** (`/api/agent/*`)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/agent/chat` | POST | Chat simple con el agente AI |
| `/api/agent/chat-advanced` | POST | Chat avanzado con historial |
| `/api/agent/prompt` | GET | Obtener prompt actual |
| `/api/agent/prompt` | PUT | Actualizar prompt |
| `/api/agent/tools` | GET | Lista de herramientas disponibles |
| `/api/agent/history/:phone` | GET | Historial de conversación |
| `/api/agent/state/:phone` | GET | Estado de conversación |
| `/api/agent/state/:phone` | DELETE | Reiniciar estado |
| `/api/agent/health` | GET | Estado de salud del agente |

#### 2. **Panel API** (`/panel/*`)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/panel/send` | POST | Enviar mensaje desde operador |

#### 3. **Training API** (`/api/training/*`)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/training` | GET | Obtener datos de entrenamiento |
| `/api/training` | PUT | Actualizar entrenamiento |

#### 4. **Conversations API** (`/api/conversations/*`)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/conversations` | GET | Listar conversaciones |
| `/api/conversations/:id` | GET | Obtener conversación específica |

---

## 📁 Archivos Nuevos Agregados

### 1. **`src/services/apiService.js`** ✨ NUEVO
Capa de servicio que centraliza todas las llamadas al backend.

**Funciones principales:**
- `sendAgentMessage(phone, message)` - Enviar mensaje simple al agente
- `sendAgentMessageAdvanced(phone, message, history)` - Enviar mensaje con historial
- `getAgentPrompt()` - Obtener configuración del agente
- `updateAgentPrompt(prompt)` - Actualizar prompt
- `getConversationHistory(phone, limit)` - Obtener historial
- `checkAgentHealth()` - Verificar estado del agente

**Ejemplo de uso:**
```javascript
import { sendAgentMessage, checkAgentHealth } from '../services/apiService';

// Enviar mensaje
const response = await sendAgentMessage('51987654321', 'Hola');
console.log(response.data.response);

// Verificar salud
const health = await checkAgentHealth();
console.log(health.status); // 'healthy'
```

### 2. **`src/pages/AgentTest.jsx`** ✨ NUEVO
Componente de prueba del agente AI con interfaz de chat completa.

**Características:**
- Chat en tiempo real con el agente
- Visualización de herramientas utilizadas
- Estado de salud del agente
- Historial de conversación
- Medición de latencia

**Ruta:** `/agent-test`

### 3. **`.env.example`** 🔄 ACTUALIZADO
Agregadas nuevas variables de entorno:
```env
REACT_APP_API_BASE_URL=http://localhost:3008
REACT_APP_API_KEY=your-api-key-here
REACT_APP_CLOUD_FUNCTIONS_URL=https://us-central1-chat-bot-7ffe3.cloudfunctions.net/api/v1
```

### 4. **`src/firebaseConfig.jsx`** 🔄 ACTUALIZADO
Ahora exporta `API_BASE_URL` y usa variables de entorno.

### 5. **`src/pages/ChatTiempoReal.jsx`** 🔄 ACTUALIZADO
Mejorado el manejo de errores en las llamadas a la API.

### 6. **`src/App.jsx`** 🔄 ACTUALIZADO
Agregada ruta `/agent-test` para probar el agente AI.

---

## ⚙️ Configuración Requerida

### Paso 1: Variables de Entorno

Crea un archivo `.env` en la raíz de `Frontend/`:

```env
# Firebase (ya configurado)
REACT_APP_FIREBASE_API_KEY=AIzaSyDj8z6GlcXBr_K-narXAQhq3QOq2b0Yf5M
REACT_APP_FIREBASE_AUTH_DOMAIN=chat-bot-7ffe3.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=chat-bot-7ffe3
REACT_APP_FIREBASE_STORAGE_BUCKET=chat-bot-7ffe3.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=794774375240
REACT_APP_FIREBASE_APP_ID=1:794774375240:web:00e5f876ac9fe128f8017d
REACT_APP_FIREBASE_MEASUREMENT_ID=G-47142H1TW3

# Backend API (NUEVO - IMPORTANTE)
REACT_APP_API_BASE_URL=http://localhost:3008
REACT_APP_API_KEY=tu-api-key-del-backend

# Cloud Functions (opcional, legacy)
REACT_APP_CLOUD_FUNCTIONS_URL=https://us-central1-chat-bot-7ffe3.cloudfunctions.net/api/v1
```

### Paso 2: Backend en Ejecución

Asegúrate de que el backend esté corriendo:

```bash
# En el directorio del backend (Chatbot/)
cd ../Chatbot
npm install
npm run dev  # O npm start
```

El backend debería estar en: `http://localhost:3008`

### Paso 3: API Key del Backend

**¿Dónde conseguir el API Key?**

El API key se configura en el backend. Revisa el archivo `.env` del backend o pregunta al administrador del sistema.

Si no hay API Key configurado, puedes omitir temporalmente la autenticación (solo para desarrollo) comentando el middleware en el backend:

```typescript
// En backend/src/app.ts
// app.use('/api/agent', auditAccess, authenticateRequest, agentRoutes);
app.use('/api/agent', agentRoutes); // Sin autenticación (solo desarrollo)
```

---

## 🔄 Flujo de Datos

### Escenario 1: Usuario envía mensaje por WhatsApp

```
1. Usuario WhatsApp → Meta Business API
2. Meta Business API → Backend (Webhook)
3. Backend → OpenAI Agent (procesa mensaje)
4. OpenAI Agent → Ejecuta herramientas (buscar productos, calcular precios, etc.)
5. Backend → Firestore (guarda mensaje en liveChat)
6. Firestore → Frontend (onSnapshot actualiza UI)
7. Backend → Meta Business API (envía respuesta)
8. Meta Business API → Usuario WhatsApp
```

### Escenario 2: Operador responde desde el dashboard

```
1. Operador → Frontend (escribe mensaje)
2. Frontend → Cloud Function /api/v1/messages
3. Cloud Function → Meta Business API
4. Meta Business API → Usuario WhatsApp
5. Backend → Firestore (actualiza solicitudesHumanas)
6. Firestore → Frontend (actualiza UI)
```

### Escenario 3: Prueba del agente desde el dashboard

```
1. Operador → Frontend /agent-test (escribe mensaje)
2. Frontend → Backend /api/agent/chat-advanced
3. Backend → OpenAI Agent (procesa con historial)
4. OpenAI Agent → Ejecuta herramientas
5. Backend → Frontend (respuesta JSON)
6. Frontend → Renderiza respuesta + herramientas usadas
```

---

## 🎯 Guía de Uso

### Probar el Agente AI

1. **Inicia el backend:**
   ```bash
   cd Chatbot
   npm run dev
   ```

2. **Inicia el frontend:**
   ```bash
   cd Frontend
   npm start
   ```

3. **Accede al dashboard:**
   - URL: `http://localhost:3000`
   - Login con Firebase Auth

4. **Ve a "🤖 Test AI"** en el menú superior

5. **Prueba mensajes como:**
   - "¿Cuánto cuestan 50 chompas?"
   - "Envíame el catálogo de polos"
   - "Quiero hablar con un asesor"
   - "¿Qué productos tienes?"

### Integrar el Agente en Otra Página

```javascript
import { sendAgentMessage } from '../services/apiService';

const MiComponente = () => {
  const handleSendMessage = async (message) => {
    try {
      const response = await sendAgentMessage('51987654321', message);
      console.log('Respuesta del agente:', response.data.response);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <button onClick={() => handleSendMessage('Hola')}>
      Probar Agente
    </button>
  );
};
```

---

## 🔧 Solución de Problemas

### Error: "Failed to fetch" o "Network Error"

**Causa:** El backend no está corriendo o la URL es incorrecta.

**Solución:**
1. Verifica que el backend esté en ejecución:
   ```bash
   curl http://localhost:3008/api/agent/health
   ```
2. Revisa la variable `REACT_APP_API_BASE_URL` en `.env`
3. Verifica CORS en el backend (debe incluir `http://localhost:3000`)

### Error: "Unauthorized" o 401

**Causa:** API Key faltante o incorrecta.

**Solución:**
1. Verifica `REACT_APP_API_KEY` en `.env`
2. Asegúrate de que coincida con el backend
3. Si es desarrollo, considera desactivar temporalmente la autenticación

### Error: "Origin not allowed by CORS"

**Causa:** El backend no permite requests desde tu origen.

**Solución:**
En el backend, agrega en `.env`:
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### El agente no responde o responde mal

**Causa:** Configuración de OpenAI o prompts incorrectos.

**Solución:**
1. Verifica el estado de salud: `GET /api/agent/health`
2. Revisa que `OPENAI_API_KEY` esté configurado en el backend
3. Revisa los prompts en Firestore: `settings/prompts`

### Mensajes no aparecen en tiempo real

**Causa:** Firebase listeners no están funcionando.

**Solución:**
1. Verifica las reglas de seguridad de Firestore
2. Asegúrate de estar autenticado en Firebase
3. Revisa la consola del navegador por errores de Firebase

---

## 📊 Comparación: Antes vs Después

### ❌ Antes (Sin Integración Backend)

- Solo conexión directa a Firebase
- Sin acceso al agente AI desde el dashboard
- Sin visibilidad de herramientas del agente
- Endpoint hardcoded de Cloud Functions
- Sin capa de servicio API

### ✅ Después (Con Integración Backend)

- ✅ Capa de servicio API completa (`apiService.js`)
- ✅ Componente de prueba del agente AI (`AgentTest.jsx`)
- ✅ Configuración mediante variables de entorno
- ✅ Acceso a todos los endpoints del backend
- ✅ Visualización de herramientas y estado del agente
- ✅ Mejor manejo de errores
- ✅ Documentación completa

---

## 🚀 Próximos Pasos Recomendados

1. **Implementar autenticación mejorada:**
   - Usar tokens JWT en lugar de API keys estáticas
   - Integrar Firebase Auth tokens con el backend

2. **Agregar panel de configuración del agente:**
   - Editar prompts desde el dashboard
   - Activar/desactivar herramientas
   - Ver logs de herramientas ejecutadas

3. **Mejorar el chat en vivo:**
   - Integrar sugerencias del agente AI
   - Autocompletado basado en IA
   - Resumen de conversación con IA

4. **Analytics:**
   - Dashboard de métricas del agente
   - Tiempo de respuesta promedio
   - Herramientas más utilizadas
   - Tasa de escalamiento a humanos

5. **Testing:**
   - Agregar tests unitarios para `apiService.js`
   - Tests de integración con mock del backend
   - Tests E2E con Cypress o Playwright

---

## 📞 Contacto y Soporte

Para problemas de integración:
- Revisa la documentación del backend: `Chatbot/API_FRONTEND.md`
- Consulta `Chatbot/CLAUDE.md` para detalles técnicos del backend
- Abre un issue en el repositorio

---

**Última actualización:** Octubre 2025
**Versión:** 1.0.0
