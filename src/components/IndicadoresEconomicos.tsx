"use client";

import { useEffect, useState } from "react";
import { IndicadoresData } from "@/app/api/indicadores/route";
import { TrendingUp, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

export function IndicadoresEconomicos() {
  const [data, setData] = useState<IndicadoresData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mostrar, setMostrar] = useState(true);

  async function cargarIndicadores() {
    try {
      setLoading(true);
      const res = await fetch("/api/indicadores");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Mantener estado si falla
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarIndicadores();
    const saved = localStorage.getItem("protegius_mostrar_indicadores");
    if (saved !== null) {
      setMostrar(saved === "true");
    }
  }, []);

  function toggleMostrar() {
    setMostrar((prev) => {
      const nuevo = !prev;
      localStorage.setItem("protegius_mostrar_indicadores", String(nuevo));
      return nuevo;
    });
  }

  function formatearCLP(val?: number) {
    if (!val) return "—";
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: val < 1000 ? 1 : 0,
      maximumFractionDigits: 2,
    }).format(val);
  }

  if (!mostrar) {
    return (
      <div className="bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs transition-colors">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={toggleMostrar}
            className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition font-bold text-[11px] text-left"
            title="Hacer clic para mostrar indicadores económicos completos"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-[10px] uppercase font-bold tracking-tight">Indicadores</span>
            {data?.uf?.valor && (
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-500/20">
                UF: {formatearCLP(data.uf.valor)}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={toggleMostrar}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 transition"
            title="Expandir indicadores"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 space-y-2 text-xs transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-bold tracking-wider uppercase">Indicadores Oficiales</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={cargarIndicadores}
            title="Actualizar valores"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 transition"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={toggleMostrar}
            title="Ocultar panel de indicadores"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 transition"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid 2x2: UF, Dólar, UTM, Euro */}
      <div className="grid grid-cols-2 gap-1.5 text-center">
        {/* 1. UF */}
        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block">UF Diario</span>
          <span className="text-xs font-black text-slate-900 dark:text-white block tracking-tight">
            {data ? formatearCLP(data.uf.valor) : "..."}
          </span>
        </div>

        {/* 2. Dólar */}
        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">Dólar Obs.</span>
          <span className="text-xs font-black text-slate-900 dark:text-white block tracking-tight">
            {data ? formatearCLP(data.dolar.valor) : "..."}
          </span>
        </div>

        {/* 3. UTM */}
        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block">UTM Mensual</span>
          <span className="text-xs font-black text-slate-900 dark:text-white block tracking-tight">
            {data ? formatearCLP(data.utm.valor) : "..."}
          </span>
        </div>

        {/* 4. Euro */}
        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block">Euro</span>
          <span className="text-xs font-black text-slate-900 dark:text-white block tracking-tight">
            {data?.euro ? formatearCLP(data.euro.valor) : "..."}
          </span>
        </div>
      </div>
    </div>
  );
}
