import fs from "fs";
import path from "path";

export interface AlertasConfig {
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  emailEnabled: boolean;
  emailsSupervisores: string;
  emailWebhookUrl: string;
  horasAlertaPreventiva: number;
  slaCotizacionHoras: number;
  slaContratoHoras: number;
  slaSeguimientoHoras: number;
  notificarAlAsignar: boolean;
  notificarPorVencer: boolean;
  notificarVencidas: boolean;
}

const DEFAULT_CONFIG: AlertasConfig = {
  telegramEnabled: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID || "",
  emailEnabled: Boolean(process.env.ALERTA_EMAIL_WEBHOOK),
  emailsSupervisores: process.env.EMAILS_SUPERVISORES || "",
  emailWebhookUrl: process.env.ALERTA_EMAIL_WEBHOOK || "",
  horasAlertaPreventiva: 24,
  slaCotizacionHoras: 24,
  slaContratoHoras: 48,
  slaSeguimientoHoras: 24,
  notificarAlAsignar: true,
  notificarPorVencer: true,
  notificarVencidas: true,
};

function getConfigFilePath(): string {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch {
      // Ignorar si el sistema de archivos es de solo lectura
    }
  }
  return path.join(dataDir, "alertas-config.json");
}

export function obtenerConfigAlertas(): AlertasConfig {
  try {
    const filePath = getConfigFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw) as Partial<AlertasConfig>;
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
      };
    }
  } catch (err) {
    console.error("Error leyendo configuración de alertas:", err);
  }
  return DEFAULT_CONFIG;
}

export function guardarConfigAlertas(nuevaConfig: Partial<AlertasConfig>): AlertasConfig {
  const actual = obtenerConfigAlertas();
  const actualizada: AlertasConfig = {
    ...actual,
    ...nuevaConfig,
  };
  try {
    const filePath = getConfigFilePath();
    fs.writeFileSync(filePath, JSON.stringify(actualizada, null, 2), "utf-8");
  } catch (err) {
    console.error("Error guardando configuración de alertas:", err);
  }
  return actualizada;
}

export async function enviarMensajeTelegram(
  mensajeHtml: string,
  overrideToken?: string,
  overrideChatId?: string
): Promise<{ ok: boolean; error?: string }> {
  const config = obtenerConfigAlertas();
  const token = (overrideToken ?? config.telegramBotToken).trim();
  const chatId = (overrideChatId ?? config.telegramChatId).trim();

  if (!token || !chatId) {
    return {
      ok: false,
      error: "Falta configurar el Bot Token o el Chat ID del grupo de Telegram.",
    };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: mensajeHtml,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = (await response.json()) as { ok?: boolean; description?: string };
    if (!response.ok || !data.ok) {
      return {
        ok: false,
        error: data.description || `Error HTTP ${response.status} desde Telegram API`,
      };
    }

    return { ok: true };
  } catch (err: unknown) {
    console.error("Error enviando mensaje a Telegram:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error de red al conectar con Telegram",
    };
  }
}

export async function enviarAlertaEmailWebhook(payload: {
  asunto: string;
  mensaje: string;
  destinatarios?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const config = obtenerConfigAlertas();
  if (!config.emailEnabled || !config.emailWebhookUrl) {
    return { ok: false, error: "Webhook de correo no habilitado." };
  }

  try {
    const response = await fetch(config.emailWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: payload.destinatarios || config.emailsSupervisores,
        subject: payload.asunto,
        message: payload.mensaje,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      return { ok: false, error: `Error HTTP ${response.status} en webhook de correo.` };
    }
    return { ok: true };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error al enviar correo vía webhook",
    };
  }
}

export async function notificarEventoSLA(params: {
  tipoEvento: "asignacion" | "por_vencer" | "vencida";
  empresa: string;
  accion: string;
  originador: string;
  responsable: string;
  emailResponsable?: string | null;
  fechaLimite: Date | null;
  prioridad?: string;
  detalle?: string | null;
}): Promise<void> {
  const config = obtenerConfigAlertas();

  if (params.tipoEvento === "asignacion" && !config.notificarAlAsignar) return;
  if (params.tipoEvento === "por_vencer" && !config.notificarPorVencer) return;
  if (params.tipoEvento === "vencida" && !config.notificarVencidas) return;

  const fechaTexto = params.fechaLimite
    ? new Date(params.fechaLimite).toLocaleString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Sin fecha definida";

  const icono =
    params.tipoEvento === "vencida"
      ? "🚨 <b>[SLA VENCIDO / ATRASADO]</b>"
      : params.tipoEvento === "por_vencer"
      ? "⚠️ <b>[ALERTA PREVENTIVA SLA - POR VENCER]</b>"
      : "📋 <b>[NUEVA ASIGNACIÓN EN FLUJO COMERCIAL]</b>";

  const mensajeTelegram = [
    icono,
    `🏢 <b>Cliente:</b> ${escapeHtml(params.empresa)}`,
    `📌 <b>Compromiso / Hito:</b> ${escapeHtml(params.accion)}`,
    `👤 <b>Solicitado por:</b> ${escapeHtml(params.originador)}`,
    `🎯 <b>Encargado Responsable:</b> ${escapeHtml(params.responsable)}`,
    `⏰ <b>Fecha Límite (SLA):</b> ${fechaTexto}`,
    params.detalle ? `💬 <b>Detalle:</b> ${escapeHtml(params.detalle)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  if (config.telegramEnabled && config.telegramBotToken && config.telegramChatId) {
    await enviarMensajeTelegram(mensajeTelegram);
  }

  if (config.emailEnabled && config.emailWebhookUrl) {
    const destinatarios = [config.emailsSupervisores, params.emailResponsable]
      .filter(Boolean)
      .join(", ");
    await enviarAlertaEmailWebhook({
      asunto: `[Protegius CRM] ${params.tipoEvento.toUpperCase()} - ${params.empresa}: ${params.accion}`,
      mensaje: mensajeTelegram.replace(/<[^>]+>/g, ""),
      destinatarios,
    });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
