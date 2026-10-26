"use server";

import { requireAuth, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  obtenerConfigAlertasAsync,
  guardarConfigAlertasAsync,
  enviarMensajeTelegram,
  enviarAlertaEmailWebhook,
  notificarEventoSLA,
  AlertasConfig,
} from "@/lib/alertas-externas";

export interface InteraccionActionState {
  error?: string;
  success?: boolean;
  message?: string;
}

/**
 * Registra una acción rápida desde el Centro de Prospección o Ficha de Cuenta
 * con soporte para delegación de responsable (flujo Vendedor -> Encargado) y SLA.
 */
export async function registrarAccionFlujoAction(
  prevState: InteraccionActionState | null,
  formData: FormData
): Promise<InteraccionActionState> {
  const currentUser = await requireAuth();

  const cuentaId = formData.get("cuentaId")?.toString().trim();
  const oportunidadId = formData.get("oportunidadId")?.toString().trim() || null;
  const personaId = formData.get("personaId")?.toString().trim() || null;
  const tipo = formData.get("tipo")?.toString().trim() || "whatsapp";
  const descripcion = formData.get("descripcion")?.toString().trim() || "";

  // Estado inicial de esta acción ("pendiente" o "hecho")
  const requiereCompromiso = formData.get("requiereCompromiso") === "si";
  const hitoFlujo = formData.get("hitoFlujo")?.toString().trim() || "seguimiento";
  const proximoPaso = formData.get("proximoPaso")?.toString().trim() || "";
  const encargadoId = formData.get("encargadoId")?.toString().trim() || currentUser.id;
  const fechaLimite = formData.get("fechaLimite")?.toString().trim() || "";
  const horaLimite = formData.get("horaLimite")?.toString().trim() || "18:00";
  const prioridad = formData.get("prioridad")?.toString().trim() || "alta";

  if (!cuentaId) {
    return { error: "Falta identificar la cuenta o prospecto." };
  }

  if (!descripcion) {
    return { error: "Debes ingresar el detalle de la acción o gestión." };
  }

  if (requiereCompromiso && !proximoPaso) {
    return { error: "Debes indicar cuál es el compromiso o acción pendiente a realizar." };
  }

  try {
    const [cuenta, encargadoUser] = await Promise.all([
      prisma.cuenta.findUnique({ where: { id: cuentaId } }),
      prisma.user.findUnique({ where: { id: encargadoId } }),
    ]);

    if (!cuenta) {
      return { error: "No se encontró la empresa seleccionada." };
    }

    const nombreEncargado = encargadoUser?.name || currentUser.name;
    const fechaHoraSLA =
      requiereCompromiso && fechaLimite
        ? new Date(`${fechaLimite}T${horaLimite}:00`)
        : null;

    const textoProximoPaso = requiereCompromiso
      ? `${proximoPaso} [Resp: ${nombreEncargado}]`
      : null;

    await prisma.$transaction(async (tx) => {
      const act = await tx.actividad.create({
        data: {
          cuentaId,
          oportunidadId,
          personaId,
          usuarioId: currentUser.id,
          responsable: currentUser.name,
          tipo,
          descripcion,
          fechaRealizada: new Date(),
          proximoPaso: textoProximoPaso,
          fechaProximoPaso: fechaHoraSLA,
          estadoPaso: requiereCompromiso ? "pendiente" : "hecho",
        },
      });

      if (requiereCompromiso) {
        await tx.tarea.create({
          data: {
            titulo: proximoPaso,
            descripcion: `Originado por ${currentUser.name}: ${descripcion}`,
            tipo: hitoFlujo,
            prioridad,
            estado: "pendiente",
            fechaVencimiento: fechaHoraSLA,
            etapaRelacionada: `ORIGEN:${currentUser.name}|ACT:${act.id}`,
            cuentaId,
            oportunidadId,
            personaId,
            responsableId: encargadoId,
          },
        });

        // Actualizar etapa de la cuenta según el hito
        if (hitoFlujo === "cotizacion") {
          await tx.cuenta.update({
            where: { id: cuentaId },
            data: { etapa: "propuesta" },
          });
        } else if (hitoFlujo === "reunion") {
          await tx.cuenta.update({
            where: { id: cuentaId },
            data: { etapa: "diagnostico" },
          });
        } else if (cuenta.etapa === "nuevo") {
          await tx.cuenta.update({
            where: { id: cuentaId },
            data: { etapa: "contactado" },
          });
        }
      }
    });

    // Notificar por Telegram / Correo si hay compromiso asignado
    if (requiereCompromiso) {
      await notificarEventoSLA({
        tipoEvento: "asignacion",
        empresa: cuenta.razonSocial,
        accion: proximoPaso,
        originador: currentUser.name,
        responsable: nombreEncargado,
        emailResponsable: encargadoUser?.email,
        fechaLimite: fechaHoraSLA,
        prioridad,
        detalle: descripcion,
      });
    }

    revalidatePath("/prospeccion");
    revalidatePath(`/cuentas/${cuentaId}`);
    if (oportunidadId) revalidatePath(`/oportunidades/${oportunidadId}`);
    revalidatePath("/auditoria");
    revalidatePath("/reuniones");

    return {
      success: true,
      message: "Acción registrada correctamente.",
    };
  } catch (err) {
    console.error("Error registrando acción rápida:", err);
    return { error: "Ocurrió un error al registrar la acción." };
  }
}

/**
 * Marca una interacción (y su tarea vinculada) como realizada ("hecho" / verde ✓)
 * o permite reabrirla si es necesario.
 */
export async function toggleEstadoInteraccionAction(
  actividadId: string,
  marcarHecho: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requireAuth();

    const act = await prisma.actividad.findUnique({
      where: { id: actividadId },
    });

    if (!act) {
      return { success: false, error: "Interacción no encontrada." };
    }

    // Si ya está realizada y el usuario NO es ADMIN, no puede reabrirla a pendiente
    if (act.estadoPaso === "hecho" && !marcarHecho && currentUser.role !== "ADMIN") {
      return {
        success: false,
        error: "Solo un administrador puede reabrir una interacción ya realizada.",
      };
    }

    const nuevoEstado = marcarHecho ? "hecho" : "pendiente";
    const pasoLimpio = act.proximoPaso ? act.proximoPaso.replace(/\s*\[Resp:.*\]$/, "").trim() : "";

    await prisma.$transaction(async (tx) => {
      await tx.actividad.update({
        where: { id: actividadId },
        data: {
          estadoPaso: nuevoEstado,
        },
      });

      // Buscar tarea vinculada por ACT:<id> o por coincidencia en la cuenta
      const tareasVinculadas = await tx.tarea.findMany({
        where: {
          cuentaId: act.cuentaId,
          OR: [
            { etapaRelacionada: { contains: `ACT:${actividadId}` } },
            ...(pasoLimpio
              ? [
                  { titulo: { equals: pasoLimpio } },
                  { titulo: { contains: pasoLimpio } },
                  ...(pasoLimpio.toLowerCase().startsWith("rellamar")
                    ? [{ titulo: { contains: "Rellamar" } }]
                    : []),
                ]
              : []),
          ],
        },
      });

      for (const t of tareasVinculadas) {
        await tx.tarea.update({
          where: { id: t.id },
          data: {
            estado: marcarHecho ? "completada" : "pendiente",
            completadaEn: marcarHecho ? new Date() : null,
          },
        });
      }
    });

    revalidatePath("/prospeccion");
    revalidatePath(`/cuentas/${act.cuentaId}`);
    if (act.oportunidadId) revalidatePath(`/oportunidades/${act.oportunidadId}`);
    revalidatePath("/auditoria");

    return { success: true };
  } catch (err) {
    console.error("Error cambiando estado de interacción:", err);
    return { success: false, error: "No se pudo actualizar el estado de la interacción." };
  }
}

/**
 * Edita una interacción existente.
 * Regla de negocio:
 * - Usuarios comerciales pueden editar SOLO si sigue pendiente/activa (estadoPaso !== "hecho").
 * - Administradores pueden editar SIEMPRE.
 */
export async function editarInteraccionAction(
  prevState: InteraccionActionState | null,
  formData: FormData
): Promise<InteraccionActionState> {
  const currentUser = await requireAuth();

  const actividadId = formData.get("actividadId")?.toString().trim();
  const tipo = formData.get("tipo")?.toString().trim() || "llamada";
  const descripcion = formData.get("descripcion")?.toString().trim() || "";
  const proximoPaso = formData.get("proximoPaso")?.toString().trim() || null;
  const fechaProximoPasoRaw = formData.get("fechaProximoPaso")?.toString().trim() || null;
  const horaProximoPasoRaw = formData.get("horaProximoPaso")?.toString().trim() || "18:00";
  const estadoPaso = formData.get("estadoPaso")?.toString().trim() || "pendiente";
  const encargadoId = formData.get("encargadoId")?.toString().trim() || null;

  if (!actividadId || !descripcion) {
    return { error: "La descripción de la interacción es obligatoria." };
  }

  try {
    const act = await prisma.actividad.findUnique({
      where: { id: actividadId },
    });

    if (!act) {
      return { error: "La interacción no existe." };
    }

    const estaRealizada = act.estadoPaso === "hecho";
    if (estaRealizada && currentUser.role !== "ADMIN") {
      return {
        error: "Esta interacción ya fue marcada como realizada. Solo un Administrador puede modificarla.",
      };
    }

    let nombreEncargado = "";
    if (encargadoId) {
      const u = await prisma.user.findUnique({ where: { id: encargadoId } });
      if (u) nombreEncargado = u.name;
    }

    const proximoPasoLimpio = proximoPaso ? proximoPaso.replace(/\s*\[Resp:.*\]$/, "").trim() : null;
    const proximoPasoFinal =
      proximoPasoLimpio && nombreEncargado
        ? `${proximoPasoLimpio} [Resp: ${nombreEncargado}]`
        : proximoPasoLimpio;

    const nuevaFechaPaso = fechaProximoPasoRaw
      ? new Date(
          fechaProximoPasoRaw.includes("T")
            ? fechaProximoPasoRaw
            : `${fechaProximoPasoRaw}T${horaProximoPasoRaw}:00`
        )
      : null;

    await prisma.$transaction(async (tx) => {
      await tx.actividad.update({
        where: { id: actividadId },
        data: {
          tipo,
          descripcion,
          proximoPaso: proximoPasoFinal,
          fechaProximoPaso: nuevaFechaPaso,
          estadoPaso,
        },
      });

      // Actualizar tarea vinculada si existe
      const tareasVinculadas = await tx.tarea.findMany({
        where: {
          cuentaId: act.cuentaId,
          etapaRelacionada: { contains: `ACT:${actividadId}` },
        },
      });

      for (const t of tareasVinculadas) {
        await tx.tarea.update({
          where: { id: t.id },
          data: {
            titulo: proximoPasoLimpio || t.titulo,
            fechaVencimiento: nuevaFechaPaso,
            responsableId: encargadoId || t.responsableId,
            estado: estadoPaso === "hecho" ? "completada" : "pendiente",
            completadaEn: estadoPaso === "hecho" ? new Date() : null,
          },
        });
      }
    });

    revalidatePath("/prospeccion");
    revalidatePath(`/cuentas/${act.cuentaId}`);
    if (act.oportunidadId) revalidatePath(`/oportunidades/${act.oportunidadId}`);
    revalidatePath("/auditoria");

    return { success: true, message: "Interacción actualizada correctamente." };
  } catch (err) {
    console.error("Error editando interacción:", err);
    return { error: "No se pudo actualizar la interacción." };
  }
}

/**
 * Elimina una interacción (Exclusivo para ADMIN).
 */
export async function eliminarInteraccionAction(
  actividadId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const act = await prisma.actividad.findUnique({
      where: { id: actividadId },
    });

    if (!act) {
      return { success: false, error: "La interacción ya no existe." };
    }

    await prisma.$transaction([
      prisma.tarea.deleteMany({
        where: {
          cuentaId: act.cuentaId,
          etapaRelacionada: { contains: `ACT:${actividadId}` },
        },
      }),
      prisma.actividad.delete({
        where: { id: actividadId },
      }),
    ]);

    revalidatePath("/prospeccion");
    revalidatePath(`/cuentas/${act.cuentaId}`);
    if (act.oportunidadId) revalidatePath(`/oportunidades/${act.oportunidadId}`);
    revalidatePath("/auditoria");

    return { success: true };
  } catch (err) {
    console.error("Error eliminando interacción:", err);
    return { success: false, error: "Solo los administradores pueden eliminar interacciones." };
  }
}

/**
 * Guarda la configuración de Alertas (Telegram Bot + Grupo, Correo y SLAs).
 */
export async function guardarConfigAlertasAction(
  prevState: InteraccionActionState | null,
  formData: FormData
): Promise<InteraccionActionState> {
  await requireAdmin();

  const nuevaConfig: Partial<AlertasConfig> = {
    telegramEnabled: formData.get("telegramEnabled") === "on",
    telegramBotToken: formData.get("telegramBotToken")?.toString().trim() || "",
    telegramChatId: formData.get("telegramChatId")?.toString().trim() || "",
    emailEnabled: formData.get("emailEnabled") === "on",
    emailsSupervisores: formData.get("emailsSupervisores")?.toString().trim() || "",
    emailWebhookUrl: formData.get("emailWebhookUrl")?.toString().trim() || "",
    horasAlertaPreventiva:
      parseInt(formData.get("horasAlertaPreventiva")?.toString() || "24", 10) || 24,
    slaCotizacionHoras:
      parseInt(formData.get("slaCotizacionHoras")?.toString() || "24", 10) || 24,
    slaContratoHoras:
      parseInt(formData.get("slaContratoHoras")?.toString() || "48", 10) || 48,
    slaSeguimientoHoras:
      parseInt(formData.get("slaSeguimientoHoras")?.toString() || "24", 10) || 24,
    notificarAlAsignar: formData.get("notificarAlAsignar") === "on",
    notificarPorVencer: formData.get("notificarPorVencer") === "on",
    notificarVencidas: formData.get("notificarVencidas") === "on",
    excluirAdminDeAlertas: formData.get("excluirAdminDeAlertas") === "on",
  };

  await guardarConfigAlertasAsync(nuevaConfig);
  revalidatePath("/auditoria");
  revalidatePath("/configuracion");

  return {
    success: true,
    message: "Configuración de alertas y SLA guardada en la base de datos.",
  };
}

/**
 * Sincroniza bidireccionalmente las Actividades históricas con estadoPaso = "pendiente"
 * y la tabla de Tareas para que ningún compromiso quede huérfano ni desincronizado.
 */
export async function sincronizarInteraccionesYTareas(): Promise<void> {
  try {
    const actividadesPendientes = await prisma.actividad.findMany({
      where: {
        estadoPaso: "pendiente",
      },
      include: {
        cuenta: { select: { id: true, razonSocial: true, responsableId: true } },
        usuario: { select: { id: true, name: true } },
      },
    });

    if (actividadesPendientes.length === 0) return;

    for (const act of actividadesPendientes) {
      const pasoRaw = act.proximoPaso?.trim() || "";
      if (!pasoRaw) {
        // Sin compromiso futuro: marcar como realizada
        await prisma.actividad.update({
          where: { id: act.id },
          data: { estadoPaso: "hecho" },
        });
        continue;
      }

      const pasoLimpio = pasoRaw.replace(/\s*\[Resp:.*\]$/, "").trim();

      // Buscar tareas de la misma cuenta
      const tareasCuenta = await prisma.tarea.findMany({
        where: { cuentaId: act.cuentaId },
      });

      const tareaVinculada = tareasCuenta.find((t) => {
        if (t.etapaRelacionada && t.etapaRelacionada.includes(`ACT:${act.id}`)) {
          return true;
        }
        if (t.titulo.trim().toLowerCase() === pasoLimpio.toLowerCase()) {
          return true;
        }
        if (
          pasoLimpio.toLowerCase().startsWith("rellamar") &&
          t.titulo.toLowerCase().includes("rellamar")
        ) {
          return true;
        }
        return false;
      });

      if (tareaVinculada) {
        if (tareaVinculada.estado === "completada") {
          // La tarea ya fue completada (ej. desde campanita): sincronizar actividad a "hecho"
          await prisma.actividad.update({
            where: { id: act.id },
            data: { estadoPaso: "hecho" },
          });
        } else {
          // Asegurar que la tarea pendiente tenga el vínculo ACT:<id> y responsable asignado
          const necesitaUpdateVinculo =
            !tareaVinculada.etapaRelacionada ||
            !tareaVinculada.etapaRelacionada.includes(`ACT:${act.id}`);
          const responsableFinal =
            tareaVinculada.responsableId || act.usuarioId || act.cuenta.responsableId || null;

          if (necesitaUpdateVinculo || !tareaVinculada.responsableId) {
            const autorOrigen = act.usuario?.name || act.responsable || "Ejecutivo";
            await prisma.tarea.update({
              where: { id: tareaVinculada.id },
              data: {
                etapaRelacionada: `ORIGEN:${autorOrigen}|ACT:${act.id}`,
                responsableId: responsableFinal,
                fechaVencimiento:
                  tareaVinculada.fechaVencimiento || act.fechaProximoPaso || act.fechaRealizada,
              },
            });
          }
        }
      } else {
        // Actividad con compromiso pendiente huérfana (como la reunión de A Toda Máquina):
        // Crear su tarea correspondiente en el flujo SLA
        const autorOrigen = act.usuario?.name || act.responsable || "Ejecutivo";
        const responsableId = act.usuarioId || act.cuenta.responsableId || null;
        const tipoTarea =
          act.tipo === "reunion"
            ? "reunion"
            : act.tipo === "email" || act.tipo === "cotizacion" || pasoLimpio.toLowerCase().includes("propuesta") || pasoLimpio.toLowerCase().includes("cotizaci")
            ? "correo"
            : act.tipo === "llamada"
            ? "llamada"
            : "seguimiento";

        await prisma.tarea.create({
          data: {
            titulo: pasoLimpio,
            descripcion: `Originado por ${autorOrigen}: ${act.descripcion}`,
            tipo: tipoTarea,
            prioridad: "alta",
            estado: "pendiente",
            fechaVencimiento: act.fechaProximoPaso || act.fechaRealizada,
            etapaRelacionada: `ORIGEN:${autorOrigen}|ACT:${act.id}`,
            cuentaId: act.cuentaId,
            oportunidadId: act.oportunidadId,
            personaId: act.personaId,
            responsableId,
          },
        });
      }
    }
  } catch (err) {
    console.error("Error sincronizando interacciones y tareas:", err);
  }
}

/**
 * Envía un mensaje de prueba al grupo de Telegram configurado.
 */
export async function probarConexionTelegramAction(
  token?: string,
  chatId?: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();

  const mensaje = [
    "✅ <b>[CONEXIÓN EXITOSA - PROTEGIUS CRM]</b>",
    `El Bot de Auditoría y Alertas SLA está conectado a este grupo.`,
    `👤 <b>Probado por:</b> ${admin.name}`,
    `⏰ <b>Fecha:</b> ${new Date().toLocaleString("es-CL")}`,
  ].join("\n");

  return enviarMensajeTelegram(mensaje, token, chatId);
}

/**
 * Envía un correo de prueba vía Webhook de n8n para validar la entrega de alertas por email.
 */
export async function probarConexionEmailAction(
  emailsDestino?: string,
  webhookUrl?: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  const config = await obtenerConfigAlertasAsync();
  const destinatarios = (emailsDestino ?? config.emailsSupervisores ?? admin.email).trim();

  const mensajePrueba = [
    "✅ [PRUEBA DE CORREO EXITOSA - PROTEGIUS CRM]",
    "",
    "El sistema de Alertas SLA y Seguimiento Comercial por Correo (vía n8n) está conectado y operativo.",
    `• Probado por: ${admin.name} (${admin.email})`,
    `• Destinatarios configurados: ${destinatarios}`,
    `• Fecha y hora: ${new Date().toLocaleString("es-CL")}`,
  ].join("\n");

  return enviarAlertaEmailWebhook(
    {
      asunto: "[Protegius CRM] ✅ Prueba de Conexión de Alertas SLA por Correo",
      mensaje: mensajePrueba,
      destinatarios,
      empresa: "Protegius CRM (Prueba de Sistema)",
      accion: "Validación de canal de correo n8n",
      responsable: admin.name,
      originador: admin.name,
      fechaLimite: new Date().toLocaleString("es-CL"),
      tipoEvento: "prueba_conexion",
    },
    webhookUrl
  );
}

/**
 * Detecta automáticamente el Chat ID del último grupo o chat donde se escribió al Bot.
 */
export async function detectarChatIdTelegramAction(
  tokenInput: string
): Promise<{ ok: boolean; chatId?: string; title?: string; error?: string }> {
  await requireAdmin();
  const token = tokenInput.trim();
  if (!token) {
    return { ok: false, error: "Primero pega el Bot Token entregado por @BotFather." };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, {
      cache: "no-store",
    });
    const data = (await res.json()) as {
      ok?: boolean;
      description?: string;
      result?: Array<{
        message?: { chat?: { id: number; title?: string; username?: string; type?: string } };
        my_chat_member?: { chat?: { id: number; title?: string; username?: string; type?: string } };
      }>;
    };

    if (!res.ok || !data.ok) {
      return { ok: false, error: data.description || "Token inválido." };
    }

    const updates = data.result || [];
    for (let i = updates.length - 1; i >= 0; i--) {
      const chat = updates[i].message?.chat || updates[i].my_chat_member?.chat;
      if (chat && chat.id) {
        return {
          ok: true,
          chatId: String(chat.id),
          title: chat.title || chat.username || chat.type || "Chat detectado",
        };
      }
    }

    return {
      ok: false,
      error:
        "No se encontraron mensajes recientes. Agrega el Bot al grupo y escribe un mensaje cualquiera (ej: /start) en el grupo.",
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error al consultar Telegram API.",
    };
  }
}

/**
 * Ejecuta un barrido inmediato de todos los compromisos por vencer o vencidos:
 * - Sincroniza primero las interacciones huérfanas.
 * - Si lo ejecuta un Comercial, procesa únicamente sus propios compromisos.
 * - Si lo ejecuta un Admin, envía el reporte consolidado a Telegram + Supervisores
 *   y envía a cada comercial por correo ÚNICAMENTE sus propias alertas sin mezclarlas.
 */
export async function ejecutarBarridoAlertasSLAAction(): Promise<{
  ok: boolean;
  enviadas: number;
  detalles?: string;
  error?: string;
}> {
  const currentUser = await requireAuth();
  await sincronizarInteraccionesYTareas();

  const config = await obtenerConfigAlertasAsync();

  const ahora = new Date();
  const limitePreventivo = new Date(
    ahora.getTime() + config.horasAlertaPreventiva * 60 * 60 * 1000
  );

  const whereClause: Record<string, unknown> = {
    estado: "pendiente",
    fechaVencimiento: { lte: limitePreventivo },
  };

  const rolesConAccesoGlobal = ["ADMIN", "GERENTE_GENERAL", "GERENTE_COMERCIAL"];
  if (!rolesConAccesoGlobal.includes(currentUser.role)) {
    whereClause.responsableId = currentUser.id;
  }

  const tareasPendientes = await prisma.tarea.findMany({
    where: whereClause,
    include: {
      cuenta: { select: { razonSocial: true } },
      responsable: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { fechaVencimiento: "asc" },
  });

  if (tareasPendientes.length === 0) {
    return { ok: true, enviadas: 0 };
  }

  const vencidas = tareasPendientes.filter(
    (t) => t.fechaVencimiento && new Date(t.fechaVencimiento) < ahora
  );
  const porVencer = tareasPendientes.filter(
    (t) => t.fechaVencimiento && new Date(t.fechaVencimiento) >= ahora
  );

  const formatearLinea = (
    t: (typeof tareasPendientes)[number],
    etiquetaFecha: string,
    html: boolean
  ) => {
    const f = t.fechaVencimiento
      ? new Date(t.fechaVencimiento).toLocaleDateString("es-CL", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
    const emp = t.cuenta?.razonSocial || "Sin empresa";
    const resp = t.responsable?.name || "Sin asignar";
    if (html) {
      return `• <b>${emp}</b>: ${t.titulo} — Resp: <i>${resp}</i> (${etiquetaFecha}: ${f})`;
    }
    return `• ${emp}: ${t.titulo} — Resp: ${resp} (${etiquetaFecha}: ${f})`;
  };

  const lineasHtml: string[] = [
    "🔔 <b>[REPORTE DE AUDITORÍA SLA - PROTEGIUS CRM]</b>",
    `🚨 <b>Atrasadas / SLA Vencido:</b> ${vencidas.length}`,
    `⚠️ <b>Por vencer (próx. ${config.horasAlertaPreventiva}h):</b> ${porVencer.length}`,
    "",
  ];

  if (vencidas.length > 0) {
    lineasHtml.push("<b>🚨 COMPROMISOS ATRASADOS:</b>");
    for (const t of vencidas.slice(0, 25)) {
      lineasHtml.push(formatearLinea(t, "Venció", true));
    }
    lineasHtml.push("");
  }

  if (porVencer.length > 0) {
    lineasHtml.push("<b>⚠️ PRÓXIMOS A VENCER:</b>");
    for (const t of porVencer.slice(0, 25)) {
      lineasHtml.push(formatearLinea(t, "Vence", true));
    }
  }

  const canalesEnviados: string[] = [];
  let ultimoError = "";

  // 1. Enviar a Grupo de Telegram (si está activo y es Admin o general)
  if (config.telegramEnabled && config.telegramBotToken && config.telegramChatId) {
    const resTg = await enviarMensajeTelegram(lineasHtml.join("\n"));
    if (resTg.ok) {
      canalesEnviados.push("Telegram");
    } else if (resTg.error) {
      ultimoError = resTg.error;
    }
  }

  // 2. Enviar alertas por Correo vía n8n separadas por Ejecutivo (sin mezclar) + Supervisores
  if (config.emailEnabled && config.emailWebhookUrl) {
    // 2a. Agrupar por comercial para que cada ejecutivo reciba SOLO sus propias alertas
    const porEjecutivo = new Map<
      string,
      { nombre: string; email: string; tareas: typeof tareasPendientes }
    >();

    for (const t of tareasPendientes) {
      if (t.responsable?.email) {
        // Excluir al rol ADMIN de alertas individuales si está configurado
        if (config.excluirAdminDeAlertas && t.responsable.role === "ADMIN") {
          continue;
        }

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

    let correosEjecutivosOk = 0;
    for (const [, ej] of Array.from(porEjecutivo.entries())) {
      const vencidasEj = ej.tareas.filter(
        (t) => t.fechaVencimiento && new Date(t.fechaVencimiento) < ahora
      );
      const porVencerEj = ej.tareas.filter(
        (t) => t.fechaVencimiento && new Date(t.fechaVencimiento) >= ahora
      );

      const cuerpoEj: string[] = [
        `Hola ${ej.nombre},`,
        "",
        `Tienes ${ej.tareas.length} compromiso(s) comercial(es) en seguimiento SLA asignados a tu gestión:`,
        `• Atrasados (SLA Vencido): ${vencidasEj.length}`,
        `• Próximos a vencer: ${porVencerEj.length}`,
        "",
      ];

      if (vencidasEj.length > 0) {
        cuerpoEj.push("🚨 TUS COMPROMISOS ATRASADOS:");
        for (const t of vencidasEj) {
          cuerpoEj.push(formatearLinea(t, "Venció", false));
        }
        cuerpoEj.push("");
      }

      if (porVencerEj.length > 0) {
        cuerpoEj.push("⚠️ TUS COMPROMISOS PRÓXIMOS A VENCER:");
        for (const t of porVencerEj) {
          cuerpoEj.push(formatearLinea(t, "Vence", false));
        }
      }

      const resEj = await enviarAlertaEmailWebhook({
        asunto: `[Protegius CRM] Tus Alertas SLA (${vencidasEj.length} atrasadas, ${porVencerEj.length} por vencer) - ${ej.nombre}`,
        mensaje: cuerpoEj.join("\n"),
        destinatarios: ej.email,
        responsable: ej.nombre,
        tipoEvento: "resumen_ejecutivo_individual",
      });
      if (resEj.ok) correosEjecutivosOk++;
      else if (resEj.error) ultimoError = resEj.error;
    }

    // 2b. Si es ADMIN, enviar también el consolidado general a los correos de Supervisores
    if (currentUser.role === "ADMIN" && config.emailsSupervisores) {
      const resSup = await enviarAlertaEmailWebhook({
        asunto: `[Protegius CRM - Supervisores] Reporte Consolidado SLA (${vencidas.length} atrasadas, ${porVencer.length} por vencer)`,
        mensaje: lineasHtml.join("\n").replace(/<[^>]+>/g, ""),
        destinatarios: config.emailsSupervisores,
        responsable: "Supervisores",
        tipoEvento: "reporte_consolidado_supervisores",
      });
      if (resSup.ok) {
        canalesEnviados.push(`Correo Supervisores y ${correosEjecutivosOk} ejecutivo(s)`);
      } else if (resSup.error) {
        ultimoError = resSup.error;
      }
    } else if (correosEjecutivosOk > 0) {
      canalesEnviados.push(`Correo (${correosEjecutivosOk})`);
    }
  }

  if (canalesEnviados.length === 0) {
    return {
      ok: false,
      enviadas: 0,
      error:
        ultimoError ||
        "No hay canales de alerta activos (habilita Telegram o Correo en Configurar Bot / Correo).",
    };
  }

  revalidatePath("/auditoria");

  return {
    ok: true,
    enviadas: tareasPendientes.length,
    detalles: canalesEnviados.join(" + "),
  };
}
