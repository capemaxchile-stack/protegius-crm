import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

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
  excluirAdminDeAlertas: boolean;
  rolesNotificados: string[];
}

const DEFAULT_CONFIG: AlertasConfig = {
  telegramEnabled: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID || "",
  emailEnabled: true,
  emailsSupervisores: process.env.EMAILS_SUPERVISORES || "capemaxchile@gmail.com",
  emailWebhookUrl:
    process.env.ALERTA_EMAIL_WEBHOOK ||
    "https://n8n.capemaxchile.com/webhook/protegius-alertas-sla",
  horasAlertaPreventiva: 24,
  slaCotizacionHoras: 24,
  slaContratoHoras: 48,
  slaSeguimientoHoras: 24,
  notificarAlAsignar: true,
  notificarPorVencer: true,
  notificarVencidas: true,
  excluirAdminDeAlertas: true,
  rolesNotificados: ["GERENTE_COMERCIAL", "GERENTE_GENERAL", "COMERCIAL"],
};

function getConfigFilePath(): string {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch {
      // Ignorar si es de solo lectura
    }
  }
  return path.join(dataDir, "alertas-config.json");
}

async function ensureConfigTable(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS crm_system_config (
        id TEXT PRIMARY KEY,
        config_json TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
  } catch (err) {
    console.error("Error asegurando tabla crm_system_config:", err);
  }
}

export async function obtenerConfigAlertasAsync(): Promise<AlertasConfig> {
  try {
    await ensureConfigTable();
    const rows = await prisma.$queryRawUnsafe<Array<{ config_json: string }>>(
      `SELECT config_json FROM crm_system_config WHERE id = 'alertas_sla' LIMIT 1;`
    );
    if (rows && rows.length > 0 && rows[0].config_json) {
      const parsed = JSON.parse(rows[0].config_json) as Partial<AlertasConfig>;
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
      };
    }
  } catch (err) {
    console.error("Fallback a archivo local para alertas-config:", err);
  }

  return obtenerConfigAlertas();
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

export async function guardarConfigAlertasAsync(
  nuevaConfig: Partial<AlertasConfig>
): Promise<AlertasConfig> {
  const actual = await obtenerConfigAlertasAsync();
  const actualizada: AlertasConfig = {
    ...actual,
    ...nuevaConfig,
  };

  const jsonStr = JSON.stringify(actualizada, null, 2);

  // 1. Guardar en PostgreSQL (persistente ante reinicios/redeploys de Coolify)
  try {
    await ensureConfigTable();
    await prisma.$executeRawUnsafe(
      `INSERT INTO crm_system_config (id, config_json, updated_at)
       VALUES ('alertas_sla', $1, NOW())
       ON CONFLICT (id) DO UPDATE SET config_json = EXCLUDED.config_json, updated_at = NOW();`,
      jsonStr
    );
  } catch (err) {
    console.error("Error guardando configuración en PostgreSQL:", err);
  }

  // 2. Guardar también en archivo local como caché rápida
  try {
    const filePath = getConfigFilePath();
    fs.writeFileSync(filePath, jsonStr, "utf-8");
  } catch (err) {
    console.error("Error guardando configuración local:", err);
  }

  return actualizada;
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
  const config = await obtenerConfigAlertasAsync();
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

export async function enviarAlertaEmailWebhook(
  payload: {
    asunto: string;
    mensaje: string;
    destinatarios?: string;
    empresa?: string;
    accion?: string;
    responsable?: string;
    originador?: string;
    fechaLimite?: string;
    tipoEvento?: string;
  },
  overrideWebhookUrl?: string
): Promise<{ ok: boolean; error?: string }> {
  const config = await obtenerConfigAlertasAsync();
  const webhookUrl = (overrideWebhookUrl ?? config.emailWebhookUrl).trim();
  if (!webhookUrl) {
    return { ok: false, error: "Falta configurar la URL del Webhook de correo (n8n)." };
  }

  const destinatariosFinal = (payload.destinatarios ?? config.emailsSupervisores).trim();
  if (!destinatariosFinal) {
    return { ok: false, error: "Falta indicar al menos un correo destinatario." };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: destinatariosFinal,
        subject: payload.asunto,
        message: payload.mensaje,
        empresa: payload.empresa || "",
        accion: payload.accion || "",
        responsable: payload.responsable || "",
        originador: payload.originador || "",
        fechaLimite: payload.fechaLimite || "",
        tipoEvento: payload.tipoEvento || "alerta_sla",
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      return { ok: false, error: `Error HTTP ${response.status} en webhook n8n.` };
    }
    return { ok: true };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error al enviar correo vía webhook n8n",
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
  const config = await obtenerConfigAlertasAsync();

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
      empresa: params.empresa,
      accion: params.accion,
      responsable: params.responsable,
      originador: params.originador,
      fechaLimite: fechaTexto,
      tipoEvento: params.tipoEvento,
    });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
