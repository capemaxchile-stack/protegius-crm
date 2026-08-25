"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validarRUT, limpiarRUT } from "@/lib/rut";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface OportunidadActionState {
  error?: string;
  success?: boolean;
  oportunidadId?: string;
  ok?: string;
}

// ----------------------------------------------------
// GESTIONES TEMPRANAS SIN OPORTUNIDAD
// ----------------------------------------------------

export async function registrarGestionTempranaAction(
  prevState: OportunidadActionState | null,
  formData: FormData
): Promise<OportunidadActionState> {
  const currentUser = await requireAuth();

  const cuentaId = formData.get("cuentaId")?.toString().trim();
  const nuevaCuentaNombre = formData.get("nuevaCuentaNombre")?.toString().trim();

  const personaId = formData.get("personaId")?.toString().trim() || null;
  const nuevoContactoNombre = formData.get("nuevoContactoNombre")?.toString().trim() || null;
  const nuevoContactoCargo = formData.get("nuevoContactoCargo")?.toString().trim() || null;
  const nuevoContactoEmail = formData.get("nuevoContactoEmail")?.toString().trim().toLowerCase() || null;
  const nuevoContactoTelefono = formData.get("nuevoContactoTelefono")?.toString().trim() || null;

  const tipoActividad = formData.get("tipoActividad")?.toString() || "llamada";
  const descripcionActividad = formData.get("descripcionActividad")?.toString().trim();

  // Tarea de seguimiento opcional
  const crearTarea = formData.get("crearTarea") === "on";
  const tituloTarea = formData.get("tituloTarea")?.toString().trim();
  const fechaVencimientoTarea = formData.get("fechaVencimientoTarea")?.toString().trim();
  const prioridadTarea = formData.get("prioridadTarea")?.toString() || "media";

  if (!cuentaId && !nuevaCuentaNombre) {
    return { error: "Debes seleccionar una cuenta existente o ingresar el nombre de una nueva." };
  }

  if (!descripcionActividad) {
    return { error: "El detalle de la gestión realizada es obligatorio." };
  }

  let finalCuentaId = cuentaId || "";
  let finalPersonaId = personaId;
  let actividadCreadaId = "";

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Si se crea una cuenta nueva
      if (!finalCuentaId && nuevaCuentaNombre) {
        const nuevaCuenta = await tx.cuenta.create({
          data: {
            razonSocial: nuevaCuentaNombre,
            responsableId: currentUser.id,
            etapa: "nuevo",
          },
        });
        finalCuentaId = nuevaCuenta.id;
      }

      // 2. Si se crea un contacto nuevo
      if (!finalPersonaId && nuevoContactoNombre) {
        if (nuevoContactoEmail) {
          const personaExistente = await tx.persona.findFirst({
            where: { email: nuevoContactoEmail },
          });
          if (personaExistente) {
            finalPersonaId = personaExistente.id;
          }
        }

        if (!finalPersonaId) {
          const nuevaPersona = await tx.persona.create({
            data: {
              nombre: nuevoContactoNombre,
              cargo: nuevoContactoCargo,
              email: nuevoContactoEmail,
              telefono: nuevoContactoTelefono,
            },
          });
          finalPersonaId = nuevaPersona.id;
        }

        // Vincular a la cuenta si no estaba
        const existeAfiliacion = await tx.afiliacion.findUnique({
          where: {
            cuentaId_personaId: {
              cuentaId: finalCuentaId,
              personaId: finalPersonaId,
            },
          },
        });

        if (!existeAfiliacion) {
          await tx.afiliacion.create({
            data: {
              cuentaId: finalCuentaId,
              personaId: finalPersonaId,
              cargo: nuevoContactoCargo,
              esPrincipal: true,
              activa: true,
            },
          });
        }
      }

      // 3. Crear Actividad comercial (sin oportunidad)
      const act = await tx.actividad.create({
        data: {
          cuentaId: finalCuentaId,
          personaId: finalPersonaId || null,
          usuarioId: currentUser.id,
          responsable: currentUser.name,
          tipo: tipoActividad,
          descripcion: descripcionActividad,
          proximoPaso: crearTarea && tituloTarea ? tituloTarea : null,
          fechaProximoPaso: crearTarea && fechaVencimientoTarea ? new Date(fechaVencimientoTarea) : null,
          estadoPaso: crearTarea && tituloTarea ? "pendiente" : null,
        },
      });

      actividadCreadaId = act.id;

      // 4. Crear Tarea si se solicitó
      if (crearTarea && tituloTarea) {
        await tx.tarea.create({
          data: {
            titulo: tituloTarea,
            cuentaId: finalCuentaId,
            personaId: finalPersonaId || null,
            responsableId: currentUser.id,
            tipo: "seguimiento",
            prioridad: prioridadTarea,
            fechaVencimiento: fechaVencimientoTarea ? new Date(fechaVencimientoTarea) : null,
            estado: "pendiente",
          },
        });
      }
    });

    revalidatePath("/oportunidades/gestiones");
    revalidatePath("/oportunidades/seguimiento");
    revalidatePath(`/cuentas/${finalCuentaId}`);
  } catch (err) {
    console.error("Error al registrar gestión:", err);
    return { error: "No se pudo registrar la gestión comercial." };
  }

  redirect(`/oportunidades/gestiones?ok=${actividadCreadaId}`);
}

// ----------------------------------------------------
// OPORTUNIDADES COMERCIALES
// ----------------------------------------------------

export async function crearOportunidadAction(
  prevState: OportunidadActionState | null,
  formData: FormData
): Promise<OportunidadActionState> {
  const currentUser = await requireAuth();

  const nombre = formData.get("nombre")?.toString().trim();
  const cuentaId = formData.get("cuentaId")?.toString().trim();
  const descripcion = formData.get("descripcion")?.toString().trim() || null;
  const etapa = formData.get("etapa")?.toString().trim() || "contacto_inicial";
  const rawValor = formData.get("valorEstimado")?.toString().trim();
  const rawProbabilidad = formData.get("probabilidad")?.toString().trim();
  const responsableId = formData.get("responsableId")?.toString().trim() || currentUser.id;
  const rawFechaCierre = formData.get("fechaCierreEstimada")?.toString().trim();

  if (!nombre || !cuentaId) {
    return { error: "El nombre de la oportunidad y la cuenta son obligatorios." };
  }

  const valorEstimado = rawValor ? parseFloat(rawValor.replace(",", ".")) : null;
  const probabilidad = rawProbabilidad ? parseInt(rawProbabilidad, 10) : 10;
  const fechaCierreEstimada = rawFechaCierre ? new Date(rawFechaCierre) : null;

  let nuevaOpId = "";

  try {
    const op = await prisma.oportunidad.create({
      data: {
        nombre,
        cuentaId,
        descripcion,
        etapa,
        estado: "abierta",
        valorEstimado,
        moneda: "UF",
        probabilidad,
        responsableId: responsableId || null,
        fechaCierreEstimada,
      },
    });

    nuevaOpId = op.id;
    revalidatePath("/oportunidades");
    revalidatePath("/oportunidades/pipeline");
    revalidatePath(`/cuentas/${cuentaId}`);
  } catch (err) {
    console.error("Error al crear oportunidad:", err);
    return { error: "Ocurrió un error al registrar la oportunidad." };
  }

  redirect(`/oportunidades/${nuevaOpId}`);
}

// ----------------------------------------------------
// ALTA RÁPIDA TODO-EN-UNO
// ----------------------------------------------------

export async function crearAltaRapidaAction(
  prevState: OportunidadActionState | null,
  formData: FormData
): Promise<OportunidadActionState> {
  const currentUser = await requireAuth();

  const razonSocial = formData.get("razonSocial")?.toString().trim();
  const rawRut = formData.get("rut")?.toString().trim();
  const rubro = formData.get("rubro")?.toString().trim() || null;

  const contactoNombre = formData.get("contactoNombre")?.toString().trim();
  const contactoCargo = formData.get("contactoCargo")?.toString().trim() || null;
  const contactoEmail = formData.get("contactoEmail")?.toString().trim().toLowerCase() || null;
  const contactoTelefono = formData.get("contactoTelefono")?.toString().trim() || null;

  const opNombre = formData.get("opNombre")?.toString().trim();
  const opEtapa = formData.get("opEtapa")?.toString().trim() || "contacto_inicial";
  const rawOpValor = formData.get("opValorEstimado")?.toString().trim();

  const actDescripcion = formData.get("actDescripcion")?.toString().trim();
  const tareaTitulo = formData.get("tareaTitulo")?.toString().trim();
  const rawTareaVence = formData.get("tareaFechaVencimiento")?.toString().trim();

  if (!razonSocial || !opNombre) {
    return { error: "La Razón Social y el Nombre de la Oportunidad son obligatorios." };
  }

  let rutLimpio: string | null = null;
  if (rawRut) {
    if (!validarRUT(rawRut)) {
      return { error: "El RUT ingresado no es válido." };
    }
    rutLimpio = limpiarRUT(rawRut);

    const existente = await prisma.cuenta.findFirst({ where: { rut: rutLimpio } });
    if (existente) {
      return { error: `Ya existe una cuenta con este RUT (${existente.razonSocial}).` };
    }
  }

  const opValor = rawOpValor ? parseFloat(rawOpValor.replace(",", ".")) : null;
  let opCreadaId = "";

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Crear Cuenta
      const cuenta = await tx.cuenta.create({
        data: {
          razonSocial,
          rut: rutLimpio,
          rubro,
          responsableId: currentUser.id,
          etapa: "contactado",
        },
      });

      // 2. Crear Contacto si vino
      let personaId: string | null = null;
      if (contactoNombre) {
        const persona = await tx.persona.create({
          data: {
            nombre: contactoNombre,
            cargo: contactoCargo,
            email: contactoEmail,
            telefono: contactoTelefono,
          },
        });
        personaId = persona.id;

        await tx.afiliacion.create({
          data: {
            cuentaId: cuenta.id,
            personaId: persona.id,
            cargo: contactoCargo,
            esPrincipal: true,
            activa: true,
          },
        });
      }

      // 3. Crear Oportunidad en UF
      const op = await tx.oportunidad.create({
        data: {
          nombre: opNombre,
          cuentaId: cuenta.id,
          etapa: opEtapa,
          estado: "abierta",
          valorEstimado: opValor,
          moneda: "UF",
          responsableId: currentUser.id,
        },
      });
      opCreadaId = op.id;

      if (personaId) {
        await tx.contactoOportunidad.create({
          data: {
            oportunidadId: op.id,
            personaId,
            esPrincipal: true,
          },
        });
      }

      // 4. Crear Actividad inicial si vino
      if (actDescripcion) {
        await tx.actividad.create({
          data: {
            cuentaId: cuenta.id,
            oportunidadId: op.id,
            personaId,
            usuarioId: currentUser.id,
            responsable: currentUser.name,
            tipo: "llamada",
            descripcion: actDescripcion,
          },
        });
      }

      // 5. Crear Tarea si vino
      if (tareaTitulo) {
        await tx.tarea.create({
          data: {
            titulo: tareaTitulo,
            cuentaId: cuenta.id,
            oportunidadId: op.id,
            personaId,
            responsableId: currentUser.id,
            tipo: "seguimiento",
            prioridad: "media",
            fechaVencimiento: rawTareaVence ? new Date(rawTareaVence) : null,
            estado: "pendiente",
          },
        });
      }
    });

    revalidatePath("/oportunidades");
    revalidatePath("/oportunidades/pipeline");
    revalidatePath("/cuentas");
  } catch (err) {
    console.error("Error en alta rápida:", err);
    return { error: "Ocurrió un error al procesar el alta rápida." };
  }

  redirect(`/oportunidades/${opCreadaId}`);
}

// ----------------------------------------------------
// ACCIONES RÁPIDAS EN FICHA DE OPORTUNIDAD
// ----------------------------------------------------

export async function cambiarEtapaOportunidadAction(oportunidadId: string, nuevaEtapa: string) {
  await requireAuth();

  await prisma.oportunidad.update({
    where: { id: oportunidadId },
    data: {
      etapa: nuevaEtapa,
      estado: "abierta",
      motivoPerdida: null,
      fechaCierreReal: null,
    },
  });

  revalidatePath(`/oportunidades/${oportunidadId}`);
  revalidatePath("/oportunidades");
  revalidatePath("/oportunidades/pipeline");
}

export async function marcarOportunidadGanadaAction(oportunidadId: string) {
  await requireAuth();

  await prisma.oportunidad.update({
    where: { id: oportunidadId },
    data: {
      estado: "ganada",
      fechaCierreReal: new Date(),
      motivoPerdida: null,
    },
  });

  revalidatePath(`/oportunidades/${oportunidadId}`);
  revalidatePath("/oportunidades");
  revalidatePath("/oportunidades/pipeline");
}

export async function marcarOportunidadPerdidaAction(
  oportunidadId: string,
  prevState: OportunidadActionState | null,
  formData: FormData
): Promise<OportunidadActionState> {
  await requireAuth();

  const motivoPerdida = formData.get("motivoPerdida")?.toString().trim();
  if (!motivoPerdida) {
    return { error: "Debes especificar obligatoriamente el motivo de la pérdida." };
  }

  await prisma.oportunidad.update({
    where: { id: oportunidadId },
    data: {
      estado: "perdida",
      motivoPerdida,
      fechaCierreReal: new Date(),
    },
  });

  revalidatePath(`/oportunidades/${oportunidadId}`);
  revalidatePath("/oportunidades");
  revalidatePath("/oportunidades/pipeline");

  return { success: true };
}

export async function completarTareaConResultadoAction(
  tareaId: string,
  oportunidadId: string | null,
  cuentaId: string,
  prevState: OportunidadActionState | null,
  formData: FormData
): Promise<OportunidadActionState> {
  const currentUser = await requireAuth();

  const tipoGestion = formData.get("tipoGestion")?.toString() || "llamada";
  const resultado = formData.get("resultado")?.toString().trim();

  if (!resultado) {
    return { error: "El resultado de la gestión es obligatorio para cerrar el compromiso." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const tarea = await tx.tarea.update({
        where: { id: tareaId },
        data: {
          estado: "completada",
          completadaEn: new Date(),
        },
      });

      // Crear actividad obligatoria vinculada al cierre de la tarea
      await tx.actividad.create({
        data: {
          cuentaId,
          oportunidadId: oportunidadId || null,
          personaId: tarea.personaId,
          usuarioId: currentUser.id,
          responsable: currentUser.name,
          tipo: tipoGestion,
          descripcion: `[Compromiso completado: ${tarea.titulo}] — ${resultado}`,
        },
      });
    });

    if (oportunidadId) revalidatePath(`/oportunidades/${oportunidadId}`);
    revalidatePath(`/cuentas/${cuentaId}`);
    revalidatePath("/oportunidades/seguimiento");

    return { success: true };
  } catch (err) {
    console.error("Error al completar tarea:", err);
    return { error: "Error al cerrar la tarea." };
  }
}
