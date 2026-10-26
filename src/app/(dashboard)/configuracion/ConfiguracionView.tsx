"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { AlertasConfig } from "@/lib/alertas-externas";
import {
  guardarConfigAlertasAction,
  probarConexionTelegramAction,
  probarConexionEmailAction,
  detectarChatIdTelegramAction,
  InteraccionActionState,
} from "@/lib/actions-interacciones";
import {
  Settings,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  Mail,
  Shield,
  MessageSquare,
  Clock,
  Sparkles,
} from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
    >
      <Save className="w-4 h-4" />
      <span>{pending ? "Guardando..." : "Guardar Configuración"}</span>
    </button>
  );
}

interface ConfiguracionViewProps {
  config: AlertasConfig;
}

export function ConfiguracionView({ config }: ConfiguracionViewProps) {
  const [botTokenInput, setBotTokenInput] = useState(config.telegramBotToken || "");
  const [chatIdInput, setChatIdInput] = useState(config.telegramChatId || "");
  const [emailsInput, setEmailsInput] = useState(config.emailsSupervisores || "");
  const [webhookInput, setWebhookInput] = useState(config.emailWebhookUrl || "");

  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isTestingTg, setIsTestingTg] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isDetectingChat, setIsDetectingChat] = useState(false);

  const [formState, formAction] = useFormState<InteraccionActionState | null, FormData>(
    async (prev, formData) => {
      const res = await guardarConfigAlertasAction(prev, formData);
      if (res.success) {
        setFeedback({
          ok: true,
          msg: "¡Configuración guardada exitosamente en la base de datos!",
        });
      } else {
        setFeedback({
          ok: false,
          msg: res.error || "No se pudo guardar la configuración.",
        });
      }
      return res;
    },
    null
  );

  const handleProbarTelegram = async () => {
    setIsTestingTg(true);
    setFeedback(null);
    try {
      const res = await probarConexionTelegramAction(botTokenInput, chatIdInput);
      if (res.ok) {
        setFeedback({
          ok: true,
          msg: "✅ ¡Mensaje de prueba enviado exitosamente al grupo de Telegram!",
        });
      } else {
        setFeedback({
          ok: false,
          msg: res.error || "Error al enviar mensaje a Telegram.",
        });
      }
    } finally {
      setIsTestingTg(false);
    }
  };

  const handleProbarEmail = async () => {
    setIsTestingEmail(true);
    setFeedback(null);
    try {
      const res = await probarConexionEmailAction(emailsInput, webhookInput);
      if (res.ok) {
        setFeedback({
          ok: true,
          msg: "✅ ¡Correo de prueba enviado con éxito a los supervisores!",
        });
      } else {
        setFeedback({
          ok: false,
          msg: res.error || "Error al enviar correo de prueba.",
        });
      }
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleAutoDetectarChatId = async () => {
    setIsDetectingChat(true);
    setFeedback(null);
    try {
      const res = await detectarChatIdTelegramAction(botTokenInput);
      if (res.ok && res.chatId) {
        setChatIdInput(res.chatId);
        setFeedback({
          ok: true,
          msg: `¡Grupo detectado: "${res.title}" (ID: ${res.chatId})! Recuerda hacer clic en Guardar Configuración.`,
        });
      } else {
        setFeedback({
          ok: false,
          msg: res.error || "No se pudo detectar el grupo de Telegram.",
        });
      }
    } finally {
      setIsDetectingChat(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Configuración del Sistema
          </h1>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Administración de canales de comunicación externa (Telegram, Correo vía n8n / Brevo) y reglas operativas de SLA.
        </p>
      </div>

      {/* Banner de feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-xs ${
            feedback.ok
              ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
              : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.ok ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tarjeta 1: Telegram Bot */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Canal Telegram (Alertas Instantáneas)
                  </h3>
                  <p className="text-[11px] text-slate-500">Notificaciones automáticas y reporte matutino 09:00</p>
                </div>
              </div>

              <label className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 cursor-pointer">
                <input
                  type="checkbox"
                  name="telegramEnabled"
                  defaultChecked={config.telegramEnabled}
                  className="rounded border-slate-300"
                />
                <span>Habilitar</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Bot Token de Telegram (@BotFather)
              </label>
              <input
                type="text"
                name="telegramBotToken"
                value={botTokenInput}
                onChange={(e) => setBotTokenInput(e.target.value)}
                placeholder="Ej: 7123456789:AAHxyz..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Chat ID del Grupo de Supervisores
                </label>
                <button
                  type="button"
                  disabled={isDetectingChat}
                  onClick={handleAutoDetectarChatId}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isDetectingChat ? "Detectando..." : "Auto-detectar ID"}</span>
                </button>
              </div>
              <input
                type="text"
                name="telegramChatId"
                value={chatIdInput}
                onChange={(e) => setChatIdInput(e.target.value)}
                placeholder="Ej: -1001987654321"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Agrega tu Bot al grupo de Telegram, escribe un mensaje en el grupo (ej: <code>/start</code>) y pulsa <strong>Auto-detectar ID</strong>.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isTestingTg}
                onClick={handleProbarTelegram}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 text-xs font-bold hover:bg-blue-100 transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isTestingTg ? "Enviando prueba..." : "Probar Envío al Grupo Telegram"}</span>
              </button>
            </div>
          </div>

          {/* Tarjeta 2: Canal de Correo */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Canal Correo (n8n Webhook / Brevo)
                  </h3>
                  <p className="text-[11px] text-slate-500">Envío individual a cada ejecutivo y consolidado a supervisión</p>
                </div>
              </div>

              <label className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 cursor-pointer">
                <input
                  type="checkbox"
                  name="emailEnabled"
                  defaultChecked={config.emailEnabled}
                  className="rounded border-slate-300"
                />
                <span>Habilitar</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                URL Webhook n8n para Alertas de Correo
              </label>
              <input
                type="text"
                name="emailWebhookUrl"
                value={webhookInput}
                onChange={(e) => setWebhookInput(e.target.value)}
                placeholder="https://n8n.capemaxchile.com/webhook/protegius-alertas-sla"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Correos de Supervisión (Separados por coma)
              </label>
              <input
                type="text"
                name="emailsSupervisores"
                value={emailsInput}
                onChange={(e) => setEmailsInput(e.target.value)}
                placeholder="gerencia@protegius.cl, comercial@protegius.cl"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Recibirán el consolidado diario general. Los ejecutivos comerciales reciben por separado solo sus propias alertas.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isTestingEmail}
                onClick={handleProbarEmail}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 text-xs font-bold hover:bg-purple-100 transition disabled:opacity-50"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{isTestingEmail ? "Enviando prueba..." : "Probar Envío de Correo Ahora"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tarjeta 3: Reglas de SLA y Exclusión de Administrador */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Tiempos de SLA y Comportamiento de Notificaciones
              </h3>
              <p className="text-[11px] text-slate-500">Parámetros de auditoría preventiva y aislamiento de roles</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Alerta Preventiva (Horas)
              </label>
              <input
                type="number"
                name="horasAlertaPreventiva"
                defaultValue={config.horasAlertaPreventiva}
                min={1}
                max={120}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                SLA Cotización (Horas)
              </label>
              <input
                type="number"
                name="slaCotizacionHoras"
                defaultValue={config.slaCotizacionHoras}
                min={1}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                SLA Contrato (Horas)
              </label>
              <input
                type="number"
                name="slaContratoHoras"
                defaultValue={config.slaContratoHoras}
                min={1}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                SLA Seguimiento (Horas)
              </label>
              <input
                type="number"
                name="slaSeguimientoHoras"
                defaultValue={config.slaSeguimientoHoras}
                min={1}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                name="notificarAlAsignar"
                defaultChecked={config.notificarAlAsignar}
                className="rounded border-slate-300"
              />
              <span>Avisar inmediatamente al responsable cuando se le asigne una tarea o cotización</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                name="notificarPorVencer"
                defaultChecked={config.notificarPorVencer}
                className="rounded border-slate-300"
              />
              <span>Disparar aviso preventivo antes del límite horario del SLA</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                name="notificarVencidas"
                defaultChecked={config.notificarVencidas}
                className="rounded border-slate-300"
              />
              <span>Escalar alertas cuando un compromiso se encuentre con SLA vencido</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white cursor-pointer pt-2 border-t border-slate-100 dark:border-slate-800">
              <input
                type="checkbox"
                name="excluirAdminDeAlertas"
                defaultChecked={config.excluirAdminDeAlertas ?? true}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <Shield className="w-4 h-4" />
                <span>Excluir al Administrador de alertas operativas (solo administra el sistema)</span>
              </span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
