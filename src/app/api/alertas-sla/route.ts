import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerConfigAlertasAsync, enviarMensajeTelegram, enviarAlertaEmailWebhook } from "@/lib/alertas-externas";

export const dynamic = "force-dynamic";

export async function GET() {
  return procesarBarridoSLA();
}

export async function POST() {
  return procesarBarridoSLA();
}

async function procesarBarridoSLA() {
  try {
    const config = await obtenerConfigAlertasAsync();
    const ahora = new Date();
    const limitePreventivo = new Date(
      ahora.getTime() + config.horasAlertaPreventiva * 60 * 60 * 1000
    );

    const tareas = await prisma.tarea.findMany({
      where: {
        estado: "pendiente",
        fechaVencimiento: { lte: limitePreventivo },
      },
      include: {
        cuenta: { select: { razonSocial: true } },
        responsable: { select: { name: true, email: true } },
      },
      orderBy: { fechaVencimiento: "asc" },
    });

    if (tareas.length === 0) {
      return NextResponse.json({
        ok: true,
        alertasDetectadas: 0,
        mensaje: "No hay compromisos vencidos ni por vencer.",
      });
    }

    const vencidas = tareas.filter(
      (t) => t.fechaVencimiento && new Date(t.fechaVencimiento) < ahora
    );
    const porVencer = tareas.filter(
      (t) => t.fechaVencimiento && new Date(t.fechaVencimiento) >= ahora
    );

    const lineas: string[] = [
      "🔔 <b>[AUDITORÍA AUTOMÁTICA SLA - PROTEGIUS CRM]</b>",
      `🚨 <b>Atrasadas / SLA Vencido:</b> ${vencidas.length}`,
      `⚠️ <b>Por vencer (&lt;${config.horasAlertaPreventiva}h):</b> ${porVencer.length}`,
      "",
    ];

    if (vencidas.length > 0) {
      lineas.push("<b>🚨 ESCALAMIENTO SUPERVISORES (ATRASADAS):</b>");
      for (const t of vencidas.slice(0, 12)) {
        lineas.push(
          `• <b>${t.cuenta?.razonSocial || "General"}</b>: ${t.titulo} — Resp: <i>${
            t.responsable?.name || "Sin asignar"
          }</i>`
        );
      }
      lineas.push("");
    }

    if (porVencer.length > 0) {
      lineas.push("<b>⚠️ ALERTA PREVENTIVA (POR VENCER):</b>");
      for (const t of porVencer.slice(0, 12)) {
        lineas.push(
          `• <b>${t.cuenta?.razonSocial || "General"}</b>: ${t.titulo} — Resp: <i>${
            t.responsable?.name || "Sin asignar"
          }</i>`
        );
      }
    }

    const resultados: Record<string, unknown> = {
      vencidas: vencidas.length,
      porVencer: porVencer.length,
    };

    if (config.telegramEnabled && config.telegramBotToken && config.telegramChatId) {
      const tg = await enviarMensajeTelegram(lineas.join("\n"));
      resultados.telegram = tg;
    }

    if (config.emailEnabled && config.emailWebhookUrl) {
      const em = await enviarAlertaEmailWebhook({
        asunto: `[Protegius CRM] Auditoría SLA: ${vencidas.length} atrasadas, ${porVencer.length} por vencer`,
        mensaje: lineas.join("\n").replace(/<[^>]+>/g, ""),
      });
      resultados.email = em;
    }

    return NextResponse.json({
      ok: true,
      ...resultados,
    });
  } catch (err: unknown) {
    console.error("Error en barrido SLA:", err);
    return NextResponse.json(
      { ok: false, error: "Error procesando barrido SLA" },
      { status: 500 }
    );
  }
}
