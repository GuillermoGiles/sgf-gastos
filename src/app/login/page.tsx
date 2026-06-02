"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg("Credenciales incorrectas. Inténtalo de nuevo.");
      } else if (data.user) {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg("Error de conexión al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans w-full">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-8 shadow-xl relative overflow-hidden">
        
        {/* Adorno superior (azul corporativo) */}
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-900"></div>

        <div className="text-center mb-8 mt-2">
          <h1 className="text-2xl font-bold text-blue-950 tracking-wide">SGF</h1>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mt-1">
            Gestión Multi-Empresa
          </h2>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg mb-6 text-sm text-center font-medium bg-red-50 text-red-700 border border-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ejemplo.com"
              required
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-950 text-white p-3 rounded-lg font-bold border border-blue-900 hover:bg-blue-900 active:scale-[0.99] transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              "Ingresando..."
            ) : (
              "Ingresar al Sistema"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-8">
          Acceso exclusivo para administradores
        </p>
      </div>
    </main>
  );
}
