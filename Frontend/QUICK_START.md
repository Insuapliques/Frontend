# 🚀 Quick Start - Integración Frontend-Backend

## ⚡ Inicio Rápido (5 minutos)

### 1. Instalar Dependencias
```bash
cd Frontend
npm install
```

### 2. Configurar Variables de Entorno
```bash
cp .env.example .env
```

Edita `.env` y agrega tu API key:
```env
REACT_APP_API_KEY=tu-api-key-aqui
```

### 3. Iniciar Backend
```bash
cd ../Chatbot
npm run dev
```
✅ Backend corriendo en `http://localhost:3008`

### 4. Iniciar Frontend
```bash
cd ../Frontend
npm start
```
✅ Frontend corriendo en `http://localhost:3000`

### 5. Probar el Agente
1. Abre: http://localhost:3000
2. Login con Firebase Auth
3. Click en **"🤖 Test AI"** en el menú
4. Escribe: "¿Cuánto cuestan 50 chompas?"

---

## 📁 Archivos Importantes Creados

```
Frontend/
├── package.json                     ← Dependencias (NUEVO)
├── .env.example                     ← Configuración (NUEVO)
├── .gitignore                       ← Git ignore (NUEVO)
├── tailwind.config.js               ← Tailwind (NUEVO)
├── postcss.config.js                ← PostCSS (NUEVO)
├── README.md                        ← Docs completa (NUEVO)
├── INTEGRATION_GUIDE.md             ← Guía técnica (NUEVO)
├── CAMBIOS_REALIZADOS.md            ← Este resumen (NUEVO)
└── src/
    ├── services/
    │   └── apiService.js            ← API Layer (NUEVO)
    ├── pages/
    │   ├── AgentTest.jsx            ← Test AI (NUEVO)
    │   └── ChatTiempoReal.jsx       ← Actualizado
    ├── firebaseConfig.jsx           ← Actualizado
    └── App.jsx                      ← Actualizado
```

---

## 🎯 Nuevas Funcionalidades

### 1. Servicio API Centralizado
```javascript
import { sendAgentMessage } from './services/apiService';

const response = await sendAgentMessage('51987654321', 'Hola');
console.log(response.data.response);
```

### 2. Página de Prueba del Agente AI
- Ruta: `/agent-test`
- Chat completo con el agente OpenAI
- Visualiza herramientas ejecutadas
- Estado de salud del backend

### 3. Variables de Entorno
- Configuración flexible
- Sin URLs hardcoded
- API keys seguras

---

## 🔌 Endpoints del Backend Disponibles

| Endpoint | Descripción |
|----------|-------------|
| `POST /api/agent/chat` | Chat simple con IA |
| `POST /api/agent/chat-advanced` | Chat con historial |
| `GET /api/agent/prompt` | Obtener configuración |
| `GET /api/agent/health` | Estado del agente |
| `GET /api/agent/tools` | Lista de herramientas |

**Base URL:** http://localhost:3008

**Auth:** Header `X-Api-Key: your-key`

---

## 🆘 Solución Rápida de Problemas

### ❌ "Failed to fetch"
**Causa:** Backend no está corriendo
```bash
cd Chatbot && npm run dev
```

### ❌ "Unauthorized"
**Causa:** API Key incorrecta
```bash
# Editar .env
REACT_APP_API_KEY=tu-api-key-correcta
```

### ❌ "CORS error"
**Causa:** Backend no permite tu origen
```bash
# En backend/.env
ALLOWED_ORIGINS=http://localhost:3000
```

---

## 📚 Documentación Completa

- **README.md** - Instalación y uso general
- **INTEGRATION_GUIDE.md** - Detalles técnicos de integración
- **CAMBIOS_REALIZADOS.md** - Lista completa de cambios

---

## ✅ Checklist de Verificación

- [ ] `npm install` completado sin errores
- [ ] `.env` creado con API key
- [ ] Backend corriendo en puerto 3008
- [ ] Frontend corriendo en puerto 3000
- [ ] Login funciona (Firebase Auth)
- [ ] Puedes acceder a `/agent-test`
- [ ] El agente responde mensajes

Si todos están ✅, ¡la integración está completa! 🎉

---

**¿Necesitas ayuda?** Consulta INTEGRATION_GUIDE.md para detalles técnicos.
