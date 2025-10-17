import React, { useState, useEffect, useRef } from "react";
import { sendAgentMessageAdvanced, checkAgentHealth, getAgentTools } from "../services/apiService";

/**
 * Componente de prueba del Agente AI
 * Permite probar el agente de OpenAI integrado con el backend
 */
function AgentTest() {
  const [phone, setPhone] = useState("51987654321"); // Número de prueba
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState(null);
  const [tools, setTools] = useState([]);
  const [showTools, setShowTools] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    // Cargar estado de salud del agente
    loadHealth();
    // Cargar herramientas disponibles
    loadTools();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadHealth = async () => {
    try {
      const healthData = await checkAgentHealth();
      setHealth(healthData);
    } catch (error) {
      console.error("Error al verificar salud del agente:", error);
      setHealth({ status: "error", error: error.message });
    }
  };

  const loadTools = async () => {
    try {
      const response = await getAgentTools();
      if (response.success) {
        setTools(response.data.tools);
      }
    } catch (error) {
      console.error("Error al cargar herramientas:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    // Agregar mensaje del usuario
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: new Date() },
    ]);

    try {
      // Preparar historial para el backend
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Llamar al agente
      const response = await sendAgentMessageAdvanced(
        phone,
        userMessage,
        conversationHistory
      );

      if (response.success) {
        // Agregar respuesta del agente
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response.data.text,
            timestamp: new Date(),
            toolCalls: response.data.toolCalls,
            latency: response.data.latencyMs,
          },
        ]);
      }
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      // Agregar mensaje de error
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          content: `Error: ${error.message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
  };

  const getHealthStatusColor = () => {
    if (!health) return "bg-gray-500";
    if (health.status === "healthy") return "bg-green-500";
    if (health.status === "error") return "bg-red-500";
    return "bg-yellow-500";
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-green-500">🤖 Prueba del Agente AI</h1>
            <div className="flex items-center gap-4">
              {/* Estado de salud */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getHealthStatusColor()}`}></div>
                <span className="text-sm text-gray-400">
                  {health?.status || "Cargando..."}
                </span>
              </div>

              {/* Botón de herramientas */}
              <button
                onClick={() => setShowTools(!showTools)}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition"
              >
                🛠️ Herramientas ({tools.length})
              </button>

              {/* Botón de limpiar */}
              <button
                onClick={clearConversation}
                className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg text-sm transition"
              >
                🗑️ Limpiar
              </button>
            </div>
          </div>

          {/* Información del agente */}
          {health && health.status === "healthy" && (
            <div className="mt-4 bg-gray-800 rounded-lg p-4 text-sm">
              <p className="text-gray-400">
                <strong>Modelo:</strong> {health.checks?.openai?.model || "N/A"} |{" "}
                <strong>Firestore:</strong>{" "}
                {health.checks?.firestore?.connected ? "✅ Conectado" : "❌ Desconectado"} |{" "}
                <strong>Herramientas:</strong> {health.checks?.tools?.available || 0}
              </p>
            </div>
          )}
        </div>

        {/* Panel de herramientas */}
        {showTools && (
          <div className="mb-6 bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-400">
              🛠️ Herramientas Disponibles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tools.map((tool) => (
                <div key={tool.name} className="bg-gray-700 rounded-lg p-4">
                  <h3 className="font-bold text-green-300">{tool.name}</h3>
                  <p className="text-sm text-gray-400 mt-2">{tool.description}</p>
                  {tool.example && (
                    <pre className="mt-2 bg-gray-900 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify(tool.example, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Área de chat */}
        <div className="bg-gray-800 rounded-lg shadow-xl flex flex-col h-[600px]">
          {/* Configuración de teléfono */}
          <div className="border-b border-gray-700 p-4 flex items-center gap-4">
            <label className="text-sm text-gray-400">Número de prueba:</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-gray-900 px-3 py-1 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="51987654321"
            />
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-20">
                <p className="text-4xl mb-4">💬</p>
                <p>Escribe un mensaje para probar el agente AI</p>
                <p className="text-sm mt-2">
                  Prueba preguntas como: "¿Cuánto cuestan 50 chompas?" o "Envíame el catálogo de
                  polos"
                </p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className="space-y-2">
                <div
                  className={`flex ${
                    msg.role === "user"
                      ? "justify-end"
                      : msg.role === "error"
                      ? "justify-center"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-green-500 text-black"
                        : msg.role === "error"
                        ? "bg-red-600 text-white"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {msg.timestamp?.toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Mostrar herramientas utilizadas */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="ml-4 text-xs text-gray-400">
                    🛠️ Herramientas usadas:{" "}
                    {msg.toolCalls.map((tool) => tool.toolName).join(", ")} | ⏱️{" "}
                    {msg.latency}ms
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 px-4 py-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <div className="animate-bounce">●</div>
                    <div className="animate-bounce" style={{ animationDelay: "0.2s" }}>
                      ●
                    </div>
                    <div className="animate-bounce" style={{ animationDelay: "0.4s" }}>
                      ●
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef}></div>
          </div>

          {/* Input */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Escribe tu mensaje..."
                className="flex-1 bg-gray-900 px-4 py-3 rounded-full border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-green-500 hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold px-6 py-3 rounded-full transition"
              >
                {loading ? "⏳" : "➤"}
              </button>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4 text-sm text-gray-400">
          <p>
            <strong>ℹ️ Nota:</strong> Este componente se conecta al backend del agente AI en{" "}
            <code className="bg-gray-900 px-2 py-1 rounded">{process.env.REACT_APP_API_BASE_URL || "http://localhost:3008"}</code>
            . Asegúrate de que el backend esté corriendo y configurado correctamente.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AgentTest;
