"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClientForCompany, supabase } from "@/lib/supabaseClient";

const getLocalDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CargaPage() {
  const router = useRouter();
  const params = useParams();
  const empresaId = params.empresa as string;
  const empresaNombre = empresaId.charAt(0).toUpperCase() + empresaId.slice(1);

  // Instanciar cliente dinámico para la empresa actual
  const [dbClient] = useState(() => createClientForCompany(empresaId));

  const [formData, setFormData] = useState({
    fecha: getLocalDateString(),
    tipoMovimiento: "",
    tipoGasto: "",
    tipoGastoOtro: "",
    descripcion: "",
    moneda: "",
    monto: "",
  });

  const [showModal, setShowModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData(prev => ({ ...prev, fecha: getLocalDateString() }));
  }, []);

  useEffect(() => {
    if (showModal || showLogoutConfirm) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [showModal, showLogoutConfirm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatearFechaEs = (fechaStr: string) => {
    if (!fechaStr) return "";
    const partes = fechaStr.split("-");
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fechaStr;
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedMonto = parseFloat(formData.monto);
    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      alert("Por favor, ingrese un monto numérico válido y mayor a cero.");
      return;
    }
    setShowModal(true);
  };

  const getFinalTipoGasto = () => {
    return formData.tipoGasto === "Otros" ? formData.tipoGastoOtro : formData.tipoGasto;
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    setStatusMessage("");

    try {
      const finalTipoGasto = getFinalTipoGasto();
      
      const { error } = await dbClient.from("movimientos").insert([
        {
          empresa: empresaId,
          fecha: formData.fecha,
          tipo_movimiento: formData.tipoMovimiento,
          categoria: finalTipoGasto,
          descripcion: formData.descripcion || "Sin descripción",
          moneda: formData.moneda,
          monto: parseFloat(formData.monto),
        },
      ]);

      if (error) throw error;

      setFormData((prev) => ({
        ...prev,
        descripcion: "",
        monto: "",
      }));
      setStatusMessage("Movimiento registrado con éxito.");
      setShowModal(false);
    } catch (error: unknown) {
      console.error(error);
      const e = error as Error;
      setStatusMessage("Error al guardar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const inputBaseClass = "w-full p-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all text-[16px]";

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center p-4 sm:p-6 font-sans overflow-x-hidden w-full max-w-[100vw]">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-6 shadow-xl mt-2 relative">
        <div className="flex justify-between items-start mb-1 pt-1">
          <div className="flex flex-col">
            <h1 className="text-3xl font-extrabold text-blue-950 tracking-wide">
              {empresaNombre}
            </h1>
          </div>
          
          <div className="flex space-x-2">
            <Link 
              href="/"
              className="flex items-center justify-center px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 rounded-md text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex-1 sm:flex-none"
            >
              Cambiar
            </Link>
            <button 
              onClick={() => setShowLogoutConfirm(true)} 
              className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-md text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex-1 sm:flex-none"
            >
              Salir
            </button>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mb-6 uppercase font-semibold text-left">
          Carga de Movimientos
        </p>

        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg mb-6 border border-gray-200">
          <button className="py-2 text-sm font-bold rounded-md bg-white text-blue-900 shadow-sm border border-gray-200 transition-all">
            Cargar
          </button>
          <Link href={`/workspace/${empresaId}/visualizar`} className="py-2 text-sm font-semibold rounded-md text-gray-500 hover:text-blue-900 text-center transition-all">
            Visualizar
          </Link>
        </div>

        {statusMessage && (
          <div className={`p-3 rounded-lg mb-4 text-sm text-center font-medium ${statusMessage.includes("éxito") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {statusMessage}
          </div>
        )}

        <form onSubmit={handlePreSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Movimiento <span className="text-red-500">*</span></label>
            <select name="tipoMovimiento" value={formData.tipoMovimiento} onChange={handleChange} required className={inputBaseClass}>
              <option value="">Seleccione...</option>
              <option value="Ingreso">Ingreso</option>
              <option value="Egreso">Egreso</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Fecha <span className="text-red-500">*</span></label>
            <div className="relative flex items-center">
              <input 
                type="date" 
                name="fecha" 
                value={formData.fecha} 
                onChange={handleChange} 
                required 
                className={`custom-date-input ${inputBaseClass} relative z-10`} 
              />
              <span className="absolute left-[0.75rem] top-1/2 -translate-y-1/2 pointer-events-none z-20 text-gray-900 text-sm">
                {formatearFechaEs(formData.fecha)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Gasto <span className="text-red-500">*</span></label>
            <select name="tipoGasto" value={formData.tipoGasto} onChange={handleChange} required className={inputBaseClass}>
              <option value="">Seleccione...</option>
              <option value="Peaje">Peaje</option>
              <option value="Combustible">Combustible</option>
              <option value="Otros">Otros</option>
            </select>
            {formData.tipoGasto === "Otros" && (
              <div className="mt-2">
                <input type="text" name="tipoGastoOtro" value={formData.tipoGastoOtro} onChange={handleChange} placeholder="Especifique tipo de gasto..." required className={inputBaseClass} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Descripción (Opcional)</label>
            <input type="text" name="descripcion" value={formData.descripcion} onChange={handleChange} placeholder="Detalle del movimiento..." className={inputBaseClass} />
          </div>

          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Moneda <span className="text-red-500">*</span></label>
              <select name="moneda" value={formData.moneda} onChange={handleChange} required className={inputBaseClass}>
                <option value="">—</option>
                <option value="ARS">Pesos (ARS)</option>
                <option value="USD">Dólares (USD)</option>
              </select>
            </div>

            <div className="col-span-3">
              <label className="block text-xs font-bold text-gray-700 mb-1">Monto <span className="text-red-500">*</span></label>
              <input type="number" step="0.01" name="monto" value={formData.monto} onChange={handleChange} placeholder="0.00" required className={`font-bold text-gray-900 ${inputBaseClass}`} />
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-950 text-white p-3 rounded-lg font-bold border border-blue-950 hover:bg-blue-900 active:scale-[0.99] transition-all mt-4 shadow-sm">
            Ingresar Movimiento
          </button>
        </form>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto overscroll-none">
          <div className="bg-white w-full max-w-sm rounded-xl border border-gray-200 p-6 text-left shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Confirmar Registro</h2>
            <p className="text-xs text-gray-500 mb-4">Verifique la información para <strong>{empresaNombre}</strong>:</p>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-gray-800 mb-5 border border-gray-200">
              <p><strong className="text-gray-500">Tipo de Movimiento:</strong> {formData.tipoMovimiento}</p>
              <p><strong className="text-gray-500">Tipo de Gasto:</strong> {getFinalTipoGasto()}</p>
              <p><strong className="text-gray-500">Fecha:</strong> {formatearFechaEs(formData.fecha)}</p>
              <p><strong className="text-gray-500">Detalle:</strong> {formData.descripcion || "N/A"}</p>
              <div className="pt-3 mt-1 border-t border-gray-200 flex justify-between text-base text-gray-900">
                <strong>Total a cargar:</strong>
                <span className={`font-bold ${formData.tipoMovimiento === 'Ingreso' ? 'text-green-700' : 'text-red-700'}`}>
                  {formData.moneda} {parseFloat(formData.monto).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex space-x-3 text-sm">
              <button onClick={() => setShowModal(false)} disabled={loading} className="flex-1 bg-white text-gray-600 font-semibold p-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                Modificar
              </button>
              <button onClick={handleConfirmSubmit} disabled={loading} className="flex-1 bg-blue-950 text-white font-bold p-2.5 rounded-lg hover:bg-blue-900 transition-colors shadow-sm">
                {loading ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
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
