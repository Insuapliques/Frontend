# 🔧 Fix CORS - Backend Railway

## 🐛 Problema Detectado

La variable `ALLOWED_ORIGINS` tiene un **slash final** que causa el bloqueo:

```env
❌ https://chatbot.mimetisa.com/
✅ https://chatbot.mimetisa.com
```

---

## ✅ Solución 1: Corregir Variable de Entorno (Más Rápido)

### En Railway Dashboard:

1. Ve a: https://railway.app/
2. Selecciona el proyecto: **chatbot-production-a69e**
3. Ve a **Variables** o **Environment Variables**
4. Busca: `ALLOWED_ORIGINS`
5. Cambia el valor a:

```env
ALLOWED_ORIGINS=https://chat-bot-7ffe3.web.app,https://chat-bot-7ffe3.firebaseapp.com,http://localhost:3000,https://chatbot.mimetisa.com
```

**NOTA:** Quita el `/` al final de `chatbot.mimetisa.com`

6. **Guarda** → Railway redesplegará automáticamente (espera 1-2 minutos)

---

## ✅ Solución 2: Hacer el Código Más Tolerante (Recomendado)

Edita el código del backend para eliminar automáticamente los slashes finales:

**Archivo:** Probablemente `server.ts` o `app.ts`

**ANTES:**
```typescript
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);
```

**DESPUÉS:**
```typescript
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, '')) // ⬅️ Quita slash final
  .filter((origin) => origin.length > 0);

console.log('🌐 Orígenes CORS permitidos:', allowedOrigins);
```

Luego en la validación de CORS:

**ANTES:**
```typescript
origin: (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, true);
    return;
  }

  console.warn(\`Solicitud bloqueada por CORS desde origen no autorizado: \${origin}\`);
  callback(new Error('Origen no autorizado por CORS'));
},
```

**DESPUÉS:**
```typescript
origin: (origin, callback) => {
  // Normalizar origen (quitar slash final)
  const normalizedOrigin = origin?.replace(/\/$/, '');

  if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin)) {
    console.log(\`✅ CORS permitido para: \${normalizedOrigin || 'local'}\`);
    callback(null, true);
    return;
  }

  console.warn(\`❌ Solicitud bloqueada por CORS desde origen no autorizado: \${normalizedOrigin}\`);
  console.log('   Orígenes permitidos:', allowedOrigins);
  callback(new Error('Origen no autorizado por CORS'));
},
```

---

## 🚀 Después de Aplicar la Solución

### 1. Espera el Redeploy
- Railway redesplegará automáticamente (1-2 minutos)

### 2. Verifica los Logs en Railway
Deberías ver:
```
🌐 Orígenes CORS permitidos: [
  'https://chat-bot-7ffe3.web.app',
  'https://chat-bot-7ffe3.firebaseapp.com',
  'http://localhost:3000',
  'https://chatbot.mimetisa.com'
]
✅ CORS permitido para: https://chatbot.mimetisa.com
```

### 3. Refresca el Frontend
Ve a: https://chatbot.mimetisa.com o https://chat-bot-7ffe3.web.app

Deberías ver:
```
✅ GET /panel/conversations 200 OK
✅ [Backend] Loading conversations...
```

---

## 🧪 Testing

### Desde la Consola del Navegador (F12):

```javascript
// Probar manualmente
fetch('https://chatbot-production-a69e.up.railway.app/api/panel/conversations?limit=50', {
  headers: {
    'X-Api-Key': '62c38a8b5fc37c0f7890dcc91143ef7048353851b127c7f1b16850b8d81d0f0b'
  }
})
.then(r => r.json())
.then(d => console.log('✅ Respuesta:', d))
.catch(e => console.error('❌ Error:', e));
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": {
    "conversations": [...],
    "total": 5
  }
}
```

---

## 📋 Checklist

- [ ] Quitar `/` final de `ALLOWED_ORIGINS` en Railway
- [ ] Esperar redeploy (1-2 min)
- [ ] Verificar logs en Railway
- [ ] Refrescar frontend
- [ ] Probar "Tomar Control" en el panel

---

## 🎯 Resumen

| Problema | Causa | Solución |
|----------|-------|----------|
| CORS bloqueado | Slash final en URL | Quitar `/` de la variable de entorno |
| `chatbot.mimetisa.com/` | No coincide con `chatbot.mimetisa.com` | Usar `chatbot.mimetisa.com` |

---

**Tiempo estimado:** 2 minutos para cambiar la variable + 1-2 minutos de redeploy = **3-4 minutos total**

