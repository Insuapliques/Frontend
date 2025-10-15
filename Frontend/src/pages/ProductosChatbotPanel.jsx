// src/pages/ProductosChatbotPanel.js
import React, { useState, useEffect } from "react";
import { db, storage } from "../firebaseConfig";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ProductosChatbotPanel() {
  const [keyword, setKeyword] = useState("");
  const [tipo, setTipo] = useState("imagen");
  const [respuesta, setRespuesta] = useState("");
  const [file, setFile] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [productos, setProductos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "productos_chatbot"), (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProductos(items);
    });
    return () => unsub();
  }, []);

  const handleUpload = async () => {
    if (!keyword || !respuesta || (!file && !editandoId)) {
      alert("Por favor completa todos los campos.");
      return;
    }

    if (tipo === "video" && file && !file.type.startsWith("video/")) {
      alert("❌ Por favor sube un archivo de video válido.");
      return;
    }

    try {
      setSubiendo(true);
      let url = "";

      if (file) {
        const storageRef = ref(storage, `productos_chatbot/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        url = await getDownloadURL(storageRef);
      }

      if (editandoId) {
        const refDoc = doc(db, "productos_chatbot", editandoId);
        await updateDoc(refDoc, {
          keyword: keyword.toLowerCase(),
          tipo,
          respuesta,
          ...(url && { url }),
        });
        alert("✅ Producto actualizado");
      } else {
        await addDoc(collection(db, "productos_chatbot"), {
          keyword: keyword.toLowerCase(),
          tipo,
          url,
          respuesta,
        });
        alert("✅ Producto registrado con éxito");
      }

      resetFormulario();
    } catch (error) {
      console.error("Error al subir producto:", error);
      alert("❌ Hubo un error al guardar el producto.");
    } finally {
      setSubiendo(false);
    }
  };

  const resetFormulario = () => {
    setKeyword("");
    setTipo("imagen");
    setRespuesta("");
    setFile(null);
    setEditandoId(null);
  };

  const editarProducto = (producto) => {
    setEditandoId(producto.id);
    setKeyword(producto.keyword);
    setTipo(producto.tipo);
    setRespuesta(producto.respuesta);
  };

  const eliminarProducto = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este producto?")) {
      await deleteDoc(doc(db, "productos_chatbot", id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-green-500 mb-6">⚙️ Configurar Envio de Documentos</h2>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 mb-8">
          <input
            type="text"
            placeholder="Palabra clave (ej: aplique)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full p-3 rounded-md bg-gray-700 text-white border border-gray-600"
          >
            <option value="imagen">Imagen</option>
            <option value="pdf">PDF</option>
            <option value="video">Video</option>
          </select>

          <textarea
            placeholder="Mensaje que debe enviar el bot"
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            className="w-full p-3 h-32 rounded-md bg-gray-700 text-white border border-gray-600 resize-none"
          />

          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-500"
          />

          <button
            onClick={handleUpload}
            disabled={subiendo}
            className="w-full py-3 rounded-md bg-green-500 hover:bg-green-600 text-black font-semibold transition"
          >
            {subiendo ? "Subiendo..." : editandoId ? "Actualizar Producto" : "Guardar Documento"}
          </button>
        </div>

        {productos.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-green-400 mb-4">📄 Documentos Registrados</h3>
            <div className="space-y-4">
              {productos.map((item) => (
                <div key={item.id} className="bg-gray-800 p-4 rounded-lg shadow-md">
                  <div className="mb-2">
                    <span className="font-bold text-green-300">{item.keyword}</span> – {item.tipo}
                  </div>
                  <div className="text-sm text-gray-300 mb-3">{item.respuesta}</div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => editarProducto(item)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminarProducto(item.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


