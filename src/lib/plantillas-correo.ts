"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { PlantillaCorreo, PLANTILLAS_CORREO_DEFAULT } from "./plantillas-correo-types";

export type { PlantillaCorreo };
export { PLANTILLAS_CORREO_DEFAULT };

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

export async function obtenerPlantillasCorreoAsync(): Promise<PlantillaCorreo[]> {
  try {
    await ensureConfigTable();
    const rows = await prisma.$queryRawUnsafe<Array<{ config_json: string }>>(
      `SELECT config_json FROM crm_system_config WHERE id = 'plantillas_correo' LIMIT 1;`
    );
    if (rows && rows.length > 0 && rows[0].config_json) {
      const parsed = JSON.parse(rows[0].config_json) as PlantillaCorreo[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error leyendo plantillas de correo de la base de datos:", err);
  }
  return PLANTILLAS_CORREO_DEFAULT;
}

export async function guardarPlantillasCorreoAction(
  plantillas: PlantillaCorreo[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await ensureConfigTable();

    const jsonStr = JSON.stringify(plantillas);

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO crm_system_config (id, config_json, updated_at)
      VALUES ('plantillas_correo', $1, NOW())
      ON CONFLICT (id) DO UPDATE
      SET config_json = EXCLUDED.config_json,
          updated_at = NOW();
      `,
      jsonStr
    );

    return { success: true };
  } catch (err) {
    console.error("Error guardando plantillas de correo:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al guardar plantillas",
    };
  }
}

export interface EnviarCorreoClienteInput {
  cuentaId: string;
  destinatarioEmail: string;
  destinatarioNombre?: string;
  asunto: string;
  cuerpoHtml: string;
  personaId?: string;
}

/**
 * Envía un correo al cliente usando Brevo API transaccional (o Webhook n8n como fallback),
 * y registra automáticamente la Actividad en el historial del CRM.
 */
export async function enviarCorreoClienteAction(
  input: EnviarCorreoClienteInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requireAuth();

    const emailDestino = input.destinatarioEmail.trim().toLowerCase();
    if (!emailDestino || !emailDestino.includes("@")) {
      return { success: false, error: "El correo del destinatario es inválido." };
    }

    const brevoApiKey = process.env.BREVO_API_KEY?.trim();
    const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL?.trim() || "contacto@protegius.cl";

    let envioExitoso = false;
    let servicioUsado = "Brevo";

    if (brevoApiKey) {
      // 1. Enviar vía Brevo Transactional Email API v3
      const payload = {
        sender: {
          name: `${currentUser.name} (Protegius)`,
          email: brevoSenderEmail,
        },
        replyTo: {
          name: currentUser.name,
          email: currentUser.email,
        },
        to: [
          {
            email: emailDestino,
            name: input.destinatarioNombre || emailDestino,
          },
        ],
        subject: input.asunto,
        htmlContent: input.cuerpoHtml,
      };

      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error respuesta Brevo API:", errorText);
        return {
          success: false,
          error: `Error al enviar vía Brevo: ${res.statusText}`,
        };
      }
      envioExitoso = true;
    } else {
      // 2. Fallback vía Webhook n8n
      servicioUsado = "n8n Webhook";
      const webhookUrl =
        process.env.ALERTA_EMAIL_WEBHOOK ||
        "https://n8n.capemaxchile.com/webhook/protegius-alertas-sla";

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinatarios: emailDestino,
          asunto: input.asunto,
          mensaje: input.cuerpoHtml.replace(/<[^>]+>/g, " "),
          cuerpoHtml: input.cuerpoHtml,
          responsable: currentUser.name,
          tipoEvento: "correo_cliente",
        }),
      });

      if (!res.ok) {
        return { success: false, error: "Error al enviar correo por el servidor de correo." };
      }
      envioExitoso = true;
    }

    if (envioExitoso) {
      // Registrar la interacción en la ficha de la cuenta
      await prisma.actividad.create({
        data: {
          cuentaId: input.cuentaId,
          personaId: input.personaId || null,
          usuarioId: currentUser.id,
          responsable: currentUser.name,
          tipo: "email",
          descripcion: `[Correo enviado vía ${servicioUsado}] Asunto: "${input.asunto}"\nDestinatario: ${emailDestino}`,
          fechaRealizada: new Date(),
        },
      });

      revalidatePath(`/cuentas/${input.cuentaId}`);
      revalidatePath("/prospeccion");
      revalidatePath("/oportunidades/pipeline");
    }

    return { success: true };
  } catch (err) {
    console.error("Error en enviarCorreoClienteAction:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al procesar el envío de correo.",
    };
  }
}
