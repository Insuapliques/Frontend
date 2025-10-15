import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const auth = getAuth();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin(); // 🔁 dispara actualización en App.js
    } catch (err) {
      setError("❌ Correo o contraseña incorrectos");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-sm border border-gray-700">
        <h1 className="text-2xl font-bold text-green-500 text-center mb-6">🔐 Accede a la Consola</h1>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400"
          />

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            onClick={handleLogin}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-2 rounded-lg transition"
          >
            Ingresar
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;

