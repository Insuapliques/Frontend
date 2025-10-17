import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { onAuthStateChanged, getAuth, signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";

import HistorialConversaciones from "./pages/HistorialConversaciones";
import EntrenamientoConfig from "./pages/EntrenamientoConfig";
import ChatTiempoReal from "./pages/ChatTiempoReal";
import ProductosChatbotPanel from "./pages/ProductosChatbotPanel";
import AgentTest from "./pages/AgentTest";
import Login from "./pages/Login";

function App() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
    });
    return () => unsubscribe();
  }, []);

  if (!usuario) return <Login onLogin={() => {}} />;

  const handleLogout = () => {
    signOut(getAuth());
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white font-sans">
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 shadow flex items-center justify-between">
          <h1 className="text-green-500 text-xl font-bold">🤖 Insuapliques</h1>
          <nav className="flex items-center gap-4">
            <CustomLink to="/">Historial</CustomLink>
            <CustomLink to="/entrenamiento">Entrenamiento</CustomLink>
            <CustomLink to="/Documentos">Documentos</CustomLink>
            <CustomLink to="/chat">Chat en Vivo</CustomLink>
            <CustomLink to="/agent-test">🤖 Test AI</CustomLink>
            <button
              onClick={handleLogout}
              className="text-green-400 font-semibold hover:text-green-300 transition"
            >
              Cerrar sesión
            </button>
          </nav>
        </header>

        <main className="p-6">
          <Routes>
            <Route path="/" element={<HistorialConversaciones />} />
            <Route path="/entrenamiento" element={<EntrenamientoConfig />} />
            <Route path="/Documentos" element={<ProductosChatbotPanel />} />
            <Route path="/chat" element={<ChatTiempoReal />} />
            <Route path="/agent-test" element={<AgentTest />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function CustomLink({ to, children }) {
  return (
    <Link
      to={to}
      className="text-gray-200 font-semibold px-3 py-1 rounded hover:bg-green-500 hover:text-black transition"
    >
      {children}
    </Link>
  );
}

export default App;
