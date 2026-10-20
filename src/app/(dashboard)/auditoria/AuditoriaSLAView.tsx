"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import {
  guardarConfigAlertasAction,
  probarConexionTelegramAction,
  ejecutarBarridoAlertasSLAAction,
  InteraccionActionState,
} from "@/lib/actions-interacciones";
import { completarTareaNotificacionAction } from "@/lib/actions-notificaciones";
import { AlertasConfig } from "@/lib/alertas-externas";
import { formatearFechaHora } from "@/lib/constants";
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Send,
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

function SaveConfigButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
    >
      {pending ? "Guardando..." : "Guardar Configuración SLA & Bot"}
    </button>
  );
}

export function AuditoriaSLAView({
  items,
  usuarios,
  config,
  isAdmin,
}: AuditoriaSLAViewProps) {
  const [filtroSLA, setFiltroSLA] = useState<"todos" | "vencida" | "por_vencer" | "en_plazo" | "realizada">("todos");
  const [filtroResponsable, setFiltroResponsable] = useState<string>("todos");
  const [mostrarConfig, setMostrarConfig] = useState(false);

  const [botTokenInput, setBotTokenInput] = useState(config.telegramBotToken);
  const [chatIdInput, setChatIdInput] = useState(config.telegramChatId);
  const [feedbackBot, setFeedbackBot] = useState<{ ok?: boolean; msg?: string } | null>(null);
  const [enviandoBot, setEnviandoBot] = useState(false);

  const [configState, configAction] = useFormState<InteraccionActionState | null, FormData>(
    guardarConfigAlertasAction,
    null
  );

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

  const handleProbarTelegram = async () => {
    setEnviandoBot(true);
    setFeedbackBot(null);
    try {
      const res = await probarConexionTelegramAction(botTokenInput, chatIdInput);
      if (res.ok) {
        setFeedbackBot({
          ok: true,
          msg: "¡Mensaje de prueba enviado con éxito al grupo de Telegram!",
        });
      } else {
        setFeedbackBot({
          ok: false,
          msg: res.error || "No se pudo conectar con Telegram.",
        });
      }
    } finally {
      setEnviandoBot(false);
    }
  };

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
              ? `¡Reporte enviado al grupo de Telegram con ${res.enviadas} alertas activas!`
              : "No hay compromisos vencidos ni próximos a vencer en este momento.",
        });
      } else {
        setFeedbackBot({
          ok: false,
          msg: res.error || "Error al enviar reporte a Telegram.",
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
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={enviandoBot}
            onClick={handleEnviarBarridoSLA}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>{enviandoBot ? "Enviando..." : "Alertar SLA a Grupo Telegram"}</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setMostrarConfig(!mostrarConfig)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configurar Bot Telegram / Correo</span>
            </button>
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

      {/* Panel de Configuración de Telegram Bot + Correo + Reglas SLA (Solo Admin) */}
      {isAdmin && mostrarConfig && (
        <div className="bg-white dark:bg-slate-900 border-2 border-blue-500/30 rounded-2xl p-6 shadow-lg space-y-5 animate-in fade-in duration-150">
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Configuración de Alertas por Telegram (Bot + Grupo) y Correo</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Conecta un Bot de Telegram a tu grupo de Supervisores/Comercial para recibir alertas automáticas cuando se solicita una cotización, está por vencer o se atrasa.
              </p>
            </div>
          </div>

          {configState?.message && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
              {configState.message}
            </div>
          )}

          <form action={configAction} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Columna 1: Telegram Bot */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    🤖 Bot de Telegram & Grupo de Alertas
                  </span>
                  <label className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 cursor-pointer">
                    <input
                      type="checkbox"
                      name="telegramEnabled"
                      defaultChecked={config.telegramEnabled}
                      className="rounded border-slate-300"
                    />
                    <span>Habilitar Telegram</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telegram Bot Token (entregado por @BotFather)
                  </label>
                  <input
                    type="text"
                    name="telegramBotToken"
                    value={botTokenInput}
                    onChange={(e) => setBotTokenInput(e.target.value)}
                    placeholder="Ej: 7123456789:AAHxyz..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Chat ID del Grupo o Canal de Supervisores
                  </label>
                  <input
                    type="text"
                    name="telegramChatId"
                    value={chatIdInput}
                    onChange={(e) => setChatIdInput(e.target.value)}
                    placeholder="Ej: -1001987654321"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Tip: Crea el bot en <strong>@BotFather</strong>, agrégalo a tu grupo de Telegram y usa el botón de abajo para probar el envío.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={enviandoBot}
                  onClick={handleProbarTelegram}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 text-xs font-bold hover:bg-blue-100 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Probar Mensaje al Grupo Ahora</span>
                </button>
              </div>

              {/* Columna 2: Reglas SLA y Correo */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  ⏱️ Tiempos SLA y Alertas Automáticas
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Alerta Preventiva (Horas antes)
                    </label>
                    <input
                      type="number"
                      name="horasAlertaPreventiva"
                      defaultValue={config.horasAlertaPreventiva}
                      min={1}
                      max={120}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      SLA Cotización (Horas)
                    </label>
                    <input
                      type="number"
                      name="slaCotizacionHoras"
                      defaultValue={config.slaCotizacionHoras}
                      min={1}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      name="notificarAlAsignar"
                      defaultChecked={config.notificarAlAsignar}
                    />
                    <span>Avisar al grupo inmediatamente cuando se asigne una cotización/compromiso</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      name="notificarPorVencer"
                      defaultChecked={config.notificarPorVencer}
                    />
                    <span>Avisar cuando una fecha límite esté por vencer</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      name="notificarVencidas"
                      defaultChecked={config.notificarVencidas}
                    />
                    <span>Escalar a supervisores cuando el SLA esté vencido</span>
                  </label>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      ✉️ Alertas por Correo (Webhook / n8n / SMTP)
                    </span>
                    <input
                      type="checkbox"
                      name="emailEnabled"
                      defaultChecked={config.emailEnabled}
                    />
                  </div>
                  <input
                    type="text"
                    name="emailsSupervisores"
                    defaultValue={config.emailsSupervisores}
                    placeholder="Correos supervisores (separados por coma)"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    name="emailWebhookUrl"
                    defaultValue={config.emailWebhookUrl}
                    placeholder="URL Webhook de Correo (ej. n8n / Make / Resend)"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMostrarConfig(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Cerrar
              </button>
              <SaveConfigButton />
            </div>
          </form>
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
