import React, { useEffect, useState, useRef } from "react";
import { db, storage } from "../firebaseConfig";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  getDocs
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function HistorialConversaciones() {
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedConv, setSelectedConv] = useState(null);
  const chatRef = useRef();

  useEffect(() => {
    const q = query(collection(db, "conversations"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const convs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setConversations(convs);
    });
    return () => unsubscribe();
  }, []);

  const exportToPDF = async () => {
    const input = chatRef.current;
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`chat_${selectedConv.user}.pdf`);
  };

  const eliminarConversacion = async (id) => {
    const confirmar = window.confirm(
      "¿Estás seguro de que deseas eliminar esta conversación y todos sus archivos?"
    );
    if (!confirmar) return;

    try {
      // Eliminar subcolección `media` y sus archivos
      const mediaRef = collection(db, "conversations", id, "media");
      const mediaSnap = await getDocs(mediaRef);

      for (const mediaDoc of mediaSnap.docs) {
        const mediaData = mediaDoc.data();

        if (mediaData.path) {
          try {
            const storageRef = ref(storage, mediaData.path);
            await deleteObject(storageRef);
          } catch (e) {
            console.warn("⚠️ No se pudo eliminar archivo en Storage:", e);
          }
        }

        await deleteDoc(mediaDoc.ref);
      }

      // Eliminar documento principal
      await deleteDoc(doc(db, "conversations", id));
      setSelectedConv(null);
      alert("✅ Conversación y archivos eliminados");
    } catch (error) {
      console.error("❌ Error al eliminar conversación:", error);
      alert("❌ Error al eliminar la conversación completa");
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.user?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      {/* Panel izquierdo */}
      <aside className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-700 p-4 overflow-y-auto bg-gray-800">
        <h2 className="text-green-500 text-xl font-semibold mb-4">WhatsApp - Historial</h2>
        <input
          type="text"
          placeholder="Buscar por número..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 mb-4 rounded bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:ring focus:ring-green-500"
        />
        <ul className="space-y-2">
          {filteredConversations.map((conv) => (
            <li
              key={conv.id}
              className={`relative cursor-pointer p-3 rounded transition-colors ${
                selectedConv?.id === conv.id
                  ? "bg-green-500 text-black"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              <div onClick={() => setSelectedConv(conv)}>
                <p className="font-bold">{conv.user}</p>
                <p className="text-sm truncate text-gray-300">
                  Último mensaje: {conv.messages?.slice(-1)[0]?.text?.slice(0, 30)}...
                </p>
              </div>
              <button
                onClick={() => eliminarConversacion(conv.id)}
                className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-sm font-bold"
                title="Eliminar conversación"
              >
                ✖
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Panel derecho */}
      <main className="flex-1 p-6 overflow-y-auto">
        {selectedConv ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-green-500 text-lg font-semibold">
                👤 Conversación con {selectedConv.user}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={exportToPDF}
                  className="bg-green-500 hover:bg-green-400 text-black font-bold py-2 px-4 rounded"
                >
                  📄 Exportar PDF
                </button>
                <button
                  onClick={() => eliminarConversacion(selectedConv.id)}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>

            <div ref={chatRef} className="space-y-4">
              {selectedConv.messages?.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.from === "bot" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2 rounded-lg max-w-[70%] ${
                      msg.from === "bot"
                        ? "bg-green-500 text-black"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p className="text-xs mt-1 text-gray-300">
                      {new Date(msg.timestamp?.seconds * 1000).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-gray-400 text-center mt-20">
            Selecciona una conversación para ver los detalles.
          </div>
        )}
      </main>
    </div>
  );
}

export default HistorialConversaciones;




