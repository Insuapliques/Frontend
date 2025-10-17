/**
 * API Service Layer
 * Centraliza todas las llamadas al backend
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3008';
const API_KEY = process.env.REACT_APP_API_KEY || '';

/**
 * Helper function para hacer requests al backend
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'X-Api-Key': API_KEY,
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.details || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Request Error [${endpoint}]:`, error);
    throw error;
  }
};

// ============================================================================
// AGENT API - Endpoints de IA
// ============================================================================

/**
 * Enviar mensaje simple al agente AI
 * @param {string} phone - Número de teléfono del usuario
 * @param {string} message - Mensaje a enviar
 * @returns {Promise<{success: boolean, data: {response: string, latency: number, phone: string}}>}
 */
export const sendAgentMessage = async (phone, message) => {
  return apiRequest('/api/agent/chat', {
    method: 'POST',
    body: JSON.stringify({ phone, message }),
  });
};

/**
 * Enviar mensaje avanzado al agente AI con historial
 * @param {string} phone - Número de teléfono del usuario
 * @param {string} message - Mensaje a enviar
 * @param {Array} conversationHistory - Historial de conversación (opcional)
 * @returns {Promise<Object>}
 */
export const sendAgentMessageAdvanced = async (phone, message, conversationHistory = []) => {
  return apiRequest('/api/agent/chat-advanced', {
    method: 'POST',
    body: JSON.stringify({ phone, message, conversationHistory }),
  });
};

/**
 * Obtener el prompt actual del agente
 * @returns {Promise<{success: boolean, data: {entrenamiento_base: string, temperatura: number, max_tokens: number, palabra_cierre: string}}>}
 */
export const getAgentPrompt = async () => {
  return apiRequest('/api/agent/prompt', {
    method: 'GET',
  });
};

/**
 * Actualizar el prompt del agente
 * @param {string} entrenamiento_base - Nuevo prompt del agente
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const updateAgentPrompt = async (entrenamiento_base) => {
  return apiRequest('/api/agent/prompt', {
    method: 'PUT',
    body: JSON.stringify({ entrenamiento_base }),
  });
};

/**
 * Obtener lista de herramientas disponibles del agente
 * @returns {Promise<{success: boolean, data: {tools: Array, totalTools: number}}>}
 */
export const getAgentTools = async () => {
  return apiRequest('/api/agent/tools', {
    method: 'GET',
  });
};

/**
 * Obtener historial de conversación de un usuario
 * @param {string} phone - Número de teléfono del usuario
 * @param {number} limit - Número de mensajes a obtener (default: 20)
 * @returns {Promise<{success: boolean, data: {phone: string, messages: Array, count: number}}>}
 */
export const getConversationHistory = async (phone, limit = 20) => {
  return apiRequest(`/api/agent/history/${phone}?limit=${limit}`, {
    method: 'GET',
  });
};

/**
 * Obtener estado actual de conversación de un usuario
 * @param {string} phone - Número de teléfono del usuario
 * @returns {Promise<{success: boolean, data: {phone: string, exists: boolean, state: Object}}>}
 */
export const getConversationState = async (phone) => {
  return apiRequest(`/api/agent/state/${phone}`, {
    method: 'GET',
  });
};

/**
 * Reiniciar estado de conversación de un usuario
 * @param {string} phone - Número de teléfono del usuario
 * @returns {Promise<{success: boolean, message: string, phone: string}}>}
 */
export const resetConversationState = async (phone) => {
  return apiRequest(`/api/agent/state/${phone}`, {
    method: 'DELETE',
  });
};

/**
 * Verificar estado de salud del agente
 * @returns {Promise<{status: string, timestamp: string, checks: Object}>}
 */
export const checkAgentHealth = async () => {
  return apiRequest('/api/agent/health', {
    method: 'GET',
  });
};

// ============================================================================
// PANEL API - Envío de mensajes desde el panel
// ============================================================================

/**
 * Enviar mensaje desde el panel de operador
 * @param {string} phone - Número de teléfono del usuario
 * @param {string} text - Texto del mensaje
 * @returns {Promise<{ok: boolean}>}
 */
export const sendPanelMessage = async (phone, text) => {
  return apiRequest('/panel/send', {
    method: 'POST',
    body: JSON.stringify({ phone, text }),
  });
};

// ============================================================================
// TRAINING API - Endpoints de entrenamiento
// ============================================================================

/**
 * Obtener datos de entrenamiento
 * @returns {Promise<Object>}
 */
export const getTrainingData = async () => {
  return apiRequest('/api/training', {
    method: 'GET',
  });
};

/**
 * Actualizar datos de entrenamiento
 * @param {Object} trainingData - Datos de entrenamiento
 * @returns {Promise<Object>}
 */
export const updateTrainingData = async (trainingData) => {
  return apiRequest('/api/training', {
    method: 'PUT',
    body: JSON.stringify(trainingData),
  });
};

// ============================================================================
// CONVERSATION API - Endpoints de conversaciones
// ============================================================================

/**
 * Obtener todas las conversaciones
 * @returns {Promise<Object>}
 */
export const getAllConversations = async () => {
  return apiRequest('/api/conversations', {
    method: 'GET',
  });
};

/**
 * Obtener conversación específica
 * @param {string} conversationId - ID de la conversación
 * @returns {Promise<Object>}
 */
export const getConversation = async (conversationId) => {
  return apiRequest(`/api/conversations/${conversationId}`, {
    method: 'GET',
  });
};

// ============================================================================
// EXPORT
// ============================================================================

export default {
  // Agent
  sendAgentMessage,
  sendAgentMessageAdvanced,
  getAgentPrompt,
  updateAgentPrompt,
  getAgentTools,
  getConversationHistory,
  getConversationState,
  resetConversationState,
  checkAgentHealth,

  // Panel
  sendPanelMessage,

  // Training
  getTrainingData,
  updateTrainingData,

  // Conversations
  getAllConversations,
  getConversation,
};
