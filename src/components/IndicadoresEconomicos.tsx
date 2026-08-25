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
      // Ignorar error y mantener estado
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
    <div className="bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl p-2.5 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-400 light:text-slate-600">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-semibold tracking-wider uppercase">Indicadores Diarios</span>
        </div>
        <button
          type="button"
          onClick={cargarIndicadores}
          title="Actualizar valores"
          className="text-slate-500 hover:text-slate-300 p-0.5"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-center">
        {/* UF */}
        <div className="p-1.5 rounded-lg bg-slate-900/80 dark:bg-slate-900/80 light:bg-white border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
          <span className="text-[10px] font-bold text-amber-400 block">UF</span>
          <span className="text-[11px] font-extrabold text-white dark:text-white light:text-slate-900 block truncate">
            {data ? formatearCLP(data.uf.valor) : "..."}
          </span>
        </div>

        {/* Dólar */}
        <div className="p-1.5 rounded-lg bg-slate-900/80 dark:bg-slate-900/80 light:bg-white border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
          <span className="text-[10px] font-bold text-emerald-400 block">Dólar</span>
          <span className="text-[11px] font-extrabold text-white dark:text-white light:text-slate-900 block truncate">
            {data ? formatearCLP(data.dolar.valor) : "..."}
          </span>
        </div>

        {/* UTM */}
        <div className="p-1.5 rounded-lg bg-slate-900/80 dark:bg-slate-900/80 light:bg-white border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
          <span className="text-[10px] font-bold text-blue-400 block">UTM</span>
          <span className="text-[11px] font-extrabold text-white dark:text-white light:text-slate-900 block truncate">
            {data ? formatearCLP(data.utm.valor) : "..."}
          </span>
        </div>
      </div>
    </div>
  );
}
