"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClientForCompany, supabase } from "@/lib/supabaseClient";

interface Movimiento {
  id: string;
  fecha: string;
  tipo_movimiento: string;
  categoria: string;
  descripcion: string;
  moneda: string;
  monto: number;
  empresa: string;
}

export default function VisualizarPage() {
  const router = useRouter();
  const params = useParams();
  const empresaId = params.empresa as string;
  const empresaNombre = empresaId.charAt(0).toUpperCase() + empresaId.slice(1);

  const [dbClient] = useState(() => createClientForCompany(empresaId));
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [tasaUsd, setTasaUsd] = useState<number>(1000);
  const [loadingTasa, setLoadingTasa] = useState(true);

  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [movimientoAEditar, setMovimientoAEditar] = useState<Movimiento | null>(null);
  const [movimientoAEliminar, setMovimientoAEliminar] = useState<Movimiento | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editFormData, setEditFormData] = useState({
    fecha: "",
    tipoMovimiento: "",
    tipoGasto: "",
    tipoGastoOtro: "",
    descripcion: "",
    moneda: "",
    monto: "",
  });
  
  const [filtros, setFiltros] = useState({
    fechaExacta: "",
    fechaDesde: "",
    fechaHasta: "",
    moneda: "",
    montoExacto: "",
    montoMin: "",
    montoMax: "",
    tipo_movimiento: "",
    categoriaSelect: "",
    categoriaOtro: ""
  });

  const [visibleCount, setVisibleCount] = useState(20);

  // Bloqueo estricto de scroll en móviles al abrir modales
  useEffect(() => {
    if (showFilters || showEditModal || showDeleteConfirm || showLogoutConfirm) {
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
  }, [showFilters, showEditModal, showDeleteConfirm, showLogoutConfirm]);

  const fetchMovimientos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await dbClient
        .from("movimientos")
        .select("*")
        .order("fecha", { ascending: false });

      if (error) throw error;
      setMovimientos(data || []);
    } catch (error: unknown) {
      console.error(error);
      setErrorMsg("Error al cargar los movimientos.");
    } finally {
      setLoading(false);
    }
  }, [dbClient, empresaId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMovimientos();
    
    const fetchCotizacion = async () => {
      try {
        setLoadingTasa(true);
        const resUsd = await fetch('https://dolarapi.com/v1/dolares/blue');
        if (resUsd.ok) {
          const usdData = await resUsd.json();
          setTasaUsd(usdData.venta || 1000);
        }
      } catch (err) {
        console.error('Error fetching cotizacion:', err);
      } finally {
        setLoadingTasa(false);
      }
    };
    fetchCotizacion();
  }, [fetchMovimientos]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const formatearFechaEs = (fechaStr: string) => {
    if (!fechaStr) return "";
    const partes = fechaStr.split("-");
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fechaStr;
  };

  const getPlaceholderFecha = (fechaStr: string) => {
    if (!fechaStr) return 'dd/mm/aaaa';
    return formatearFechaEs(fechaStr);
  };

  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const openEditModal = (mov: Movimiento) => {
    let tipoGasto = mov.categoria;
    let tipoGastoOtro = "";
    if (mov.categoria !== "Peaje" && mov.categoria !== "Combustible") {
      tipoGasto = "Otros";
      tipoGastoOtro = mov.categoria;
    }
    
    setEditFormData({
      fecha: mov.fecha,
      tipoMovimiento: mov.tipo_movimiento,
      tipoGasto: tipoGasto,
      tipoGastoOtro: tipoGastoOtro,
      descripcion: mov.descripcion || "",
      moneda: mov.moneda,
      monto: mov.monto.toString(),
    });
    setMovimientoAEditar(mov);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setMovimientoAEditar(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movimientoAEditar) return;
    setIsSubmitting(true);
    
    try {
      const finalTipoGasto = editFormData.tipoGasto === "Otros" ? editFormData.tipoGastoOtro : editFormData.tipoGasto;
      
      const { error } = await dbClient.from("movimientos").update({
        fecha: editFormData.fecha,
        tipo_movimiento: editFormData.tipoMovimiento,
        categoria: finalTipoGasto,
        descripcion: editFormData.descripcion || "Sin descripción",
        moneda: editFormData.moneda,
        monto: parseFloat(editFormData.monto),
      }).eq("id", movimientoAEditar.id);

      if (error) throw error;
      
      setMovimientos(prev => prev.map(m => m.id === movimientoAEditar.id ? {
        ...m,
        fecha: editFormData.fecha,
        tipo_movimiento: editFormData.tipoMovimiento,
        categoria: finalTipoGasto,
        descripcion: editFormData.descripcion || "Sin descripción",
        moneda: editFormData.moneda,
        monto: parseFloat(editFormData.monto),
      } : m));
      
      closeEditModal();
    } catch (err) {
      console.error(err);
      alert("Error al actualizar el registro");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteConfirm = (mov: Movimiento) => {
    setMovimientoAEliminar(mov);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!movimientoAEliminar) return;
    setIsSubmitting(true);
    try {
      const { error } = await dbClient.from("movimientos").delete().eq("id", movimientoAEliminar.id);
      if (error) throw error;
      setMovimientos(prev => prev.filter(m => m.id !== movimientoAEliminar.id));
      setShowDeleteConfirm(false);
      setMovimientoAEliminar(null);
    } catch (err) {
      console.error(err);
      alert("Error al eliminar el registro");
    } finally {
      setIsSubmitting(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaExacta: "", fechaDesde: "", fechaHasta: "",
      moneda: "", montoExacto: "", montoMin: "", montoMax: "",
      tipo_movimiento: "", categoriaSelect: "", categoriaOtro: ""
    });
  };

  const movimientosEmpresaActual = movimientos.filter(m => m.empresa === empresaId);
  const movimientosFiltrados = [...movimientosEmpresaActual].filter(mov => {
    let cumple = true;

    if (filtros.fechaExacta && mov.fecha !== filtros.fechaExacta) cumple = false;
    if (filtros.fechaDesde && mov.fecha < filtros.fechaDesde) cumple = false;
    if (filtros.fechaHasta && mov.fecha > filtros.fechaHasta) cumple = false;

    if (filtros.moneda && mov.moneda !== filtros.moneda) cumple = false;
    if (filtros.montoExacto && Number(mov.monto) !== Number(filtros.montoExacto)) cumple = false;
    if (filtros.montoMin && Number(mov.monto) < Number(filtros.montoMin)) cumple = false;
    if (filtros.montoMax && Number(mov.monto) > Number(filtros.montoMax)) cumple = false;

    if (filtros.tipo_movimiento && mov.tipo_movimiento !== filtros.tipo_movimiento) cumple = false;

    const valCategoria = filtros.categoriaSelect === 'Otros' ? filtros.categoriaOtro : filtros.categoriaSelect;
    if (valCategoria && !(mov.categoria?.toLowerCase().includes(valCategoria.toLowerCase()))) cumple = false;

    return cumple;
  });

  const movimientosVisibles = movimientosFiltrados.slice(0, visibleCount);

  // Lógica Inversa Solicitada: Total = Egresos - Ingresos
  const totalArs = movimientosFiltrados
    .filter(m => m.moneda === "ARS")
    .reduce((acc, curr) => acc + (curr.tipo_movimiento === "Egreso" ? curr.monto : -curr.monto), 0);
  
  const totalUsd = movimientosFiltrados
    .filter(m => m.moneda === "USD")
    .reduce((acc, curr) => acc + (curr.tipo_movimiento === "Egreso" ? curr.monto : -curr.monto), 0);

  const granTotalARS = totalArs + (totalUsd * tasaUsd);
  const granTotalUSD = granTotalARS / tasaUsd;

  const empresasNombres: Record<string, string> = {
    malayca: "Malayca",
    supermercados: "Supermercados",
    guenther: "Guenther",
    gral: "Gral",
    aldo: "Aldo"
  };

  const totalesGlobalesARS = Object.keys(empresasNombres).map(empId => {
    const movs = movimientos.filter(m => m.empresa === empId);
    let tArs = 0; let tUsd = 0;
    movs.forEach(m => {
      // Lógica Inversa Solicitada: Total = Egresos - Ingresos
      const factor = m.tipo_movimiento === "Egreso" ? 1 : -1;
      if (m.moneda === "ARS") tArs += m.monto * factor;
      if (m.moneda === "USD") tUsd += m.monto * factor;
    });
    return {
      id: empId,
      nombre: empresasNombres[empId],
      total: tArs + (tUsd * tasaUsd)
    };
  });

  const exportToExcel = async () => {
    try {
      setIsExporting(true);

      if (movimientosFiltrados.length === 0) {
        alert("No hay datos para exportar con los filtros actuales.");
        return;
      }

      const tableHTML = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <style>
            table { border-collapse: collapse; font-family: Arial, sans-serif; }
            th { background-color: #172554; color: #ffffff; font-weight: bold; border: 1px solid #dddddd; padding: 10px; text-align: left; }
            td { border: 1px solid #dddddd; padding: 8px; vertical-align: middle; color: #1f2937; }
            .bg-light { background-color: #f3f4f6; }
            .bg-dark { background-color: #172554; color: #ffffff; }
            .bold { font-weight: bold; }
            .right { text-align: right; }
            .center { text-align: center; }
            .text-blue { color: #1e3a8a; font-weight: bold; }
            .text-blue-neon { color: #60a5fa; font-weight: bold; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                <th colspan="6" style="background-color: #f3f4f6; color: #172554; font-size: 16px; text-align: center; border-bottom: 2px solid #172554; padding: 15px;">
                  REPORTE DE MOVIMIENTOS - EMPRESA: ${empresaNombre.toUpperCase()}
                </th>
              </tr>
              <tr>
                <th>Fecha</th>
                <th>Tipo de Movimiento</th>
                <th>Tipo de Gasto (Categoría)</th>
                <th>Descripción</th>
                <th class="center">Moneda</th>
                <th class="right">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${movimientosFiltrados.map(mov => `
                <tr>
                  <td>${formatearFechaEs(mov.fecha)}</td>
                  <td>${mov.tipo_movimiento || ''}</td>
                  <td>${mov.categoria || ''}</td>
                  <td>${mov.descripcion || 'Sin descripción'}</td>
                  <td class="center bold">${mov.moneda || ''}</td>
                  <td class="right text-blue">${Number(mov.monto).toFixed(2)}</td>
                </tr>
              `).join('')}
              
              <tr><td colspan="6"></td></tr>

              <tr class="bg-light">
                <td colspan="4" class="right bold">SUMATORIA POR DIVISA:</td>
                <td class="center bold">ARS</td>
                <td class="right text-blue">${totalArs.toFixed(2)}</td>
              </tr>
              <tr class="bg-light">
                <td colspan="4"></td>
                <td class="center bold">USD</td>
                <td class="right text-blue">${totalUsd.toFixed(2)}</td>
              </tr>

              <tr><td colspan="6"></td></tr>

              <tr>
                <td colspan="4" class="right bold bg-dark">
                  GRAN TOTAL CONVERTIDO (Tasa USD: ${tasaUsd} ARS)
                </td>
                <td class="center bold bg-dark">ARS</td>
                <td class="right text-blue-neon bg-dark">${granTotalARS.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="4" class="bg-dark"></td>
                <td class="center bold bg-dark">USD</td>
                <td class="right text-blue-neon bg-dark">${granTotalUSD.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fechaHoy = new Date().toLocaleDateString('es-AR').replace(/\//g, '-');
      link.setAttribute('download', `SGF_${empresaNombre}_${fechaHoy}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al exportar:", error);
      alert("Ocurrió un error al intentar generar el archivo Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  const inputBaseClass = "w-full p-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all text-[16px] disabled:opacity-50 disabled:bg-gray-100 disabled:cursor-not-allowed";

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center p-4 sm:p-6 font-sans w-full max-w-[100vw] overflow-x-hidden">
      <div className="w-full max-w-md xl:max-w-[95%] 2xl:max-w-[1500px] bg-white rounded-2xl border border-gray-200 p-6 shadow-xl relative mt-2">
        
        <div className="flex justify-between items-start mb-1 pt-1">
          <div className="flex flex-col pr-2 truncate">
            <h1 className="text-3xl font-extrabold text-blue-950 tracking-wide truncate">
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
          Visualización
        </p>

        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg mb-6 border border-gray-200 w-full max-w-md mx-auto">
          <Link href={`/workspace/${empresaId}/carga`} className="py-2 text-sm font-semibold rounded-md text-gray-500 hover:text-blue-900 text-center transition-all">
            Cargar
          </Link>
          <button className="py-2 text-sm font-bold rounded-md bg-white text-blue-900 shadow-sm border border-gray-200 transition-all">
            Visualizar
          </button>
        </div>



        {/* Panel de Totales Globales */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">
            Resumen Global (ARS)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {totalesGlobalesARS.map(emp => (
              <div key={emp.id} className={`bg-white rounded-xl p-3 border shadow-sm ${emp.id === empresaId ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'} transition-all`}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{emp.nombre}</p>
                <p className={`text-sm font-bold ${emp.total >= 0 ? 'text-blue-900' : 'text-red-600'}`}>
                  ${emp.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bloque de Totales */}
        <div className="mb-6 bg-blue-950 text-white rounded-xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center border border-blue-900 gap-5 md:gap-8">
          <div className="flex-1">
            <p className="text-xs font-bold text-blue-300 mb-2 uppercase tracking-wide">Sumatoria por Divisa:</p>
            <div className="flex flex-col gap-1.5 text-sm font-semibold">
              <span className={totalArs >= 0 ? "text-green-400" : "text-red-400"}>ARS ${totalArs.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              <span className={totalUsd >= 0 ? "text-green-400" : "text-red-400"}>USD ${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          
          <div className="flex-1 border-t border-blue-800 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-8">
            <p className="text-xs font-bold text-blue-300 mb-2 uppercase tracking-wide">Gran Total Convertido:</p>
            <div className="flex flex-col gap-1.5 text-base font-bold">
              <span className={granTotalARS >= 0 ? "text-green-400" : "text-red-400"}>ARS ${granTotalARS.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              <span className={granTotalUSD >= 0 ? "text-green-400" : "text-red-400"}>USD ${granTotalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            {!loadingTasa && (
              <p className="text-[10px] text-blue-400 mt-3 font-medium uppercase tracking-wider bg-blue-900/50 p-2 rounded border border-blue-800/50 text-center md:text-left md:bg-transparent md:p-0 md:border-0 md:mt-3">
                TASA API: 1 USD = {tasaUsd} ARS
              </p>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg mb-4 text-sm text-center font-medium bg-red-50 text-red-700 border border-red-200">
            {errorMsg}
          </div>
        )}

        {/* Tabla Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <h3 className="text-lg font-bold text-gray-800">Registros</h3>
          <div className="flex w-full sm:w-auto gap-3">
            <button
              onClick={exportToExcel}
              disabled={isExporting}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase tracking-wider rounded-md transition-colors shadow-sm disabled:opacity-70 text-center"
            >
              {isExporting ? 'Exportando...' : 'Exportar Excel'}
            </button>
            <button
              onClick={() => setShowFilters(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 rounded-md text-xs font-bold uppercase tracking-wider transition-colors shadow-sm text-center"
            >
              Filtrar
            </button>
          </div>
        </div>

        {/* Vista Mobile (Cards) y Desktop (Tabla) */}
        <div className="w-full">
          {loading ? (
            <div className="text-center py-10 text-gray-500 font-medium animate-pulse">
              Cargando registros...
            </div>
          ) : movimientosFiltrados.length === 0 ? (
            <div className="text-center py-10 text-gray-500 font-medium">
              No hay movimientos registrados para esta empresa con los filtros actuales.
            </div>
          ) : (
            <>
              {/* Vista Desktop */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Tipo de Movimiento</th>
                      <th className="px-4 py-3">Tipo de Gasto</th>
                      <th className="px-4 py-3">Descripción</th>
                      <th className="px-4 py-3 text-right">Monto</th>
                      <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientosVisibles.map((m) => (
                      <tr key={m.id} className="border-b hover:bg-blue-50 transition-colors group">
                        <td className="px-4 py-3 font-medium text-gray-900">{formatearFechaEs(m.fecha)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${m.tipo_movimiento === 'Ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {m.tipo_movimiento}
                          </span>
                        </td>
                        <td className="px-4 py-3">{m.categoria}</td>
                        <td className="px-4 py-3 text-gray-500">{m.descripcion}</td>
                        <td className={`px-4 py-3 text-right font-bold ${m.tipo_movimiento === 'Ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                          {m.moneda} {m.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button onClick={() => openEditModal(m)} className="text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-md shadow-sm border border-blue-200">Editar</button>
                            <button onClick={() => openDeleteConfirm(m)} className="text-xs font-bold text-red-700 hover:text-red-900 transition-colors bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-md shadow-sm border border-red-200">Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 gap-4 md:hidden">
                {movimientosVisibles.map((m) => (
                  <div key={m.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold text-gray-900">{formatearFechaEs(m.fecha)}</span>
                      <span className={`text-base font-bold ${m.tipo_movimiento === 'Ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                        {m.moneda} {m.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <div className="flex flex-col mt-3 mb-3 gap-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tipo de Gasto</span>
                        <span className="text-sm font-semibold text-gray-800">{m.categoria}</span>
                      </div>
                      
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tipo de Movimiento</span>
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${m.tipo_movimiento === 'Ingreso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {m.tipo_movimiento}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-0.5 mt-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Descripción</span>
                        <p className="text-xs text-gray-600">{m.descripcion || "Sin descripción"}</p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-auto pt-3 border-t border-gray-100">
                      <button onClick={() => openEditModal(m)} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">Editar</button>
                      <button onClick={() => openDeleteConfirm(m)} className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {visibleCount < movimientosFiltrados.length && (
                <div className="flex justify-center mt-6">
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 20)}
                    className="px-6 py-2 bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 rounded-full text-sm font-bold tracking-wide transition-colors shadow-sm"
                  >
                    Cargar más registros...
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* MODAL DE FILTROS FLOTANTE */}
      {showFilters && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in overscroll-none">
            <div className="bg-white w-full max-w-6xl rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-2xl max-h-[88vh] overflow-y-auto relative my-auto">
                
                <button 
                    onClick={() => setShowFilters(false)}
                    className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 font-bold text-lg transition-colors"
                    title="Cerrar sin aplicar"
                >
                    ✕
                </button>

                <div className="flex justify-between items-center mb-5 border-b border-gray-200 pb-3 pr-8">
                    <h2 className="text-xl font-bold text-blue-950 flex items-center gap-2">Filtros de Búsqueda</h2>
                    <button onClick={limpiarFiltros} className="text-xs font-bold text-gray-500 hover:text-blue-900 transition-colors bg-gray-50 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-gray-200">
                        Limpiar filtros
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-5 items-end">
                    <div className="w-full">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Fecha Exacta</label>
                        <div className="relative flex items-center">
                            <input type="date" name="fechaExacta" value={filtros.fechaExacta} onChange={handleFiltroChange} disabled={!!filtros.fechaDesde || !!filtros.fechaHasta} className={`custom-date-input ${inputBaseClass} relative z-10`} />
                            <span className={`absolute left-[0.75rem] top-1/2 -translate-y-1/2 pointer-events-none z-20 text-sm ${(!!filtros.fechaDesde || !!filtros.fechaHasta || !filtros.fechaExacta) ? 'text-gray-400' : 'text-gray-900'}`}>
                                {getPlaceholderFecha(filtros.fechaExacta)}
                            </span>
                        </div>
                    </div>
                    <div className="w-full">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Fecha Desde</label>
                        <div className="relative flex items-center">
                            <input type="date" name="fechaDesde" value={filtros.fechaDesde} onChange={handleFiltroChange} disabled={!!filtros.fechaExacta} className={`custom-date-input ${inputBaseClass} relative z-10`} />
                            <span className={`absolute left-[0.75rem] top-1/2 -translate-y-1/2 pointer-events-none z-20 text-sm ${(!!filtros.fechaExacta || !filtros.fechaDesde) ? 'text-gray-400' : 'text-gray-900'}`}>
                                {getPlaceholderFecha(filtros.fechaDesde)}
                            </span>
                        </div>
                    </div>
                    <div className="w-full">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Fecha Hasta</label>
                        <div className="relative flex items-center">
                            <input type="date" name="fechaHasta" value={filtros.fechaHasta} onChange={handleFiltroChange} disabled={!!filtros.fechaExacta} className={`custom-date-input ${inputBaseClass} relative z-10`} />
                            <span className={`absolute left-[0.75rem] top-1/2 -translate-y-1/2 pointer-events-none z-20 text-sm ${(!!filtros.fechaExacta || !filtros.fechaHasta) ? 'text-gray-400' : 'text-gray-900'}`}>
                                {getPlaceholderFecha(filtros.fechaHasta)}
                            </span>
                        </div>
                    </div>
                    <div className="w-full">
                        <label className="block text-[10px] font-bold text-blue-900 uppercase mb-1">Moneda</label>
                        <select name="moneda" value={filtros.moneda} onChange={handleFiltroChange} className={`border-blue-300 ${inputBaseClass}`}>
                            <option value="">Todas...</option><option value="ARS">ARS</option><option value="USD">USD</option>
                        </select>
                    </div>
                    <div className="w-full">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Monto Exacto</label>
                        <input type="number" name="montoExacto" placeholder="0.00" value={filtros.montoExacto} onChange={handleFiltroChange} disabled={!!filtros.montoMin || !!filtros.montoMax} className={inputBaseClass} />
                    </div>
                    <div className="w-full">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Monto Mínimo</label>
                        <input type="number" name="montoMin" placeholder="0.00" value={filtros.montoMin} onChange={handleFiltroChange} disabled={!!filtros.montoExacto} className={inputBaseClass} />
                    </div>
                    <div className="w-full">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Monto Máximo</label>
                        <input type="number" name="montoMax" placeholder="9999.00" value={filtros.montoMax} onChange={handleFiltroChange} disabled={!!filtros.montoExacto} className={inputBaseClass} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-5 border-t border-gray-100 items-start">
                    <div className="w-full">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tipo de Movimiento</label>
                        <select name="tipo_movimiento" value={filtros.tipo_movimiento} onChange={handleFiltroChange} className={inputBaseClass}>
                            <option value="">Todos...</option><option value="Ingreso">Ingreso</option><option value="Egreso">Egreso</option>
                        </select>
                    </div>
                    <div className="w-full">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tipo de Gasto</label>
                        <select name="categoriaSelect" value={filtros.categoriaSelect} onChange={handleFiltroChange} className={inputBaseClass}>
                            <option value="">Todas...</option><option value="Peaje">Peaje</option><option value="Combustible">Combustible</option><option value="Otros">Otro...</option>
                        </select>
                        {filtros.categoriaSelect === 'Otros' && <input type="text" name="categoriaOtro" placeholder="Especifique texto a buscar..." value={filtros.categoriaOtro} onChange={handleFiltroChange} className={`mt-2 ${inputBaseClass}`} />}
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200">
                    <button onClick={() => setShowFilters(false)} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors">
                        Cerrar
                    </button>
                    <button onClick={() => setShowFilters(false)} className="px-6 py-2.5 bg-blue-950 text-white font-bold rounded-lg hover:bg-blue-900 transition-colors shadow-md">
                        Ver resultados
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

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {showDeleteConfirm && movimientoAEliminar && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-gray-200 p-6 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar Movimiento?</h2>
            <p className="text-sm text-gray-500 mb-6 font-medium">Estás a punto de borrar este registro de forma permanente. Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => { setShowDeleteConfirm(false); setMovimientoAEliminar(null); }}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors flex-1"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button 
                onClick={handleDelete}
                className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex-1 shadow-sm disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Borrando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN */}
      {showEditModal && movimientoAEditar && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in overscroll-none">
            <div className="bg-white w-full max-w-lg rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-2xl max-h-[88vh] overflow-y-auto relative my-auto">
                <button 
                    onClick={closeEditModal}
                    className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 font-bold text-lg transition-colors"
                    title="Cerrar sin aplicar"
                >
                    ✕
                </button>
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-blue-950 flex items-center gap-2">
                        Editar Movimiento
                    </h2>
                </div>

                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Movimiento <span className="text-red-500">*</span></label>
                    <select name="tipoMovimiento" value={editFormData.tipoMovimiento} onChange={handleEditChange} required className={inputBaseClass}>
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
                        value={editFormData.fecha} 
                        onChange={handleEditChange} 
                        required 
                        className={`custom-date-input ${inputBaseClass} relative z-10`} 
                      />
                      <span className="absolute left-[0.75rem] top-1/2 -translate-y-1/2 pointer-events-none z-20 text-gray-900 text-sm">
                        {formatearFechaEs(editFormData.fecha)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Gasto <span className="text-red-500">*</span></label>
                    <select name="tipoGasto" value={editFormData.tipoGasto} onChange={handleEditChange} required className={inputBaseClass}>
                      <option value="">Seleccione...</option>
                      <option value="Peaje">Peaje</option>
                      <option value="Combustible">Combustible</option>
                      <option value="Otros">Otros</option>
                    </select>
                    {editFormData.tipoGasto === "Otros" && (
                      <div className="mt-2">
                        <input type="text" name="tipoGastoOtro" value={editFormData.tipoGastoOtro} onChange={handleEditChange} placeholder="Especifique tipo de gasto..." required className={inputBaseClass} />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Descripción (Opcional)</label>
                    <input type="text" name="descripcion" value={editFormData.descripcion} onChange={handleEditChange} placeholder="Detalle del movimiento..." className={inputBaseClass} />
                  </div>

                  <div className="grid grid-cols-5 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1">Moneda <span className="text-red-500">*</span></label>
                      <select name="moneda" value={editFormData.moneda} onChange={handleEditChange} required className={inputBaseClass}>
                        <option value="">—</option>
                        <option value="ARS">Pesos (ARS)</option>
                        <option value="USD">Dólares (USD)</option>
                      </select>
                    </div>

                    <div className="col-span-3">
                      <label className="block text-xs font-bold text-gray-700 mb-1">Monto <span className="text-red-500">*</span></label>
                      <input type="number" step="0.01" name="monto" value={editFormData.monto} onChange={handleEditChange} placeholder="0.00" required className={`font-bold text-gray-900 ${inputBaseClass}`} />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200">
                      <button type="button" onClick={closeEditModal} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors" disabled={isSubmitting}>
                          Cancelar
                      </button>
                      <button type="submit" className="px-6 py-2.5 bg-blue-950 text-white font-bold rounded-lg hover:bg-blue-900 transition-colors shadow-md disabled:opacity-50" disabled={isSubmitting}>
                          {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                      </button>
                  </div>
                </form>
            </div>
        </div>
      )}

    </main>
  );
}
