import React, { useEffect, useState } from "react";
import { db } from "./firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const BotConfigEditor = () => {
  const [basePrompt, setBasePrompt] = useState("");
  const [recuperacionPrompt, setRecuperacionPrompt] = useState("");
  const [palabraCierre, setPalabraCierre] = useState("");

  const docRef = doc(db, "settings", "prompts");

  useEffect(() => {
    const fetchData = async () => {
      const configSnap = await getDoc(docRef);
      if (configSnap.exists()) {
        const data = configSnap.data();
        setBasePrompt(data.entrenamiento_base || "");
        setRecuperacionPrompt(data.entrenamiento_recuperacion || "");
        setPalabraCierre(data.palabra_cierre || "");
      }
    };
    fetchData();
  }, [docRef]);

  const handleSave = async () => {
    try {
      await updateDoc(docRef, {
        entrenamiento_base: basePrompt,
        entrenamiento_recuperacion: recuperacionPrompt,
        palabra_cierre: palabraCierre
      });
      alert("✅ Configuración actualizada correctamente");
    } catch (error) {
      console.error("Error actualizando configuración:", error);
    }
  };

  return (
    <div style={{ padding: "20px", background: "#f9f9f9" }}>
      <h2>⚙️ Configuración del Entrenamiento del Bot</h2>

      <label>🧠 Entrenamiento Base:</label>
      <textarea
        rows="6"
        value={basePrompt}
        onChange={(e) => setBasePrompt(e.target.value)}
        style={{ width: "100%", marginBottom: "10px" }}
      />

      <label>🔍 Entrenamiento Recuperar Datos:</label>
      <textarea
        rows="6"
        value={recuperacionPrompt}
        onChange={(e) => setRecuperacionPrompt(e.target.value)}
        style={{ width: "100%", marginBottom: "10px" }}
      />

      <label>🔒 Palabra de Cierre:</label>
      <input
        type="text"
        value={palabraCierre}
        onChange={(e) => setPalabraCierre(e.target.value)}
        style={{ width: "100%", marginBottom: "20px" }}
      />

      <button onClick={handleSave} style={{ padding: "10px 20px", background: "#28a745", color: "white", border: "none", borderRadius: "5px" }}>
        Guardar Cambios
      </button>
    </div>
  );
};

export default BotConfigEditor;
