"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validarRUT, limpiarRUT } from "@/lib/rut";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface ActionState {
  error?: string;
  success?: boolean;
  cuentaId?: string;
}

// ----------------------------------------------------
// CUENTAS
// ----------------------------------------------------

export async function crearCuentaAction(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const currentUser = await requireAuth();

  const razonSocial = formData.get("razonSocial")?.toString().trim();
  const rawRut = formData.get("rut")?.toString().trim();
  const tipo = formData.get("tipo")?.toString().trim() || "empresa";
  const rubro = formData.get("rubro")?.toString().trim() || null;
  const sitioWeb = formData.get("sitioWeb")?.toString().trim() || null;
  const origenLead = formData.get("origenLead")?.toString().trim() || null;
  const etapa = formData.get("etapa")?.toString().trim() || "nuevo";
  const responsableId = formData.get("responsableId")?.toString().trim() || currentUser.id;
  const notas = formData.get("notas")?.toString().trim() || null;

  // Contacto rápido opcional
  const contactoNombre = formData.get("contactoNombre")?.toString().trim();
  const contactoCargo = formData.get("contactoCargo")?.toString().trim() || null;
  const contactoEmail = formData.get("contactoEmail")?.toString().trim().toLowerCase() || null;
  const contactoTelefono = formData.get("contactoTelefono")?.toString().trim() || null;

  if (!razonSocial) {
    return { error: "La razón social o nombre de la empresa es obligatorio." };
  }

  let rutLimpio: string | null = null;
  if (rawRut) {
    if (!validarRUT(rawRut)) {
      return { error: "El RUT ingresado no es válido (algoritmo Módulo 11)." };
    }
    rutLimpio = limpiarRUT(rawRut);

    // Validar duplicidad de RUT
    const existente = await prisma.cuenta.findFirst({
      where: { rut: rutLimpio },
    });
    if (existente) {
      return { error: `Ya existe una cuenta con el RUT ingresado (${existente.razonSocial}).` };
    }
  }

  let nuevaCuentaId = "";

  try {
    await prisma.$transaction(async (tx) => {
      const cuenta = await tx.cuenta.create({
        data: {
          razonSocial,
          rut: rutLimpio,
          tipo,
          rubro,
          sitioWeb,
          origenLead,
          etapa,
          responsableId: responsableId || null,
          notas,
        },
      });

      nuevaCuentaId = cuenta.id;

      // Si se incluyó contacto rápido
      if (contactoNombre) {
        let personaId = "";

        if (contactoEmail) {
          const personaExistente = await tx.persona.findFirst({
            where: { email: contactoEmail },
          });
          if (personaExistente) {
            personaId = personaExistente.id;
          }
        }

        if (!personaId) {
          const nuevaPersona = await tx.persona.create({
            data: {
              nombre: contactoNombre,
              cargo: contactoCargo,
              email: contactoEmail,
              telefono: contactoTelefono,
            },
          });
          personaId = nuevaPersona.id;
        }

        await tx.afiliacion.create({
          data: {
            cuentaId: cuenta.id,
            personaId,
            cargo: contactoCargo,
            esPrincipal: true,
            activa: true,
          },
        });
      }
    });

    revalidatePath("/cuentas");
  } catch (err) {
    console.error("Error al crear cuenta:", err);
    return { error: "Ocurrió un error inesperado al guardar la cuenta." };
  }

  redirect(`/cuentas/${nuevaCuentaId}`);
}

export async function actualizarCuentaAction(
  cuentaId: string,
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  await requireAuth();

  const razonSocial = formData.get("razonSocial")?.toString().trim();
  const rawRut = formData.get("rut")?.toString().trim();
  const tipo = formData.get("tipo")?.toString().trim() || "empresa";
  const rubro = formData.get("rubro")?.toString().trim() || null;
  const sitioWeb = formData.get("sitioWeb")?.toString().trim() || null;
  const origenLead = formData.get("origenLead")?.toString().trim() || null;
  const etapa = formData.get("etapa")?.toString().trim() || "nuevo";
  const responsableId = formData.get("responsableId")?.toString().trim() || null;
  const notas = formData.get("notas")?.toString().trim() || null;

  if (!razonSocial) {
    return { error: "La razón social es obligatoria." };
  }

  let rutLimpio: string | null = null;
  if (rawRut) {
    if (!validarRUT(rawRut)) {
      return { error: "El RUT ingresado no es válido." };
    }
    rutLimpio = limpiarRUT(rawRut);

    const existente = await prisma.cuenta.findFirst({
      where: {
        rut: rutLimpio,
        id: { not: cuentaId },
      },
    });
    if (existente) {
      return { error: `Ya existe otra cuenta con este RUT (${existente.razonSocial}).` };
    }
  }

  try {
    await prisma.cuenta.update({
      where: { id: cuentaId },
      data: {
        razonSocial,
        rut: rutLimpio,
        tipo,
        rubro,
        sitioWeb,
        origenLead,
        etapa,
        responsableId,
        notas,
      },
    });

    revalidatePath(`/cuentas/${cuentaId}`);
    revalidatePath("/cuentas");
  } catch (err) {
    console.error("Error al actualizar cuenta:", err);
    return { error: "Error al actualizar los datos de la cuenta." };
  }

  redirect(`/cuentas/${cuentaId}`);
}

// ----------------------------------------------------
// CONTACTOS Y AFILIACIONES
// ----------------------------------------------------

export async function agregarContactoNuevoAction(
  cuentaId: string,
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  await requireAuth();

  const nombre = formData.get("nombre")?.toString().trim();
  const cargo = formData.get("cargo")?.toString().trim() || null;
  const email = formData.get("email")?.toString().trim().toLowerCase() || null;
  const telefono = formData.get("telefono")?.toString().trim() || null;
  const nota = formData.get("nota")?.toString().trim() || null;
  const esPrincipal = formData.get("esPrincipal") === "on";

  if (!nombre) {
    return { error: "El nombre del contacto es obligatorio." };
  }

  if (email) {
    const personaConEmail = await prisma.persona.findFirst({
      where: { email },
    });
    if (personaConEmail) {
      return {
        error: `Ya existe una persona registrada con el correo ${email} (${personaConEmail.nombre}). Usa la opción 'Vincular contacto existente'.`,
      };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Si se marca como principal, desmarcar a otros
      if (esPrincipal) {
        await tx.afiliacion.updateMany({
          where: { cuentaId, esPrincipal: true },
          data: { esPrincipal: false },
        });
      }

      const persona = await tx.persona.create({
        data: {
          nombre,
          cargo,
          email,
          telefono,
          nota,
        },
      });

      await tx.afiliacion.create({
        data: {
          cuentaId,
          personaId: persona.id,
          cargo,
          esPrincipal,
          activa: true,
        },
      });
    });

    revalidatePath(`/cuentas/${cuentaId}`);
    revalidatePath("/contactos");
    return { success: true };
  } catch (err) {
    console.error("Error al agregar contacto:", err);
    return { error: "Error al crear y asociar el contacto." };
  }
}

export async function vincularContactoExistenteAction(
  cuentaId: string,
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  await requireAuth();

  const personaId = formData.get("personaId")?.toString().trim();
  const cargo = formData.get("cargo")?.toString().trim() || null;
  const esPrincipal = formData.get("esPrincipal") === "on";

  if (!personaId) {
    return { error: "Debes seleccionar un contacto existente." };
  }

  try {
    const existeAfiliacion = await prisma.afiliacion.findUnique({
      where: {
        cuentaId_personaId: {
          cuentaId,
          personaId,
        },
      },
    });

    if (existeAfiliacion) {
      return { error: "Esta persona ya está vinculada a esta empresa." };
    }

    await prisma.$transaction(async (tx) => {
      if (esPrincipal) {
        await tx.afiliacion.updateMany({
          where: { cuentaId, esPrincipal: true },
          data: { esPrincipal: false },
        });
      }

      await tx.afiliacion.create({
        data: {
          cuentaId,
          personaId,
          cargo,
          esPrincipal,
          activa: true,
        },
      });
    });

    revalidatePath(`/cuentas/${cuentaId}`);
    revalidatePath("/contactos");
    return { success: true };
  } catch (err) {
    console.error("Error al vincular contacto:", err);
    return { error: "No se pudo vincular el contacto." };
  }
}

export async function toggleEstadoContactoAction(afiliacionId: string, cuentaId: string, activaActual: boolean) {
  await requireAuth();

  await prisma.afiliacion.update({
    where: { id: afiliacionId },
    data: {
      activa: !activaActual,
      // Si se desactiva, pierde la marca de principal automáticamente
      esPrincipal: !activaActual ? false : undefined,
      fechaFin: !activaActual ? new Date() : null,
    },
  });

  revalidatePath(`/cuentas/${cuentaId}`);
}

export async function marcarContactoPrincipalAction(afiliacionId: string, cuentaId: string) {
  await requireAuth();

  await prisma.$transaction([
    prisma.afiliacion.updateMany({
      where: { cuentaId, esPrincipal: true },
      data: { esPrincipal: false },
    }),
    prisma.afiliacion.update({
      where: { id: afiliacionId },
      data: { esPrincipal: true, activa: true },
    }),
  ]);

  revalidatePath(`/cuentas/${cuentaId}`);
}

// ----------------------------------------------------
// ACTIVIDADES RÁPIDAS EN CUENTA
// ----------------------------------------------------

export async function registrarActividadCuentaAction(
  cuentaId: string,
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const currentUser = await requireAuth();

  const tipo = formData.get("tipo")?.toString() || "llamada";
  const descripcion = formData.get("descripcion")?.toString().trim();
  const personaId = formData.get("personaId")?.toString().trim() || null;
  const proximoPaso = formData.get("proximoPaso")?.toString().trim() || null;
  const rawFechaPaso = formData.get("fechaProximoPaso")?.toString().trim();

  if (!descripcion) {
    return { error: "El detalle de lo conversado o realizado es obligatorio." };
  }

  const fechaProximoPaso = rawFechaPaso ? new Date(rawFechaPaso) : null;

  try {
    await prisma.actividad.create({
      data: {
        cuentaId,
        tipo,
        descripcion,
        personaId: personaId || null,
        usuarioId: currentUser.id,
        responsable: currentUser.name,
        proximoPaso,
        fechaProximoPaso,
        estadoPaso: proximoPaso ? "pendiente" : null,
      },
    });

    revalidatePath(`/cuentas/${cuentaId}`);
    return { success: true };
  } catch (err) {
    console.error("Error al registrar actividad:", err);
    return { error: "No se pudo registrar la actividad." };
  }
}
