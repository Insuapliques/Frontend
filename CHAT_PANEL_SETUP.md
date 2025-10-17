# Chat en Tiempo Real - Configuración del Panel de Control

## 📋 Resumen

El panel de chat en tiempo real ha sido actualizado para integrarse con el backend de Mimétisa. Ahora los operadores pueden tomar control manual de las conversaciones del chatbot de WhatsApp.

## 🎯 Características Implementadas

### 1. Control Manual de Conversaciones
- ✅ **Tomar Control**: Los operadores pueden tomar control manual de cualquier conversación
- ✅ **Liberar Control**: Devolver el control al bot automático
- ✅ **Indicador Visual**: Estado claro del modo actual (Bot/Manual)

### 2. Diferenciación de Mensajes
Los mensajes ahora muestran claramente su origen:
- **Cliente** (izquierda): Mensajes del usuario de WhatsApp - Fondo blanco
- **Bot** (derecha): Respuestas automáticas del chatbot - Fondo morado
- **Operador** (derecha): Mensajes del operador humano - Fondo verde

### 3. Integración con Backend
- Carga automática de conversaciones activas cada 5 segundos
- Sincronización con el backend de WhatsApp
- Verificación de permisos antes de enviar mensajes
- Mensajes en tiempo real vía Firebase Firestore

### 4. Interfaz Mejorada
- Banners informativos del estado de control
- Botones deshabilitados cuando no hay control
- Información del estado de conversación en el panel lateral
- Feedback visual claro en todas las acciones

## 🔧 Configuración

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto Frontend:

```bash
# Backend API Configuration
REACT_APP_API_BASE_URL=http://localhost:3008
REACT_APP_API_KEY=your-api-key-here
```

**Para Producción:**
```bash
REACT_APP_API_BASE_URL=https://your-backend-url.com
REACT_APP_API_KEY=your-production-api-key
```

### 2. Verificar el Backend

Asegúrate de que el backend esté corriendo:

```bash
cd Chatbot
pnpm dev
```

El backend debería estar disponible en `http://localhost:3008`

### 3. Iniciar el Frontend

```bash
cd Frontend
npm install
npm start
```

## 📡 Endpoints del Backend Utilizados

### 1. Listar Conversaciones Activas
```
GET /panel/conversations?limit=50
```

### 2. Tomar Control
```
POST /panel/takeover/:phone
```

### 3. Liberar Control
```
POST /panel/release/:phone
```

### 4. Enviar Mensaje
```
POST /panel/send
Body: { phone: string, text: string }
```

### 5. Obtener Mensajes
```
GET /panel/messages/:phone?limit=50
```

### 6. Verificar Estado
```
GET /panel/status/:phone
```

## 🎨 Guía Visual

### Estados de Conversación

#### Modo Bot (Automático)
- Indicador: 🤖 **Modo Bot** (texto morado)
- Botón visible: **"Tomar Control"** (verde)
- Input de texto: Deshabilitado
- Banner: Amarillo - "Control del Bot Activo"

#### Modo Manual (Operador)
- Indicador: 👤 **Modo Manual** (texto naranja)
- Botón visible: **"Liberar Control"** (naranja)
- Input de texto: Habilitado
- Banner: Verde - "Control Manual Activo"

### Colores de Mensajes

```
Cliente:   [ Mensaje ]        (Blanco con borde gris)
Bot:                [Mensaje] (Morado con icono 🤖)
Operador:          [Mensaje]  (Verde con icono 👤)
```

## 🔐 Seguridad

### Headers Requeridos
Todas las peticiones al backend requieren el header:
```
X-Api-Key: your-api-key
```

Este está configurado automáticamente en `apiService.js` usando la variable de entorno `REACT_APP_API_KEY`.

## 🚀 Flujo de Uso

### Para Tomar Control de una Conversación:

1. **Seleccionar Conversación**
   - Haz clic en cualquier conversación del panel izquierdo
   - Verás el historial completo de mensajes

2. **Tomar Control**
   - Haz clic en el botón verde **"Tomar Control"**
   - Espera la confirmación (✅)
   - El input de texto se habilitará

3. **Responder al Cliente**
   - Escribe tu mensaje
   - Presiona Enter o haz clic en el botón de enviar
   - El mensaje se enviará vía WhatsApp al cliente

4. **Liberar Control**
   - Cuando termines, haz clic en **"Liberar Control"** (naranja)
   - El bot volverá a responder automáticamente

## ⚠️ Importante

### Restricciones Actuales

1. **Envío de Archivos**: Actualmente no soportado vía la API del panel. Solo mensajes de texto.
2. **Control Único**: No hay bloqueo de concurrencia. Si dos operadores toman control, el último gana.
3. **Tiempo Real**: Las actualizaciones de mensajes dependen del polling cada 5 segundos.

### Próximas Mejoras Sugeridas

- [ ] Implementar WebSockets para actualizaciones en tiempo real
- [ ] Agregar soporte para envío de archivos multimedia
- [ ] Sistema de bloqueo de conversaciones (solo un operador a la vez)
- [ ] Notificaciones de escritorio cuando llegan mensajes nuevos
- [ ] Historial de quién atendió cada conversación

## 🐛 Troubleshooting

### Error: "Debes tomar control primero"
- **Causa**: Intentaste enviar un mensaje sin tomar control
- **Solución**: Haz clic en "Tomar Control" antes de escribir

### Error: "API Request Error"
- **Causa**: Backend no está corriendo o API_KEY incorrecta
- **Solución**:
  1. Verifica que el backend esté corriendo en el puerto 3008
  2. Verifica que `REACT_APP_API_KEY` coincida con la configurada en el backend

### No se cargan las conversaciones
- **Causa**: Problema de conexión con el backend
- **Solución**:
  1. Abre la consola del navegador (F12)
  2. Busca errores de red
  3. Verifica que `REACT_APP_API_BASE_URL` esté correcta

### Los mensajes no se actualizan
- **Causa**: Problema con Firebase o polling
- **Solución**:
  1. Refresca la página
  2. Verifica que Firebase esté configurado correctamente
  3. Revisa la consola por errores

## 📝 Archivos Modificados

1. **`/Frontend/src/services/apiService.js`**
   - Agregadas funciones para panel API:
     - `getActiveConversations()`
     - `takeoverConversation()`
     - `releaseConversation()`
     - `sendPanelMessage()`
     - `getConversationMessages()`
     - `getConversationStatus()`

2. **`/Frontend/src/pages/ChatTiempoReal.jsx`**
   - Integración completa con backend
   - Nuevos estados para control y conversaciones
   - UI mejorada con indicadores visuales
   - Diferenciación de mensajes por origen
   - Botones de control en el header

3. **`/Frontend/.env.example`**
   - Documentación de variables de entorno requeridas

## 📚 Recursos Adicionales

- [Backend Repository](https://github.com/Insuapliques/Chatbot.git)
- [Frontend Repository](https://github.com/Insuapliques/Frontend.git)
- Documentación del backend: Ver README en el repo del Chatbot

## 👥 Soporte

Si encuentras problemas o necesitas ayuda:
1. Revisa la sección de Troubleshooting
2. Verifica los logs del backend y frontend
3. Consulta la consola del navegador por errores específicos

---

**Última actualización**: 2025-10-17
**Versión**: 1.0.0
