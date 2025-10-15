import React, { useEffect, useState } from "react";
import { db, storage } from "../firebaseConfig";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export default function EntrenamientoConfig() {
  const [basePrompt, setBasePrompt] = useState("");
  const [palabraCierre, setPalabraCierre] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [archivoActual, setArchivoActual] = useState(null);
  const [modoEdicionIA, setModoEdicionIA] = useState(false);
  const [mensajes, setMensajes] = useState({});
  const [modoEdicionMensajes, setModoEdicionMensajes] = useState(false);

  const etiquetas = {
    saludoConNombre: "Saludo con nombre personalizado",
    saludoSinNombre: "Saludo sin nombre",
    pedirNombre: "Pedir nombre",
    agradecerNombre: "Agradecer nombre",
    atencionHumana: "Mensaje de atención humana",
    cierreOpcion1: "Cierre - opción 1",
    cierreOpcion2: "Cierre - opción 2",
    cierreOpcion3: "Cierre - Reiniciar",
    cierreOpcion4: "Cierre - Salir",
    cierreDefault: "opciones de cierre por defecto",
    cierreMenuFinal: "Menú final de cierre",
  };
  const campos = Object.keys(etiquetas);

  const cargarPrompts = async () => {
    const configSnap = await getDoc(doc(db, "settings", "prompts"));
    if (configSnap.exists()) {
      const data = configSnap.data();
      setBasePrompt(data.entrenamiento_base || "");
      setPalabraCierre(data.palabra_cierre || "");
    }
  };

  const guardarConfigPrompts = async () => {
    try {
      await updateDoc(doc(db, "settings", "prompts"), {
        entrenamiento_base: basePrompt,
        palabra_cierre: palabraCierre,
      });
      alert("✅ Configuración de prompts actualizada");
      setModoEdicionIA(false);
    } catch (error) {
      alert("❌ Error al guardar configuración IA");
      console.error(error);
    }
  };

  const cargarMensajes = async () => {
    const snap = await getDoc(doc(db, "settings", "welcome_messages"));
    if (snap.exists()) setMensajes(snap.data());
  };

  const cargarArchivoActual = async () => {
    const snap = await getDoc(doc(db, "settings", "archivo_entrenamiento"));
    if (snap.exists()) setArchivoActual(snap.data());
  };

  const guardarMensajes = async () => {
    await setDoc(doc(db, "settings", "welcome_messages"), mensajes);
    alert("✅ Mensajes guardados correctamente");
    setModoEdicionMensajes(false);
  };

  const subirArchivo = async () => {
    if (!archivo) return alert("Debes seleccionar un archivo");

    try {
      // Eliminar archivo anterior si existe
      if (archivoActual?.path) {
        const archivoAnteriorRef = ref(storage, archivoActual.path);
        await deleteObject(archivoAnteriorRef);
      }

      const nombreArchivo = `Entrenamiento/${Date.now()}_${archivo.name}`;
      const storageRef = ref(storage, nombreArchivo);
      await uploadBytes(storageRef, archivo);
      const url = await getDownloadURL(storageRef);

      await setDoc(doc(db, "settings", "archivo_entrenamiento"), {
        nombre: archivo.name,
        path: nombreArchivo,
        url,
        contentType: archivo.type,
        updatedAt: new Date(),
      });

      alert("✅ Archivo subido y reemplazado correctamente");
      setArchivo(null);
      await cargarArchivoActual();
    } catch (error) {
      console.error("❌ Error al subir o reemplazar el archivo:", error);
      alert("❌ Error al subir el archivo");
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([cargarPrompts(), cargarMensajes(), cargarArchivoActual()]);
    };
    init();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 px-6 py-10 font-sans overflow-auto">
      <h2 className="text-2xl font-bold text-green-500 mb-8">⚙️ Configuración de Entrenamiento</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card: Subida de Archivo Excel */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-md p-6 hover:border-green-500 transition">
          <h3 className="text-xl font-semibold text-green-500 mb-4">📁 Subir Documento Excel</h3>

          {archivoActual && (
            <div className="mb-4 text-sm text-white">
              <p><strong>Archivo actual:</strong> {archivoActual.nombre}</p>
              <a href={archivoActual.url} target="_blank" rel="noopener noreferrer" className="text-green-400 underline">
                Ver archivo
              </a>
            </div>
          )}

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setArchivo(e.target.files[0])}
            className="w-full bg-zinc-700 text-white p-3 rounded-xl mb-4"
          />
          <button
            onClick={subirArchivo}
            className="bg-green-500 hover:bg-green-400 text-black font-semibold py-2 px-6 rounded-xl transition"
          >
            {archivoActual ? "Reemplazar Archivo" : "Subir Documento"}
          </button>
        </div>

        {/* Card: Entrenamiento IA */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-md p-6 hover:border-green-500 transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">🤖 Entrenamiento IA</h3>
            {!modoEdicionIA && (
              <button onClick={() => setModoEdicionIA(true)}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-1 rounded-xl text-sm"
              >Editar</button>
            )}
          </div>

          <label className="block text-sm font-medium mb-1 text-white">💬 Prompt base</label>
          <textarea value={basePrompt}
            onChange={(e) => setBasePrompt(e.target.value)} disabled={!modoEdicionIA}
            className="w-full bg-zinc-700 text-white font-mono text-sm min-h-[250px] p-4 rounded-lg border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 resize-y"
            placeholder="Escribe aquí las preguntas y respuestas del entrenamiento base..."
          />

          <label className="block text-sm font-medium mb-1 text-white mt-4">✅ Palabra de cierre</label>
          <input value={palabraCierre}
            onChange={(e) => setPalabraCierre(e.target.value)} disabled={!modoEdicionIA}
            placeholder="Palabra de cierre"
            className="w-full bg-zinc-700 text-white p-3 rounded-xl mb-4 border border-zinc-600 focus:outline-none focus:ring focus:ring-green-500 disabled:opacity-50"
          />

          {modoEdicionIA && (
            <div className="flex gap-4 mt-2">
              <button onClick={guardarConfigPrompts}
                className="bg-green-500 hover:bg-green-400 text-black font-semibold py-2 px-6 rounded-xl transition"
              >Guardar Configuración</button>
              <button onClick={() => setModoEdicionIA(false)}
                className="bg-red-500 hover:bg-red-400 text-white font-semibold py-2 px-6 rounded-xl transition"
              >Cancelar</button>
            </div>
          )}
        </div>

        {/* Card: Mensajes de Bienvenida */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-md p-6 col-span-full hover:border-green-500 transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">💬 Mensajes de Bienvenida</h3>
            {!modoEdicionMensajes && (
              <button onClick={() => setModoEdicionMensajes(true)}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-1 rounded-xl text-sm"
              >Editar</button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campos.map((campo) => (
              <div key={campo}>
                <label className="block text-sm font-medium text-white mb-1">{etiquetas[campo] || campo}</label>
                <textarea
                  value={mensajes[campo] || ""}
                  onChange={(e) => setMensajes((prev) => ({ ...prev, [campo]: e.target.value }))}
                  disabled={!modoEdicionMensajes}
                  rows={campo === "cierreMenuFinal" ? 5 : 2}
                  className={`w-full bg-zinc-700 text-white p-2 rounded-xl border ${mensajes[campo] ? "border-zinc-600" : "border-red-500"} focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50`}
                />
              </div>
            ))}
          </div>

          {modoEdicionMensajes && (
            <div className="flex gap-4 mt-6">
              <button onClick={guardarMensajes}
                className="bg-green-500 hover:bg-green-400 text-black font-semibold py-2 px-5 rounded-xl transition"
              >Guardar</button>
              <button onClick={async () => { await cargarMensajes(); setModoEdicionMensajes(false); }}
                className="bg-red-500 hover:bg-red-400 text-white font-semibold py-2 px-5 rounded-xl transition"
              >Cancelar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



