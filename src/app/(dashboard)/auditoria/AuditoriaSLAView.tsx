"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ejecutarBarridoAlertasSLAAction,
} from "@/lib/actions-interacciones";
import { completarTareaNotificacionAction } from "@/lib/actions-notificaciones";
import type { AlertasConfig } from "@/lib/alertas-externas";
import { formatearFechaHora } from "@/lib/constants";
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Settings,
  BellRing,
  ArrowRight,
  UserCheck,
  Building2,
} from "lucide-react";

export interface ItemAuditoriaSLA {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: string;
  estado: string;
  prioridad: string;
  fechaCreacion: Date | string;
  fechaVencimiento: Date | string | null;
  completadaEn: Date | string | null;
  originador: string;
  responsable: {
    id: string;
    name: string;
    email: string;
  } | null;
  cuenta: {
    id: string;
    razonSocial: string;
  } | null;
  estadoSLA: "vencida" | "por_vencer" | "en_plazo" | "realizada";
  horasRestantes: number | null;
}

interface AuditoriaSLAViewProps {
  items: ItemAuditoriaSLA[];
  usuarios: { id: string; name: string }[];
  config: AlertasConfig;
  isAdmin: boolean;
}

export function AuditoriaSLAView({
  items,
  usuarios,
  config,
  isAdmin,
}: AuditoriaSLAViewProps) {
  const [filtroSLA, setFiltroSLA] = useState<"todos" | "vencida" | "por_vencer" | "en_plazo" | "realizada">("todos");
  const [filtroResponsable, setFiltroResponsable] = useState<string>("todos");
  const [feedbackBot, setFeedbackBot] = useState<{ ok?: boolean; msg?: string } | null>(null);
  const [enviandoBot, setEnviandoBot] = useState(false);

  const itemsFiltrados = useMemo(() => {
    return items.filter((item) => {
      if (filtroSLA !== "todos" && item.estadoSLA !== filtroSLA) return false;
      if (filtroResponsable !== "todos" && item.responsable?.id !== filtroResponsable) return false;
      return true;
    });
  }, [items, filtroSLA, filtroResponsable]);

  const totalVencidas = items.filter((i) => i.estadoSLA === "vencida").length;
  const totalPorVencer = items.filter((i) => i.estadoSLA === "por_vencer").length;
  const totalEnPlazo = items.filter((i) => i.estadoSLA === "en_plazo").length;
  const totalRealizadas = items.filter((i) => i.estadoSLA === "realizada").length;

  const handleEnviarBarridoSLA = async () => {
    setEnviandoBot(true);
    setFeedbackBot(null);
    try {
      const res = await ejecutarBarridoAlertasSLAAction();
      if (res.ok) {
        setFeedbackBot({
          ok: true,
          msg:
            res.enviadas > 0
              ? `¡Reporte enviado (${res.detalles || "Telegram / Correo"}) con ${res.enviadas} alertas activas!`
              : "No hay compromisos vencidos ni próximos a vencer en este momento.",
        });
      } else {
        setFeedbackBot({
          ok: false,
          msg: res.error || "Error al enviar reporte de alertas.",
        });
      }
    } finally {
      setEnviandoBot(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards de Supervisión */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setFiltroSLA("vencida")}
          className={`text-left p-4 rounded-2xl border transition shadow-sm flex items-center gap-3.5 ${
            filtroSLA === "vencida"
              ? "bg-rose-600 text-white border-rose-600"
              : "bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-500/30 hover:border-rose-400"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              filtroSLA === "vencida"
                ? "bg-white/20 text-white"
                : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span
              className={`text-[11px] block font-bold uppercase ${
                filtroSLA === "vencida" ? "text-rose-100" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              SLA Vencido / Atrasadas
            </span>
            <span className="text-2xl font-black">{totalVencidas}</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFiltroSLA("por_vencer")}
          className={`text-left p-4 rounded-2xl border transition shadow-sm flex items-center gap-3.5 ${
            filtroSLA === "por_vencer"
              ? "bg-amber-500 text-white border-amber-500"
              : "bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-500/30 hover:border-amber-400"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              filtroSLA === "por_vencer"
                ? "bg-white/20 text-white"
                : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span
              className={`text-[11px] block font-bold uppercase ${
                filtroSLA === "por_vencer" ? "text-amber-100" : "text-amber-600 dark:text-amber-400"
              }`}
            >
              Por Vencer (&lt;{config.horasAlertaPreventiva}h)
            </span>
            <span className="text-2xl font-black">{totalPorVencer}</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFiltroSLA("en_plazo")}
          className={`text-left p-4 rounded-2xl border transition shadow-sm flex items-center gap-3.5 ${
            filtroSLA === "en_plazo"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              filtroSLA === "en_plazo"
                ? "bg-white/20 text-white"
                : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span
              className={`text-[11px] block font-bold uppercase ${
                filtroSLA === "en_plazo" ? "text-blue-100" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              En Plazo (SLA OK)
            </span>
            <span className="text-2xl font-black">{totalEnPlazo}</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFiltroSLA("realizada")}
          className={`text-left p-4 rounded-2xl border transition shadow-sm flex items-center gap-3.5 ${
            filtroSLA === "realizada"
              ? "bg-emerald-600 text-white border-emerald-600"
              : "bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-400"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              filtroSLA === "realizada"
                ? "bg-white/20 text-white"
                : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span
              className={`text-[11px] block font-bold uppercase ${
                filtroSLA === "realizada" ? "text-emerald-100" : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              ✓ Realizadas / Cumplidas
            </span>
            <span className="text-2xl font-black">{totalRealizadas}</span>
          </div>
        </button>
      </div>

      {/* Barra de controles, envío de alerta a Telegram y Config */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltroSLA("todos")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filtroSLA === "todos"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            Ver Todos ({items.length})
          </button>

          {isAdmin && (
            <select
              value={filtroResponsable}
              onChange={(e) => setFiltroResponsable(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="todos">Todos los Responsables</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  Encargado: {u.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={enviandoBot}
            onClick={handleEnviarBarridoSLA}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>
              {enviandoBot
                ? "Enviando..."
                : isAdmin
                ? "Alertar SLA (Telegram + Correo)"
                : "Enviar Mis Alertas por Correo"}
            </span>
          </button>

          {isAdmin && (
            <Link
              href="/configuracion?tab=canales"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition"
            >
              <Settings className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>⚙️ Configuración Canales</span>
            </Link>
          )}
        </div>
      </div>

      {/* Feedback de envío a Telegram */}
      {feedbackBot && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between ${
            feedbackBot.ok
              ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
              : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400"
          }`}
        >
          <span>{feedbackBot.msg}</span>
          <button type="button" onClick={() => setFeedbackBot(null)} className="text-[11px] underline">
            Cerrar
          </button>
        </div>
      )}





      {/* Tabla de Flujo de Responsables y Auditoría SLA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Estado SLA</th>
                <th className="py-3.5 px-4">Cliente / Empresa</th>
                <th className="py-3.5 px-4">Compromiso / Hito Comercial</th>
                <th className="py-3.5 px-4">Flujo (Solicitante → Encargado)</th>
                <th className="py-3.5 px-4">Fecha Límite (SLA)</th>
                <th className="py-3.5 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {itemsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No hay compromisos en este filtro.
                  </td>
                </tr>
              ) : (
                itemsFiltrados.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                      item.estadoSLA === "vencida"
                        ? "bg-rose-50/30 dark:bg-rose-950/15"
                        : item.estadoSLA === "realizada"
                        ? "bg-emerald-50/20 dark:bg-emerald-950/10"
                        : ""
                    }`}
                  >
                    {/* 1. Semáforo SLA */}
                    <td className="py-3.5 px-4">
                      {item.estadoSLA === "realizada" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 text-[10px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>✓ Realizada</span>
                        </span>
                      ) : item.estadoSLA === "vencida" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 text-[10px] font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>
                            🚨 Atrasada{" "}
                            {item.horasRestantes !== null
                              ? `(${Math.abs(item.horasRestantes)}h)`
                              : ""}
                          </span>
                        </span>
                      ) : item.estadoSLA === "por_vencer" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 text-[10px] font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            ⚠️ Vence en {item.horasRestantes}h
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 text-[10px] font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>En Plazo</span>
                        </span>
                      )}
                    </td>

                    {/* 2. Empresa */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {item.cuenta ? (
                        <Link
                          href={`/cuentas/${item.cuenta.id}`}
                          className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.cuenta.razonSocial}</span>
                        </Link>
                      ) : (
                        <span className="text-slate-400">General</span>
                      )}
                    </td>

                    {/* 3. Compromiso */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p
                        className={`font-bold ${
                          item.estadoSLA === "realizada"
                            ? "line-through text-slate-500"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {item.titulo}
                      </p>
                      {item.descripcion && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {item.descripcion}
                        </p>
                      )}
                    </td>

                    {/* 4. Flujo Solicitante -> Encargado */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                          {item.originador}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-500/20">
                          <UserCheck className="w-3 h-3" />
                          <span>{item.responsable?.name || "Sin asignar"}</span>
                        </span>
                      </div>
                    </td>

                    {/* 5. Fecha Límite SLA */}
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {item.fechaVencimiento ? (
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {formatearFechaHora(item.fechaVencimiento)}
                          </span>
                          {item.completadaEn && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
                              Cumplido: {formatearFechaHora(item.completadaEn)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">Sin fecha límite</span>
                      )}
                    </td>

                    {/* 6. Acción */}
                    <td className="py-3.5 px-4 text-right">
                      {item.estadoSLA !== "realizada" ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await completarTareaNotificacionAction(item.id);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Marcar Realizada</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          ✓ Completada
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
