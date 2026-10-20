"use server";

import { requireAuth, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  obtenerConfigAlertas,
  guardarConfigAlertas,
  enviarMensajeTelegram,
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
            ...(act.proximoPaso
              ? [{ titulo: { equals: act.proximoPaso.replace(/\s*\[Resp:.*\]$/, "") } }]
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
  };

  guardarConfigAlertas(nuevaConfig);
  revalidatePath("/auditoria");

  return {
    success: true,
    message: "Configuración de alertas y SLA guardada exitosamente.",
  };
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
 * Ejecuta un barrido inmediato de todos los compromisos por vencer o vencidos
 * y envía el reporte ejecutivo al grupo de Telegram / Supervisores.
 */
export async function ejecutarBarridoAlertasSLAAction(): Promise<{
  ok: boolean;
  enviadas: number;
  error?: string;
}> {
  await requireAuth();
  const config = obtenerConfigAlertas();

  const ahora = new Date();
  const limitePreventivo = new Date(
    ahora.getTime() + config.horasAlertaPreventiva * 60 * 60 * 1000
  );

  const tareasPendientes = await prisma.tarea.findMany({
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

  if (tareasPendientes.length === 0) {
    return { ok: true, enviadas: 0 };
  }

  const vencidas = tareasPendientes.filter(
    (t) => t.fechaVencimiento && new Date(t.fechaVencimiento) < ahora
  );
  const porVencer = tareasPendientes.filter(
    (t) => t.fechaVencimiento && new Date(t.fechaVencimiento) >= ahora
  );

  const lineas: string[] = [
    "🔔 <b>[REPORTE DE AUDITORÍA SLA - PROTEGIUS CRM]</b>",
    `🚨 <b>Atrasadas / SLA Vencido:</b> ${vencidas.length}`,
    `⚠️ <b>Por vencer (próx. ${config.horasAlertaPreventiva}h):</b> ${porVencer.length}`,
    "",
  ];

  if (vencidas.length > 0) {
    lineas.push("<b>🚨 COMPROMISOS ATRASADOS:</b>");
    for (const t of vencidas.slice(0, 10)) {
      const f = t.fechaVencimiento
        ? new Date(t.fechaVencimiento).toLocaleDateString("es-CL", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";
      lineas.push(
        `• <b>${t.cuenta?.razonSocial || "Sin empresa"}</b>: ${t.titulo} — Resp: <i>${
          t.responsable?.name || "Sin asignar"
        }</i> (Venció: ${f})`
      );
    }
    lineas.push("");
  }

  if (porVencer.length > 0) {
    lineas.push("<b>⚠️ PRÓXIMOS A VENCER:</b>");
    for (const t of porVencer.slice(0, 10)) {
      const f = t.fechaVencimiento
        ? new Date(t.fechaVencimiento).toLocaleDateString("es-CL", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";
      lineas.push(
        `• <b>${t.cuenta?.razonSocial || "Sin empresa"}</b>: ${t.titulo} — Resp: <i>${
          t.responsable?.name || "Sin asignar"
        }</i> (Vence: ${f})`
      );
    }
  }

  const res = await enviarMensajeTelegram(lineas.join("\n"));
  if (!res.ok) {
    return { ok: false, enviadas: 0, error: res.error };
  }

  return { ok: true, enviadas: tareasPendientes.length };
}
