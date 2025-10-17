"use client"

import React, { useEffect, useState, useRef } from "react"
import { db } from "../firebaseConfig"
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
  getDoc,
} from "firebase/firestore"
import {
  FaPaperclip,
  FaPaperPlane,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaCheckDouble,
  FaTimes,
  FaFile,
  FaMicrophone,
  FaRobot,
  FaUserTie,
  FaLock,
  FaUnlock,
} from "react-icons/fa"
import {
  getActiveConversations,
  takeoverConversation,
  releaseConversation,
  sendPanelMessage,
  getConversationMessages,
  getConversationStatus,
} from "../services/apiService"

function ChatTiempoReal() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [file, setFile] = useState(null)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [solicitudes, setSolicitudes] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [showUserInfo, setShowUserInfo] = useState(true)
  const [filePreview, setFilePreview] = useState(null)
  const [clientesData, setClientesData] = useState({})

  // New state for backend integration
  const [conversationStates, setConversationStates] = useState({}) // Track modoHumano state per conversation
  const [loading, setLoading] = useState(false)
  const [controlLoading, setControlLoading] = useState(false)

  const uniqueUsers = [...new Set(messages.map((msg) => msg.user))].filter((user) => user !== "operador")

  const getColorForUser = (userId) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-cyan-500",
      "bg-emerald-500",
      "bg-violet-500",
    ]
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const getInitials = (name) => {
    if (!name) return "U"
    const parts = name.split(" ")
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const fetchClienteData = async (phoneNumber) => {
    if (!phoneNumber || phoneNumber.trim() === "") {
      console.log("[v0] Invalid phone number:", phoneNumber)
      return {
        name: "Usuario Desconocido",
        profilePicture: null,
        phoneNumber: phoneNumber || "unknown",
      }
    }

    try {
      console.log("[v0] Fetching cliente data for:", phoneNumber)
      const clienteRef = doc(db, "clientes", phoneNumber)
      const clienteSnap = await getDoc(clienteRef)

      if (clienteSnap.exists()) {
        const data = clienteSnap.data()
        console.log("[v0] Cliente found in Firestore:", data)
        return {
          name: data.nombre || data.name || phoneNumber,
          profilePicture: data.profilePicture || null,
          phoneNumber: phoneNumber,
        }
      } else {
        console.log("[v0] Cliente not found in Firestore, trying WhatsApp API")
        // If customer doesn't exist, try to fetch from WhatsApp API
        const whatsappProfile = await fetchWhatsAppProfile(phoneNumber)
        return {
          name: whatsappProfile?.name || phoneNumber,
          profilePicture: whatsappProfile?.profilePicture || null,
          phoneNumber: phoneNumber,
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching cliente data:", error)
      return {
        name: phoneNumber,
        profilePicture: null,
        phoneNumber: phoneNumber,
      }
    }
  }

  const fetchWhatsAppProfile = async (phoneNumber) => {
    if (!phoneNumber || phoneNumber.trim() === "") {
      console.log("[v0] Invalid phone number for WhatsApp API:", phoneNumber)
      return null
    }

    try {
      console.log("[v0] Fetching WhatsApp profile for:", phoneNumber)
      // Note: This requires WhatsApp Business API access token
      // You'll need to replace this with your actual API endpoint
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3008'}/whatsapp/profile/${phoneNumber}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] WhatsApp profile received:", data)

        // Save to Firestore for caching
        if (data.name || data.profilePicture) {
          await setDoc(
            doc(db, "clientes", phoneNumber),
            {
              nombre: data.name || phoneNumber,
              name: data.name || phoneNumber,
              profilePicture: data.profilePicture || null,
              lastUpdated: new Date(),
            },
            { merge: true },
          )
        }

        return data
      } else {
        console.log("[v0] WhatsApp API response not OK:", response.status)
      }
    } catch (error) {
      console.error("[v0] Error fetching WhatsApp profile:", error)
    }
    return null
  }

  // Load active conversations from backend
  const loadActiveConversations = async () => {
    try {
      setLoading(true)
      const response = await getActiveConversations(50)
      if (response.success) {
        // Update conversation states
        const states = {}
        response.data.conversations.forEach(conv => {
          states[conv.phone] = {
            modoHumano: conv.modoHumano,
            estadoActual: conv.estadoActual,
            productoActual: conv.productoActual,
            unreadCount: conv.unreadCount || 0,
          }
        })
        setConversationStates(states)
      }
    } catch (error) {
      console.error("[Backend] Error loading conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  // Load messages from backend for selected user
  // Note: Currently using Firebase real-time listener, but this function is available
  // for future migration to backend-only message loading
  // eslint-disable-next-line no-unused-vars
  const loadBackendMessages = async (phone) => {
    try {
      const response = await getConversationMessages(phone, 100)
      if (response.success && response.data.messages) {
        // Transform backend messages to Firebase format for compatibility
        const transformedMessages = response.data.messages.map(msg => ({
          id: msg.id,
          text: msg.text,
          fileUrl: msg.fileUrl,
          fileType: msg.fileType || 'text',
          origen: msg.origen, // 'cliente', 'bot', or 'operador'
          user: phone,
          timestamp: {
            seconds: new Date(msg.timestamp).getTime() / 1000,
          },
        }))
        return transformedMessages
      }
    } catch (error) {
      console.error("[Backend] Error loading messages:", error)
    }
    return []
  }

  // Check conversation status from backend
  const checkConversationStatus = async (phone) => {
    try {
      const response = await getConversationStatus(phone)
      if (response.success && response.data) {
        setConversationStates(prev => ({
          ...prev,
          [phone]: {
            modoHumano: response.data.modoHumano,
            estadoActual: response.data.estadoActual,
            productoActual: response.data.productoActual,
          },
        }))
        return response.data
      }
    } catch (error) {
      console.error("[Backend] Error checking conversation status:", error)
    }
    return null
  }

  // Take control of conversation
  const handleTakeControl = async (phone) => {
    try {
      setControlLoading(true)
      const response = await takeoverConversation(phone)
      if (response.success) {
        setConversationStates(prev => ({
          ...prev,
          [phone]: {
            ...prev[phone],
            modoHumano: true,
          },
        }))
        alert('✅ Control tomado exitosamente. Ahora puedes responder manualmente.')
        await checkConversationStatus(phone)
      }
    } catch (error) {
      console.error("[Backend] Error taking control:", error)
      alert('❌ Error al tomar control: ' + (error.message || 'Error desconocido'))
    } finally {
      setControlLoading(false)
    }
  }

  // Release control of conversation
  const handleReleaseControl = async (phone) => {
    try {
      setControlLoading(true)
      const response = await releaseConversation(phone)
      if (response.success) {
        setConversationStates(prev => ({
          ...prev,
          [phone]: {
            ...prev[phone],
            modoHumano: false,
          },
        }))
        alert('✅ Control liberado. El bot volverá a responder automáticamente.')
        await checkConversationStatus(phone)
      }
    } catch (error) {
      console.error("[Backend] Error releasing control:", error)
      alert('❌ Error al liberar control: ' + (error.message || 'Error desconocido'))
    } finally {
      setControlLoading(false)
    }
  }

  const calculateRecentUnread = (user) => {
    const now = Date.now()
    const thirtyMinutesAgo = now - 30 * 60 * 1000

    const userMessages = messages.filter((msg) => msg.user === user)

    // Get messages from last 30 minutes
    const recentMessages = userMessages.filter((msg) => {
      const msgTime = msg.timestamp?.seconds * 1000 || 0
      return msgTime >= thirtyMinutesAgo
    })

    // Count messages from client that don't have an operator response after them
    let unreadCount = 0
    for (let i = recentMessages.length - 1; i >= 0; i--) {
      const msg = recentMessages[i]

      // If it's from operator, stop counting (conversation was attended)
      if (msg.origen === "operador") {
        break
      }

      // If it's from client, increment counter
      if (msg.origen !== "operador") {
        unreadCount++
      }
    }

    return unreadCount
  }

  // Load conversations from backend periodically
  useEffect(() => {
    loadActiveConversations()

    // Reload conversations every 5 seconds
    const conversationInterval = setInterval(loadActiveConversations, 5000)

    return () => clearInterval(conversationInterval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const loadClientesData = async () => {
      const newClientesData = {}

      for (const user of uniqueUsers) {
        if (user && !clientesData[user]) {
          console.log("[v0] Loading cliente data for user:", user)
          const data = await fetchClienteData(user)
          newClientesData[user] = data
        }
      }

      if (Object.keys(newClientesData).length > 0) {
        setClientesData((prev) => ({ ...prev, ...newClientesData }))
      }
    }

    if (uniqueUsers.length > 0) {
      loadClientesData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueUsers.join(",")])

  useEffect(() => {
    const q = query(collection(db, "liveChat"), orderBy("timestamp"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setMessages(msgs)
    })
    return () => unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser, uniqueUsers])

  useEffect(() => {
    const q = query(collection(db, "solicitudesHumanas"), orderBy("timestamp", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const solicitudesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setSolicitudes(solicitudesData)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)

      // Create preview for images
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setFilePreview(reader.result)
        }
        reader.readAsDataURL(selectedFile)
      } else {
        setFilePreview(null)
      }
    }
  }

  const handleSend = async () => {
    if ((!input.trim() && !file) || !selectedUser) return

    // Check if we have control before sending
    const hasControl = conversationStates[selectedUser]?.modoHumano
    if (!hasControl) {
      alert("⚠️ Debes tomar control de la conversación antes de enviar mensajes")
      return
    }

    const messageText = input.trim()
    setInput("")
    setLoading(true)

    try {
      // For now, we only support text messages via the panel API
      // File upload would need to be implemented separately
      if (file) {
        alert("⚠️ El envío de archivos no está disponible en modo panel. Solo se enviará el texto.")
        setFile(null)
        setFilePreview(null)
      }

      // Send message via backend panel API
      const response = await sendPanelMessage(selectedUser, messageText)

      if (response.success) {
        // Message sent successfully, it will appear via real-time updates
        console.log("[Backend] Message sent successfully")

        // Update Firebase for backward compatibility
        try {
          await updateDoc(doc(db, "solicitudesHumanas", selectedUser), {
            atendido: true,
            atendidoPor: "operador",
            atendidoEn: new Date(),
          })
        } catch (fbError) {
          console.log("[Firebase] Could not update solicitudesHumanas:", fbError)
        }
      } else {
        alert("❌ Error al enviar mensaje: " + (response.error || "Error desconocido"))
        setInput(messageText) // Restore message
      }
    } catch (error) {
      console.error("[Backend] Error sending message:", error)
      alert("❌ Error al enviar mensaje: " + (error.message || "Error desconocido"))
      setInput(messageText) // Restore message
    } finally {
      setLoading(false)
      setFile(null)
      setFilePreview(null)
    }
  }

  const atenderSolicitud = async (id, user) => {
    try {
      await deleteDoc(doc(db, "solicitudesHumanas", id))
      await setDoc(doc(db, "liveChatStates", user), {
        modoHumano: true,
        atendidoPor: "operador",
        atendidoEn: new Date(),
      })
      setSelectedUser(user)
      // Also take control via backend API
      await handleTakeControl(user)
    } catch (error) {
      console.error("Error al atender solicitud:", error)
    }
  }

  const finalizarChat = async (userId) => {
    if (!userId) return
    try {
      await deleteDoc(doc(db, "solicitudesHumanas", userId))
      alert("Chat finalizado correctamente ✅")
      setSelectedUser(null)
    } catch (error) {
      console.error("Error al finalizar chat:", error)
    }
  }

  const cerrarConversacion = async () => {
    if (!selectedUser) return
    try {
      await deleteDoc(doc(db, "solicitudesHumanas", selectedUser))
      await deleteDoc(doc(db, "liveChatStates", selectedUser))
    } catch (error) {
      console.error("Error al cerrar conversación:", error)
    }
  }

  const filteredMessages = selectedUser ? messages.filter((msg) => msg.user === selectedUser) : []

  const formatTime = (timestamp) => {
    if (!timestamp) return ""
    const date = new Date(timestamp.seconds * 1000)
    return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ""
    const date = new Date(timestamp.seconds * 1000)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Hoy"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ayer"
    } else {
      return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        {/* Header del sidebar */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <h2 className="text-white text-lg font-semibold flex items-center gap-2">
            <FaEnvelope className="text-blue-200" />
            Conversaciones
          </h2>
          <p className="text-blue-100 text-xs mt-1">
            {uniqueUsers.length} {uniqueUsers.length === 1 ? "chat activo" : "chats activos"}
          </p>
        </div>

        {/* Lista de conversaciones */}
        <div className="flex-1 overflow-y-auto">
          {uniqueUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
              <FaEnvelope size={48} className="mb-3 opacity-30" />
              <p className="text-sm text-center">No hay conversaciones activas</p>
            </div>
          ) : (
            uniqueUsers.map((user) => {
              const lastMsg = messages.filter((m) => m.user === user).slice(-1)[0]
              const isActive = selectedUser === user
              const clienteData = clientesData[user] || { name: user, profilePicture: null, phoneNumber: user }
              const unreadCount = calculateRecentUnread(user)

              return (
                <div
                  key={user}
                  onClick={() => {
                    setSelectedUser(user)
                  }}
                  className={`p-4 flex items-start gap-3 cursor-pointer transition-all duration-200 border-b border-gray-100 hover:bg-blue-50 ${
                    isActive ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    {clienteData.profilePicture ? (
                      <img
                        src={clienteData.profilePicture}
                        alt={clienteData.name}
                        className="w-12 h-12 rounded-full object-cover shadow-md"
                        onError={(e) => {
                          // Fallback to colored circle if image fails to load
                          e.target.style.display = "none"
                          e.target.nextSibling.style.display = "flex"
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-12 h-12 rounded-full ${getColorForUser(user)} flex items-center justify-center text-white font-semibold shadow-md ${clienteData.profilePicture ? "hidden" : ""}`}
                    >
                      {getInitials(clienteData.name)}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>

                  {/* Info del usuario */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{clienteData.name}</h3>
                      {lastMsg?.timestamp && (
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatTime(lastMsg.timestamp)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-600 truncate flex-1">
                        {lastMsg?.origen === "operador" && (
                          <FaCheckDouble className="inline mr-1 text-blue-500" size={10} />
                        )}
                        {lastMsg?.text?.slice(0, 35) || "📎 Archivo multimedia"}
                      </p>
                      {unreadCount > 0 && (
                        <span className="ml-2 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {solicitudes.length > 0 && (
          <div className="border-t border-gray-200 bg-yellow-50 p-3">
            <h4 className="text-xs font-semibold text-yellow-800 mb-2 flex items-center gap-1">
              <FaClock size={12} />
              Solicitudes Pendientes ({solicitudes.length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {solicitudes.slice(0, 3).map((s) => {
                const clienteData = clientesData[s.user] || { name: s.user }
                return (
                  <div key={s.id} className="bg-white p-2 rounded-lg shadow-sm border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">{clienteData.name}</span>
                      <button
                        onClick={() => atenderSolicitud(s.id, s.user)}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
                      >
                        Atender
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col bg-white">
        {selectedUser ? (
          <>
            {/* Header del chat */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                {clientesData[selectedUser]?.profilePicture ? (
                  <img
                    src={clientesData[selectedUser].profilePicture}
                    alt={clientesData[selectedUser].name}
                    className="w-10 h-10 rounded-full object-cover shadow flex-shrink-0"
                    onError={(e) => {
                      e.target.style.display = "none"
                      e.target.nextSibling.style.display = "flex"
                    }}
                  />
                ) : null}
                <div
                  className={`w-10 h-10 rounded-full ${getColorForUser(selectedUser)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow ${clientesData[selectedUser]?.profilePicture ? "hidden" : ""}`}
                >
                  {getInitials(clientesData[selectedUser]?.name || selectedUser)}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{clientesData[selectedUser]?.name || selectedUser}</h2>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {conversationStates[selectedUser]?.modoHumano ? (
                      <span className="text-orange-600 font-medium flex items-center gap-1">
                        <FaUserTie size={10} />
                        Modo Manual
                      </span>
                    ) : (
                      <span className="text-purple-600 font-medium flex items-center gap-1">
                        <FaRobot size={10} />
                        Modo Bot
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Control buttons */}
                {conversationStates[selectedUser]?.modoHumano ? (
                  <button
                    onClick={() => handleReleaseControl(selectedUser)}
                    disabled={controlLoading}
                    className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Liberar control - El bot volverá a responder automáticamente"
                  >
                    <FaUnlock size={14} />
                    Liberar Control
                  </button>
                ) : (
                  <button
                    onClick={() => handleTakeControl(selectedUser)}
                    disabled={controlLoading}
                    className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Tomar control - Podrás responder manualmente"
                  >
                    <FaLock size={14} />
                    Tomar Control
                  </button>
                )}

                <button
                  onClick={() => setShowUserInfo(!showUserInfo)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Información del usuario"
                >
                  <FaUser className="text-gray-600" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm("¿Finalizar esta conversación?")) {
                      cerrarConversacion()
                      finalizarChat(selectedUser)
                    }
                  }}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  title="Finalizar chat"
                >
                  <FaTimes className="text-red-600" />
                </button>
              </div>
            </div>

            {/* Mensajes del chat */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
              <div className="max-w-4xl mx-auto space-y-4">
                {filteredMessages.map((msg, index) => {
                  const isOperator = msg.origen === "operador"
                  const showDate =
                    index === 0 || formatDate(msg.timestamp) !== formatDate(filteredMessages[index - 1]?.timestamp)

                  return (
                    <React.Fragment key={msg.id}>
                      {/* Separador de fecha */}
                      {showDate && (
                        <div className="flex items-center justify-center my-4">
                          <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                            {formatDate(msg.timestamp)}
                          </div>
                        </div>
                      )}

                      {/* Mensaje */}
                      <div
                        className={`flex items-end gap-2 ${isOperator || msg.origen === "bot" ? "flex-row-reverse" : "flex-row"} animate-fade-in`}
                      >
                        {/* Avatar - only show for client messages */}
                        {msg.origen === "cliente" && (
                          <>
                            {clientesData[msg.user]?.profilePicture ? (
                              <img
                                src={clientesData[msg.user].profilePicture}
                                alt={clientesData[msg.user].name}
                                className="w-8 h-8 rounded-full object-cover shadow flex-shrink-0"
                                onError={(e) => {
                                  e.target.style.display = "none"
                                  e.target.nextSibling.style.display = "flex"
                                }}
                              />
                            ) : null}
                            <div
                              className={`w-8 h-8 rounded-full ${getColorForUser(msg.user)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow ${clientesData[msg.user]?.profilePicture ? "hidden" : ""}`}
                            >
                              {getInitials(clientesData[msg.user]?.name || msg.user)}
                            </div>
                          </>
                        )}

                        {/* Bot avatar */}
                        {msg.origen === "bot" && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow">
                            <FaRobot size={16} />
                          </div>
                        )}

                        {/* Operator avatar */}
                        {msg.origen === "operador" && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow">
                            <FaUserTie size={16} />
                          </div>
                        )}

                        {/* Burbuja de mensaje */}
                        <div className={`max-w-md ${isOperator || msg.origen === "bot" ? "items-end" : "items-start"} flex flex-col`}>
                          <div
                            className={`px-4 py-2 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                              msg.origen === "operador"
                                ? "bg-gradient-to-br from-green-500 to-green-600 text-white rounded-br-sm"
                                : msg.origen === "bot"
                                ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-br-sm"
                                : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                            }`}
                          >
                            {/* Texto del mensaje */}
                            {msg.text && (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                            )}

                            {/* Archivos multimedia */}
                            {msg.fileUrl && (
                              <div className="mt-2">
                                {msg.fileType === "image" ? (
                                  <img
                                    src={msg.fileUrl}
                                    alt="imagen"
                                    className="rounded-lg max-w-xs cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(msg.fileUrl, "_blank")}
                                  />
                                ) : msg.fileType === "audio" ? (
                                  <div className="flex items-center gap-2 bg-black/10 rounded-lg p-2">
                                    <FaMicrophone className={isOperator ? "text-white" : "text-blue-600"} />
                                    <audio controls className="max-w-xs">
                                      <source src={msg.fileUrl} type="audio/mpeg" />
                                    </audio>
                                  </div>
                                ) : (
                                  <a
                                    href={msg.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 ${isOperator ? "text-blue-100 hover:text-white" : "text-blue-600 hover:text-blue-800"} transition-colors`}
                                  >
                                    <FaFile />
                                    <span className="text-sm underline">Ver archivo</span>
                                  </a>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Hora del mensaje y origen */}
                          <div className={`flex items-center gap-2 mt-1 px-1 ${isOperator || msg.origen === "bot" ? "flex-row-reverse" : "flex-row"}`}>
                            <span className="text-xs text-gray-500">
                              {formatTime(msg.timestamp)}
                            </span>
                            <span className={`text-xs font-medium ${
                              msg.origen === "operador" ? "text-green-600" :
                              msg.origen === "bot" ? "text-purple-600" :
                              "text-gray-600"
                            }`}>
                              {msg.origen === "operador" ? "Operador" :
                               msg.origen === "bot" ? "Bot" :
                               "Cliente"}
                            </span>
                            {(isOperator || msg.origen === "operador") && <FaCheckDouble className="inline text-blue-500" size={10} />}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  )
                })}

                {/* Indicador de escritura */}
                {isTyping && (
                  <div className="flex items-end gap-2 animate-fade-in">
                    {clientesData[selectedUser]?.profilePicture ? (
                      <img
                        src={clientesData[selectedUser].profilePicture}
                        alt={clientesData[selectedUser].name}
                        className="w-8 h-8 rounded-full object-cover shadow"
                      />
                    ) : (
                      <div
                        className={`w-8 h-8 rounded-full ${getColorForUser(selectedUser)} flex items-center justify-center text-white text-xs font-semibold`}
                      >
                        {getInitials(clientesData[selectedUser]?.name || selectedUser)}
                      </div>
                    )}
                    <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                      <div className="flex gap-1">
                        <span
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></span>
                        <span
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></span>
                        <span
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef}></div>
              </div>
            </div>

            {/* Input de mensaje */}
            <div className="border-t border-gray-200 bg-white p-4">
              <div className="max-w-4xl mx-auto">
                {/* Control warning banner */}
                {!conversationStates[selectedUser]?.modoHumano && (
                  <div className="mb-3 bg-yellow-50 border border-yellow-300 rounded-lg p-3 flex items-center gap-2">
                    <FaLock className="text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      <strong>Control del Bot Activo.</strong> Para responder manualmente, haz clic en "Tomar Control" arriba.
                    </p>
                  </div>
                )}

                {conversationStates[selectedUser]?.modoHumano && (
                  <div className="mb-3 bg-green-50 border border-green-300 rounded-lg p-3 flex items-center gap-2">
                    <FaUnlock className="text-green-600" />
                    <p className="text-sm text-green-800">
                      <strong>Control Manual Activo.</strong> Puedes responder al cliente. El bot no responderá automáticamente.
                    </p>
                  </div>
                )}

                {/* Preview de archivo */}
                {filePreview && (
                  <div className="mb-3 relative inline-block">
                    <img src={filePreview} alt="preview" className="h-20 rounded-lg border-2 border-blue-500" />
                    <button
                      onClick={() => {
                        setFile(null)
                        setFilePreview(null)
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                )}
                {file && !filePreview && (
                  <div className="mb-3 flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                    <FaFile className="text-blue-600" />
                    <span className="text-sm text-gray-700 flex-1">{file.name}</span>
                    <button onClick={() => setFile(null)} className="text-red-500 hover:text-red-700">
                      <FaTimes size={14} />
                    </button>
                  </div>
                )}

                {/* Input principal */}
                <div className="flex items-end gap-3">
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!conversationStates[selectedUser]?.modoHumano}
                    className="p-3 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Adjuntar archivo"
                  >
                    <FaPaperclip className="text-gray-600" size={20} />
                  </button>

                  <div className={`flex-1 bg-gray-100 rounded-2xl border border-gray-200 transition-all ${conversationStates[selectedUser]?.modoHumano ? 'focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200' : 'opacity-50'}`}>
                    <textarea
                      placeholder={conversationStates[selectedUser]?.modoHumano ? "Escribe un mensaje..." : "Toma control para escribir..."}
                      className="w-full px-4 py-3 bg-transparent resize-none focus:outline-none text-gray-800 placeholder-gray-500"
                      value={input}
                      rows={1}
                      disabled={!conversationStates[selectedUser]?.modoHumano || loading}
                      onChange={(e) => {
                        setInput(e.target.value)
                        setIsTyping(true)
                        setTimeout(() => setIsTyping(false), 1500)

                        // Auto-resize
                        e.target.style.height = "auto"
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSend()
                          e.target.style.height = "auto"
                        }
                      }}
                    />
                  </div>

                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || !conversationStates[selectedUser]?.modoHumano || loading}
                    className="p-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full transition-all duration-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                    title="Enviar mensaje"
                  >
                    <FaPaperPlane size={18} />
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-2 text-center">
                  {conversationStates[selectedUser]?.modoHumano ?
                    "Presiona Enter para enviar • Shift + Enter para nueva línea" :
                    "Debes tomar control para enviar mensajes"
                  }
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-white">
            <div className="text-center max-w-md px-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <FaEnvelope size={40} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Bienvenido al Chat en Vivo</h3>
              <p className="text-gray-500 leading-relaxed">
                Selecciona una conversación de la lista para comenzar a chatear con tus clientes en tiempo real.
              </p>
              {solicitudes.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium">
                    Tienes {solicitudes.length} solicitudes pendientes
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {selectedUser && showUserInfo && (
        <aside className="w-80 bg-white border-l border-gray-200 overflow-y-auto shadow-sm animate-slide-in">
          <div className="p-6">
            {/* Perfil del usuario */}
            <div className="text-center mb-6">
              {clientesData[selectedUser]?.profilePicture ? (
                <img
                  src={clientesData[selectedUser].profilePicture}
                  alt={clientesData[selectedUser].name}
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-3 shadow-lg"
                  onError={(e) => {
                    e.target.style.display = "none"
                    e.target.nextSibling.style.display = "flex"
                  }}
                />
              ) : null}
              <div
                className={`w-20 h-20 rounded-full ${getColorForUser(selectedUser)} flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3 shadow-lg ${clientesData[selectedUser]?.profilePicture ? "hidden" : ""}`}
              >
                {getInitials(clientesData[selectedUser]?.name || selectedUser)}
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {clientesData[selectedUser]?.name || selectedUser}
              </h3>
              <p className="text-sm text-gray-500 flex items-center justify-center gap-1 mt-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Activo ahora
              </p>
            </div>

            {/* Información de contacto */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FaPhone className="text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Teléfono</p>
                  <p className="text-sm font-medium text-gray-900">
                    {clientesData[selectedUser]?.phoneNumber || selectedUser}
                  </p>
                </div>
              </div>

              {/* Estado de conversación */}
              {conversationStates[selectedUser] && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">Estado de Conversación</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Modo:</span>
                      <span className={`font-medium ${conversationStates[selectedUser].modoHumano ? 'text-orange-600' : 'text-purple-600'}`}>
                        {conversationStates[selectedUser].modoHumano ? '👤 Manual' : '🤖 Automático'}
                      </span>
                    </div>
                    {conversationStates[selectedUser].estadoActual && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Estado:</span>
                        <span className="font-medium text-gray-900">{conversationStates[selectedUser].estadoActual}</span>
                      </div>
                    )}
                    {conversationStates[selectedUser].productoActual && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Producto:</span>
                        <span className="font-medium text-gray-900">{conversationStates[selectedUser].productoActual}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Estadísticas */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Estadísticas</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{filteredMessages.length}</p>
                  <p className="text-xs text-gray-600">Mensajes</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {filteredMessages.filter((m) => m.origen === "operador").length}
                  </p>
                  <p className="text-xs text-gray-600">Respuestas</p>
                </div>
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Acciones Rápidas</h4>

              <button
                onClick={() => {
                  if (window.confirm("¿Finalizar esta conversación?")) {
                    cerrarConversacion()
                    finalizarChat(selectedUser)
                  }
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium"
              >
                <FaTimes />
                Finalizar Chat
              </button>
            </div>

            {/* Historial de conversación */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Historial</h4>
              <div className="space-y-2">
                {filteredMessages
                  .slice(-5)
                  .reverse()
                  .map((msg, idx) => (
                    <div key={idx} className="text-xs p-2 bg-gray-50 rounded">
                      <p className="text-gray-600 truncate">{msg.text || "📎 Archivo"}</p>
                      <p className="text-gray-400 mt-1">{formatTime(msg.timestamp)}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}

export default ChatTiempoReal
