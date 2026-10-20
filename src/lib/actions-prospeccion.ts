"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notificarEventoSLA } from "@/lib/alertas-externas";

export interface ProspeccionActionState {
  error?: string;
  success?: boolean;
  message?: string;
}

export async function registrarLlamadaProspeccionAction(
  prevState: ProspeccionActionState | null,
  formData: FormData
): Promise<ProspeccionActionState> {
  const currentUser = await requireAuth();

  const cuentaId = formData.get("cuentaId")?.toString().trim();
  const personaId = formData.get("personaId")?.toString().trim() || null;
  const resultado = formData.get("resultado")?.toString().trim();
  const observacion = formData.get("observacion")?.toString().trim() || "";
  const encargadoId = formData.get("encargadoId")?.toString().trim() || currentUser.id;
  const fechaLimitePropuesta = formData.get("fechaLimitePropuesta")?.toString().trim() || null;

  // Campos específicos de rellamada
  const fechaRellamada = formData.get("fechaRellamada")?.toString().trim() || null;
  const horaRellamada = formData.get("horaRellamada")?.toString().trim() || "10:00";

  // Campos específicos de reunión
  const fechaReunion = formData.get("fechaReunion")?.toString().trim() || null;
  const horaReunion = formData.get("horaReunion")?.toString().trim() || "10:00";
  const modalidadReunion = formData.get("modalidadReunion")?.toString().trim() || "online";
  const linkReunion = formData.get("linkReunion")?.toString().trim() || "";
  const montoEstimadoUF = parseFloat(formData.get("montoEstimadoUF")?.toString() || "0") || null;

  if (!cuentaId) {
    return { error: "Falta identificar la empresa / cuenta." };
  }

  if (!resultado) {
    return { error: "Debes seleccionar el resultado de la llamada." };
  }

  try {
    const [cuenta, encargadoUser] = await Promise.all([
      prisma.cuenta.findUnique({
        where: { id: cuentaId },
        include: { responsable: true },
      }),
      prisma.user.findUnique({ where: { id: encargadoId } }),
    ]);

    if (!cuenta) {
      return { error: "No se encontró la empresa seleccionada." };
    }

    const nombreEncargado = encargadoUser?.name || currentUser.name;

    let personaNombre = "";
    if (personaId) {
      const persona = await prisma.persona.findUnique({ where: { id: personaId } });
      if (persona) personaNombre = persona.nombre;
    }

    const tieneProximoPaso =
      resultado === "reunion_agendada" ||
      resultado === "propuesta_solicitada" ||
      Boolean(fechaRellamada);

    const fechaPasoCalculada =
      resultado === "reunion_agendada" && fechaReunion
        ? new Date(`${fechaReunion}T${horaReunion}:00`)
        : resultado === "propuesta_solicitada"
        ? fechaLimitePropuesta
          ? new Date(`${fechaLimitePropuesta}T18:00:00`)
          : new Date(Date.now() + 24 * 60 * 60 * 1000)
        : fechaRellamada
        ? new Date(`${fechaRellamada}T${horaRellamada}:00`)
        : null;

    const textoProximoPaso =
      resultado === "reunion_agendada"
        ? `Reunión ${modalidadReunion.toUpperCase()} el ${fechaReunion} ${horaReunion} [Resp: ${nombreEncargado}]`
        : resultado === "propuesta_solicitada"
        ? `Enviar Cotización / Propuesta a ${cuenta.razonSocial} [Resp: ${nombreEncargado}]`
        : fechaRellamada
        ? `Rellamar el ${fechaRellamada} ${horaRellamada} [Resp: ${nombreEncargado}]`
        : null;

    await prisma.$transaction(async (tx) => {
      // 1. Armar descripción con trazabilidad
      let textoDescripcion = `[${resultado.toUpperCase().replace(/_/g, " ")}]`;
      if (personaNombre) textoDescripcion += ` Contactado: ${personaNombre}.`;
      if (observacion) textoDescripcion += ` Detalle: ${observacion}`;

      // 2. Registrar la Actividad con el usuario autenticado y estado explícito
      const act = await tx.actividad.create({
        data: {
          cuentaId,
          personaId: personaId || null,
          usuarioId: currentUser.id,
          responsable: currentUser.name,
          tipo: resultado === "reunion_agendada" ? "reunion" : "llamada",
          descripcion: textoDescripcion,
          fechaRealizada: new Date(),
          proximoPaso: textoProximoPaso,
          fechaProximoPaso: fechaPasoCalculada,
          estadoPaso: tieneProximoPaso ? "pendiente" : "hecho",
        },
      });

      // 3. Procesar según resultado comercial
      if (resultado === "reunion_agendada" && fechaReunion) {
        const fechaHoraReunion = new Date(`${fechaReunion}T${horaReunion}:00`);

        // Crear tarea de reunión con auditoría de origen
        await tx.tarea.create({
          data: {
            titulo: `📅 Reunión: ${cuenta.razonSocial} (${modalidadReunion})`,
            descripcion: `Reunión agendada por ${currentUser.name}. ${personaNombre ? `Contacto: ${personaNombre}. ` : ""}${linkReunion ? `Link: ${linkReunion}. ` : ""}${observacion}`,
            tipo: "reunion",
            prioridad: "alta",
            fechaVencimiento: fechaHoraReunion,
            etapaRelacionada: `ORIGEN:${currentUser.name}|ACT:${act.id}`,
            cuentaId,
            personaId: personaId || null,
            responsableId: encargadoId,
          },
        });

        // Crear u obtener oportunidad en etapa 'reunion_agendada'
        await tx.oportunidad.create({
          data: {
            cuentaId,
            nombre: `Negocio / Reunión: ${cuenta.razonSocial}`,
            descripcion: `Reunión agendada para el ${fechaReunion} ${horaReunion}. ${observacion}`,
            etapa: "reunion_agendada",
            estado: "abierta",
            valorEstimado: montoEstimadoUF || 10,
            responsableId: encargadoId,
            fechaCierreEstimada: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        });

        // Actualizar etapa de la cuenta
        await tx.cuenta.update({
          where: { id: cuentaId },
          data: {
            etapa: "diagnostico",
            responsableId: cuenta.responsableId || currentUser.id,
          },
        });
      } else if (resultado === "propuesta_solicitada") {
        // Interesado que solicita propuesta económica
        await tx.oportunidad.create({
          data: {
            cuentaId,
            nombre: `Propuesta requerida: ${cuenta.razonSocial}`,
            descripcion: `Cliente interesado solicita cotización. ${observacion}`,
            etapa: "propuesta_enviada",
            estado: "abierta",
            valorEstimado: montoEstimadoUF || 15,
            responsableId: encargadoId,
            fechaCierreEstimada: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });

        await tx.tarea.create({
          data: {
            titulo: `📄 Enviar propuesta a ${cuenta.razonSocial}`,
            descripcion: `Solicitado por ${currentUser.name}. ${observacion}`,
            tipo: "correo",
            prioridad: "alta",
            fechaVencimiento: fechaPasoCalculada,
            etapaRelacionada: `ORIGEN:${currentUser.name}|ACT:${act.id}`,
            cuentaId,
            personaId: personaId || null,
            responsableId: encargadoId,
          },
        });

        await tx.cuenta.update({
          where: { id: cuentaId },
          data: {
            etapa: "propuesta",
            responsableId: cuenta.responsableId || currentUser.id,
          },
        });
      } else if (fechaRellamada) {
        // Rellamada o reintento programado
        const fechaHoraRellamada = new Date(`${fechaRellamada}T${horaRellamada}:00`);

        await tx.tarea.create({
          data: {
            titulo: `📞 Rellamar a ${cuenta.razonSocial} (${personaNombre || "Contacto"})`,
            descripcion: `Programado por ${currentUser.name}. Motivo: ${resultado === "no_contesta" ? "No contestó" : "Pidió volver a llamar"}. ${observacion}`,
            tipo: "llamada",
            prioridad: "media",
            fechaVencimiento: fechaHoraRellamada,
            etapaRelacionada: `ORIGEN:${currentUser.name}|ACT:${act.id}`,
            cuentaId,
            personaId: personaId || null,
            responsableId: encargadoId,
          },
        });

        await tx.cuenta.update({
          where: { id: cuentaId },
          data: {
            etapa: "contactado",
            responsableId: cuenta.responsableId || currentUser.id,
          },
        });
      } else if (resultado === "no_interesado" || resultado === "numero_invalido") {
        await tx.cuenta.update({
          where: { id: cuentaId },
          data: {
            etapa: "perdido",
            notas: cuenta.notas ? `${cuenta.notas}\nDescartado (${resultado}): ${observacion}` : `Descartado (${resultado}): ${observacion}`,
          },
        });
      } else {
        await tx.cuenta.update({
          where: { id: cuentaId },
          data: {
            etapa: "contactado",
            responsableId: cuenta.responsableId || currentUser.id,
          },
        });
      }
    });

    if (tieneProximoPaso && textoProximoPaso) {
      await notificarEventoSLA({
        tipoEvento: "asignacion",
        empresa: cuenta.razonSocial,
        accion: textoProximoPaso.replace(/\s*\[Resp:.*\]$/, ""),
        originador: currentUser.name,
        responsable: nombreEncargado,
        emailResponsable: encargadoUser?.email,
        fechaLimite: fechaPasoCalculada,
        prioridad: resultado === "propuesta_solicitada" || resultado === "reunion_agendada" ? "alta" : "media",
        detalle: observacion,
      });
    }

    revalidatePath("/prospeccion");
    revalidatePath("/oportunidades");
    revalidatePath("/oportunidades/pipeline");
    revalidatePath("/reuniones");
    revalidatePath("/auditoria");
    revalidatePath("/cuentas");
    revalidatePath(`/cuentas/${cuentaId}`);

    return {
      success: true,
      message: "Gestión registrada exitosamente con trazabilidad.",
    };
  } catch (err: unknown) {
    console.error("Error al registrar gestión de prospección:", err);
    return {
      error: "Ocurrió un error al guardar la gestión comercial.",
    };
  }
}

export async function importarProspectosMasivoAction(
  filas: {
    razonSocial: string;
    rut?: string | null;
    contactoNombre?: string | null;
    cargo?: string | null;
    telefono?: string | null;
    email?: string | null;
    rubro?: string | null;
    comentario?: string | null;
  }[],
  responsableId?: string | null
): Promise<{ success: boolean; importados: number; duplicados: number; error?: string }> {
  const currentUser = await requireAuth();
  const usuarioAsignado = responsableId || currentUser.id;

  let importados = 0;
  let duplicados = 0;

  try {
    for (const fila of filas) {
      const razonSocial = (fila.razonSocial || "").trim();
      if (!razonSocial) continue;

      const email = fila.email ? fila.email.trim().toLowerCase() : null;
      const telefono = fila.telefono ? fila.telefono.trim() : null;
      const contactoNombre = fila.contactoNombre ? fila.contactoNombre.trim() : null;

      // Buscar si la cuenta ya existe por razón social
      let cuenta = await prisma.cuenta.findFirst({
        where: {
          razonSocial: {
            equals: razonSocial,
            mode: "insensitive",
          },
        },
      });

      if (!cuenta) {
        cuenta = await prisma.cuenta.create({
          data: {
            razonSocial,
            rut: fila.rut ? fila.rut.trim() : null,
            rubro: fila.rubro ? fila.rubro.trim() : null,
            notas: fila.comentario ? fila.comentario.trim() : null,
            etapa: "nuevo",
            responsableId: usuarioAsignado,
            origenLead: "importacion_excel",
          },
        });
        importados++;
      } else {
        duplicados++;
      }

      // Si viene con persona/contacto, vincular
      if (contactoNombre && cuenta) {
        let persona = null;
        if (email) {
          persona = await prisma.persona.findFirst({
            where: { email },
          });
        }

        if (!persona) {
          persona = await prisma.persona.create({
            data: {
              nombre: contactoNombre,
              cargo: fila.cargo ? fila.cargo.trim() : null,
              email,
              telefono,
            },
          });
        }

        // Crear afiliación si no existe
        const afiliacionExistente = await prisma.afiliacion.findUnique({
          where: {
            cuentaId_personaId: {
              cuentaId: cuenta.id,
              personaId: persona.id,
            },
          },
        });

        if (!afiliacionExistente) {
          await prisma.afiliacion.create({
            data: {
              cuentaId: cuenta.id,
              personaId: persona.id,
              cargo: fila.cargo ? fila.cargo.trim() : null,
              esPrincipal: true,
              activa: true,
            },
          });
        }
      }
    }

    revalidatePath("/prospeccion");
    revalidatePath("/cuentas");
    revalidatePath("/contactos");
    revalidatePath("/oportunidades/pipeline");

    return { success: true, importados, duplicados };
  } catch (error: unknown) {
    console.error("Error en importación masiva:", error);
    return {
      success: false,
      importados,
      duplicados,
      error: "Ocurrió un error durante la importación masiva.",
    };
  }
}
