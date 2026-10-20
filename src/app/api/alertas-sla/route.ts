import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerConfigAlertasAsync, enviarMensajeTelegram, enviarAlertaEmailWebhook } from "@/lib/alertas-externas";
import { sincronizarInteraccionesYTareas } from "@/lib/actions-interacciones";

export const dynamic = "force-dynamic";

export async function GET() {
  return procesarBarridoSLA();
}

export async function POST() {
  return procesarBarridoSLA();
}

async function procesarBarridoSLA() {
  try {
    await sincronizarInteraccionesYTareas();

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
        responsable: { select: { id: true, name: true, email: true } },
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
      for (const t of vencidas.slice(0, 25)) {
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
      for (const t of porVencer.slice(0, 25)) {
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
      // 1. Alertas individuales a cada ejecutivo comercial (sin mezclar con otros)
      const porEjecutivo = new Map<
        string,
        { nombre: string; email: string; tareas: typeof tareas }
      >();

      for (const t of tareas) {
        if (t.responsable?.email) {
          const key = t.responsable.email.toLowerCase();
          const actual = porEjecutivo.get(key) || {
            nombre: t.responsable.name,
            email: t.responsable.email,
            tareas: [],
          };
          actual.tareas.push(t);
          porEjecutivo.set(key, actual);
        }
      }

      let enviadosEjecutivos = 0;
      for (const [, ej] of Array.from(porEjecutivo.entries())) {
        const vencidasEj = ej.tareas.filter(
          (t) => t.fechaVencimiento && new Date(t.fechaVencimiento) < ahora
        );
        const porVencerEj = ej.tareas.filter(
          (t) => t.fechaVencimiento && new Date(t.fechaVencimiento) >= ahora
        );

        const cuerpoEj = [
          `Hola ${ej.nombre},`,
          `Tienes ${ej.tareas.length} compromiso(s) comercial(es) en alerta SLA (${vencidasEj.length} atrasados, ${porVencerEj.length} por vencer):`,
          "",
          ...ej.tareas.map(
            (t) =>
              `• ${t.cuenta?.razonSocial || "General"}: ${t.titulo} (Fecha límite: ${
                t.fechaVencimiento ? new Date(t.fechaVencimiento).toLocaleString("es-CL") : "—"
              })`
          ),
        ].join("\n");

        const resEj = await enviarAlertaEmailWebhook({
          asunto: `[Protegius CRM] Tus Alertas SLA (${vencidasEj.length} atrasadas, ${porVencerEj.length} por vencer) - ${ej.nombre}`,
          mensaje: cuerpoEj,
          destinatarios: ej.email,
          responsable: ej.nombre,
          tipoEvento: "alerta_individual_ejecutivo",
        });
        if (resEj.ok) enviadosEjecutivos++;
      }

      // 2. Consolidado para Supervisores
      const em = await enviarAlertaEmailWebhook({
        asunto: `[Protegius CRM - Supervisores] Auditoría SLA: ${vencidas.length} atrasadas, ${porVencer.length} por vencer`,
        mensaje: lineas.join("\n").replace(/<[^>]+>/g, ""),
        destinatarios: config.emailsSupervisores,
        responsable: "Supervisores",
        tipoEvento: "reporte_consolidado_supervisores",
      });
      resultados.emailSupervisores = em;
      resultados.emailsEjecutivosEnviados = enviadosEjecutivos;
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
