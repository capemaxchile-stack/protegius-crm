import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface PlantillaCorreo {
  id: string;
  nombre: string;
  asunto: string;
  cuerpo: string;
  descripcion: string;
}

export const PLANTILLAS_CORREO_DEFAULT: PlantillaCorreo[] = [
  {
    id: "presentacion",
    nombre: "Presentación de Servicios Protegius",
    asunto: "Presentación de Soluciones Corporativas — Protegius & {{razonSocial}}",
    descripcion: "Presentación inicial de servicios, plataforma de monitoreo y soporte.",
    cuerpo: `<p>Estimado/a <strong>{{contacto}}</strong>,</p>

<p>Junto con saludar, te escribo en representación de <strong>Protegius</strong> para compartir contigo información detallada sobre nuestras soluciones de monitoreo y gestión comercial diseñadas para potenciar la operación de <strong>{{razonSocial}}</strong>.</p>

<p>En Protegius nos especializamos en brindar herramientas de alta disponibilidad y soporte continuo que optimizan el rendimiento y la seguridad operativa de nuestros clientes.</p>

<p>Quedo a tu entera disposición para coordinar una breve reunión demostrativa o resolver cualquier inquietud.</p>

<p>Saludos cordiales,</p>

<p>--<br>
<strong>{{ejecutivoNombre}}</strong><br>
{{ejecutivoCargo}}<br>
Protegius<br>
✉️ {{ejecutivoEmail}}<br>
📞 {{ejecutivoTelefono}}</p>`,
  },
  {
    id: "cotizacion",
    nombre: "Envío de Cotización / Propuesta en UF",
    asunto: "Propuesta Comercial Protegius — {{razonSocial}}",
    descripcion: "Envío formal de propuesta comercial en UF con detalle de planes.",
    cuerpo: `<p>Estimado/a <strong>{{contacto}}</strong>,</p>

<p>Es un gusto saludarte. En seguimiento a nuestras conversaciones, adjunto y detallo la propuesta comercial formal preparada especialmente para <strong>{{razonSocial}}</strong>.</p>

<p>Nuestra propuesta incluye las condiciones de servicio, valores en UF garantizados y los plazos de activación para asegurar un inicio ágil y sin fricciones.</p>

<p>Puedes revisar los antecedentes y hacerme llegar cualquier consulta sobre los planes y opciones de implementación.</p>

<p>Atentamente,</p>

<p>--<br>
<strong>{{ejecutivoNombre}}</strong><br>
{{ejecutivoCargo}}<br>
Protegius<br>
✉️ {{ejecutivoEmail}}<br>
📞 {{ejecutivoTelefono}}</p>`,
  },
  {
    id: "reunion",
    nombre: "Coordinación / Minuta de Reunión",
    asunto: "Coordinación de Reunión Comercial — Protegius y {{razonSocial}}",
    descripcion: "Confirmación de fecha, hora o acuerdos de reunión comercial.",
    cuerpo: `<p>Hola <strong>{{contacto}}</strong>,</p>

<p>Agradeciendo de antemano tu tiempo, te escribo para confirmar los detalles de nuestra reunión comercial agendada.</p>

<p>El objetivo de la sesión será revisar en detalle los requerimientos de <strong>{{razonSocial}}</strong> y definir el alcance de los servicios que mejor se adapten a sus necesidades.</p>

<p>Si requieres sumar a más personas del equipo o necesitas reprogramar la sesión, no dudes en avisarme.</p>

<p>Saludos cordiales,</p>

<p>--<br>
<strong>{{ejecutivoNombre}}</strong><br>
{{ejecutivoCargo}}<br>
Protegius<br>
✉️ {{ejecutivoEmail}}<br>
📞 {{ejecutivoTelefono}}</p>`,
  },
  {
    id: "seguimiento",
    nombre: "Seguimiento Comercial",
    asunto: "Seguimiento a Propuesta Protegius — {{razonSocial}}",
    descripcion: "Seguimiento periódico a propuestas enviadas o conversaciones previas.",
    cuerpo: `<p>Estimado/a <strong>{{contacto}}</strong>,</p>

<p>Espero que estés teniendo una excelente semana. Te escribo para hacer un breve seguimiento respecto a la propuesta enviada recientemente a <strong>{{razonSocial}}</strong>.</p>

<p>¿Pudieron revisar los antecedentes con el equipo? Me gustaría saber si tienen alguna consulta o si podemos agendar una llamada rápida para aclarar dudas.</p>

<p>Quedo atento a tus comentarios.</p>

<p>Saludos cordiales,</p>

<p>--<br>
<strong>{{ejecutivoNombre}}</strong><br>
{{ejecutivoCargo}}<br>
Protegius<br>
✉️ {{ejecutivoEmail}}<br>
📞 {{ejecutivoTelefono}}</p>`,
  },
];

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
    const brevoSenderName = process.env.BREVO_SENDER_NAME?.trim() || "Protegius CRM";

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
