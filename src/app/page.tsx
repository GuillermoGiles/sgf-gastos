"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const empresas = [
  { id: "malayca", nombre: "Malayca" },
  { id: "supermercados", nombre: "Supermercados" },
  { id: "guenther", nombre: "Guenther" },
  { id: "gral", nombre: "Gral" },
  { id: "aldo", nombre: "Aldo" },
];

export default function Home() {
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6 font-sans w-full">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-6 shadow-xl relative overflow-hidden mt-4">
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-xl font-bold text-blue-950 tracking-wide">SGF</h1>
            <h2 className="text-sm font-semibold text-gray-500">Selector de Entorno</h2>
          </div>
          
          <button 
            onClick={() => setShowLogoutConfirm(true)} 
            className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-md text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
          >
            Salir
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {empresas.map((empresa) => (
            <Link 
              key={empresa.id}
              href={`/workspace/${empresa.id}/carga`}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-900 hover:shadow-md transition-all group"
            >
              <span className="font-bold text-lg text-blue-950">
                {empresa.nombre}
              </span>
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-950 transition-colors">
                <svg 
                  className="w-4 h-4 text-blue-900 group-hover:text-white transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE CIERRE DE SESIÓN */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-gray-200 p-6 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">¿Cerrar Sesión?</h2>
            <p className="text-sm text-gray-500 mb-6 font-medium">Estás a punto de salir del sistema. Tendrás que volver a ingresar tus credenciales para acceder.</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors flex-1"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSignOut}
                className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex-1 shadow-sm"
              >
                Sí, salir
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
