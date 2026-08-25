"use client";

import { useEffect, useState } from "react";
import { IndicadoresData } from "@/app/api/indicadores/route";
import { TrendingUp, RefreshCw } from "lucide-react";

export function IndicadoresEconomicos() {
  const [data, setData] = useState<IndicadoresData | null>(null);
  const [loading, setLoading] = useState(true);

  async function cargarIndicadores() {
    try {
      setLoading(true);
      const res = await fetch("/api/indicadores");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Mantener estado si falla la red
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarIndicadores();
  }, []);

  function formatearCLP(val?: number) {
    if (!val) return "—";
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: val < 1000 ? 1 : 0,
      maximumFractionDigits: 2,
    }).format(val);
  }

  return (
    <div className="bg-slate-950/60 dark:bg-slate-950/60 bg-slate-100 border border-slate-800 dark:border-slate-800 border-slate-200 rounded-xl p-2.5 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-400 text-slate-600">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[11px] font-bold tracking-wider uppercase">Indicadores Oficiales</span>
        </div>
        <button
          type="button"
          onClick={cargarIndicadores}
          title="Actualizar indicadores"
          className="text-slate-400 hover:text-slate-200 p-0.5 transition"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Grid 2x2 para que los números quepan holgados y completos */}
      <div className="grid grid-cols-2 gap-1.5 text-center">
        {/* 1. UF */}
        <div className="p-2 rounded-lg bg-slate-900/90 dark:bg-slate-900/90 bg-white border border-slate-800/80 dark:border-slate-800/80 border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 block">UF Diario</span>
          <span className="text-xs font-black text-white dark:text-white text-slate-900 block tracking-tight">
            {data ? formatearCLP(data.uf.valor) : "..."}
          </span>
        </div>

        {/* 2. Dólar */}
        <div className="p-2 rounded-lg bg-slate-900/90 dark:bg-slate-900/90 bg-white border border-slate-800/80 dark:border-slate-800/80 border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">Dólar Obs.</span>
          <span className="text-xs font-black text-white dark:text-white text-slate-900 block tracking-tight">
            {data ? formatearCLP(data.dolar.valor) : "..."}
          </span>
        </div>

        {/* 3. UTM */}
        <div className="p-2 rounded-lg bg-slate-900/90 dark:bg-slate-900/90 bg-white border border-slate-800/80 dark:border-slate-800/80 border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block">UTM Mensual</span>
          <span className="text-xs font-black text-white dark:text-white text-slate-900 block tracking-tight">
            {data ? formatearCLP(data.utm.valor) : "..."}
          </span>
        </div>

        {/* 4. Euro */}
        <div className="p-2 rounded-lg bg-slate-900/90 dark:bg-slate-900/90 bg-white border border-slate-800/80 dark:border-slate-800/80 border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block">Euro</span>
          <span className="text-xs font-black text-white dark:text-white text-slate-900 block tracking-tight">
            {data?.euro ? formatearCLP(data.euro.valor) : "..."}
          </span>
        </div>
      </div>
    </div>
  );
}
