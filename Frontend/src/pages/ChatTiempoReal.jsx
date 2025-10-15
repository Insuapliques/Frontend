// ChatTiempoReal con contador de mensajes no leídos
import React, { useEffect, useState, useRef } from "react";
import { db, storage } from "../firebaseConfig";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FaPaperclip } from "react-icons/fa";

function ChatTiempoReal() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const bottomRef = useRef(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [noLeidos, setNoLeidos] = useState({});

  const uniqueUsers = [...new Set(messages.map((msg) => msg.user))].filter(
    (user) => user !== "operador"
  );

  const getColorForUser = (userId) => {
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  useEffect(() => {
    const q = query(collection(db, "liveChat"), orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);

      const nuevos = { ...noLeidos };
      msgs.forEach((msg) => {
        if (msg.origen !== "operador" && (!selectedUser || msg.user !== selectedUser)) {
          nuevos[msg.user] = (nuevos[msg.user] || 0) + 1;
        }
      });
      setNoLeidos(nuevos);
    });
    return () => unsubscribe();
  }, [selectedUser]);

  useEffect(() => {
    const q = query(collection(db, "solicitudesHumanas"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const solicitudesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSolicitudes(solicitudesData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if ((!input.trim() && !file) || !selectedUser) return;

    let fileUrl = "";
    let fileType = "";

    if (file) {
      const storageRef = ref(storage, `liveChat/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      fileUrl = await getDownloadURL(storageRef);
      fileType = file.type.startsWith("image") ? "image" : file.type.startsWith("audio") ? "audio" : "file";
    }

    try {
      await fetch("https://us-central1-chat-bot-7ffe3.cloudfunctions.net/api/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: selectedUser,
          message: input,
          urlMedia: fileUrl || null,
        }),
      });

      await updateDoc(doc(db, "solicitudesHumanas", selectedUser), {
        atendido: true,
        atendidoPor: "operador",
        atendidoEn: new Date(),
      });
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    }

    setInput("");
    setFile(null);
  };

  const atenderSolicitud = async (id, user) => {
    try {
      await deleteDoc(doc(db, "solicitudesHumanas", id));
      await setDoc(doc(db, "liveChatStates", user), {
        modoHumano: true,
        atendidoPor: "operador",
        atendidoEn: new Date(),
      });
      setSelectedUser(user);
      setNoLeidos((prev) => ({ ...prev, [user]: 0 }));
    } catch (error) {
      console.error("Error al atender solicitud:", error);
    }
  };

  const finalizarChat = async (userId) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, "solicitudesHumanas", userId));
      alert("Chat finalizado correctamente ✅");
      setSelectedUser(null);
    } catch (error) {
      console.error("Error al finalizar chat:", error);
    }
  };

  const cerrarConversacion = async () => {
    if (!selectedUser) return;
    try {
      await deleteDoc(doc(db, "solicitudesHumanas", selectedUser));
      await deleteDoc(doc(db, "liveChatStates", selectedUser));
    } catch (error) {
      console.error("Error al cerrar conversación:", error);
    }
  };

  const filteredMessages = selectedUser
    ? messages.filter((msg) => msg.user === selectedUser)
    : [];

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
        <h1 className="text-xl font-semibold">💬 Chat en Vivo</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Lista de usuarios */}
        <aside className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="p-4 font-bold text-gray-300">Chats</div>
          {uniqueUsers.map((user) => {
            const lastMsg = messages.filter((m) => m.user === user).slice(-1)[0];
            return (
              <div
                key={user}
                onClick={() => {
                  setSelectedUser(user);
                  setNoLeidos((prev) => ({ ...prev, [user]: 0 }));
                }}
                className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-700 ${
                  selectedUser === user ? "bg-gray-700" : ""
                }`}
              >
                <div className={`w-10 h-10 rounded-full ${getColorForUser(user)} shadow`} />
                <div>
                  <p className="text-sm font-semibold flex items-center gap-2">
                    {user}
                    {noLeidos[user] > 0 && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {noLeidos[user]}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {lastMsg?.text?.slice(0, 30) || "Multimedia..."}
                  </p>
                </div>
              </div>
            );
          })}
        </aside>

        {/* Conversación */}
        <main className="flex-1 flex flex-col justify-between">
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-xs px-4 py-2 rounded-2xl text-sm shadow-md ${
                  msg.origen === "operador"
                    ? "bg-green-500 text-black self-end"
                    : "bg-gray-700 self-start"
                }`}
              >
                {msg.text && <p>{msg.text}</p>}
                {msg.fileUrl &&
                  (msg.fileType === "image" ? (
                    <img src={msg.fileUrl} alt="img" className="mt-2 rounded-md" />
                  ) : msg.fileType === "audio" ? (
                    <audio controls className="mt-2 w-full">
                      <source src={msg.fileUrl} type="audio/mpeg" />
                      Tu navegador no soporta audio.
                    </audio>
                  ) : (
                    <a
                      href={msg.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-300 underline"
                    >
                      📎 Archivo
                    </a>
                  ))}
              </div>
            ))}
            {isTyping && <p className="text-xs text-gray-400">Escribiendo...</p>}
            <div ref={bottomRef}></div>
          </div>

          <div className="p-4 border-t border-gray-700 bg-gray-800 flex items-center gap-3">
            <label htmlFor="file-input">
              <FaPaperclip className="text-green-400 cursor-pointer" size={20} />
            </label>
            <input
              id="file-input"
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              className="flex-1 px-4 py-2 bg-gray-900 rounded-full border border-gray-700"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setIsTyping(true);
                setTimeout(() => setIsTyping(false), 1500);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              onClick={handleSend}
              className="bg-green-500 text-black px-4 py-2 rounded-full font-semibold"
            >
              ➤
            </button>
          </div>
        </main>

        {/* Panel derecho */}
        <aside className="w-72 bg-gray-800 border-l border-gray-700 p-4">
          <h3 className="text-lg font-semibold mb-4">📋 Detalles</h3>
          {selectedUser ? (
            <>
              <p><strong>Usuario:</strong> {selectedUser}</p>
              <button
                onClick={() => {
                  cerrarConversacion();
                  finalizarChat(selectedUser);
                }}
                className="w-full mt-4 bg-red-600 text-white py-2 rounded-md"
              >
                Finalizar Chat
              </button>
            </>
          ) : (
            <p className="text-gray-400">Selecciona un usuario</p>
          )}

          <h4 className="mt-6 mb-2 font-bold">📨 Solicitudes</h4>
          {solicitudes.map((s) => (
            <div key={s.id} className="mb-3 p-2 bg-gray-700 rounded-md">
              <p className="font-medium">{s.user}</p>
              <p className="text-xs text-gray-300">
                {new Date(s.timestamp?.seconds * 1000).toLocaleString()}
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setSelectedUser(s.user)}
                  className="text-sm bg-blue-500 px-3 py-1 rounded"
                >
                  Ver
                </button>
                <button
                  onClick={() => atenderSolicitud(s.id, s.user)}
                  className="text-sm bg-green-500 text-black px-3 py-1 rounded"
                >
                  Atender
                </button>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

export default ChatTiempoReal;






