"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface ContactoActionState {
  error?: string;
  success?: boolean;
}

export async function actualizarContactoAction(
  personaId: string,
  afiliacionId: string | null | undefined,
  cuentaId: string | null | undefined,
  prevState: ContactoActionState | null,
  formData: FormData
): Promise<ContactoActionState> {
  await requireAuth();

  const nombre = formData.get("nombre")?.toString().trim();
  const cargo = formData.get("cargo")?.toString().trim() || null;
  const email = formData.get("email")?.toString().trim().toLowerCase() || null;
  const telefono = formData.get("telefono")?.toString().trim() || null;
  const nota = formData.get("nota")?.toString().trim() || null;
  const afiliacionCargo = formData.get("afiliacionCargo")?.toString().trim() || cargo;

  if (!nombre) {
    return { error: "El nombre completo es obligatorio." };
  }

  // Verificar si otro contacto ya tiene este email
  if (email) {
    const otroConEmail = await prisma.persona.findFirst({
      where: {
        email,
        id: { not: personaId },
      },
    });

    if (otroConEmail) {
      return {
        error: `Ya existe otro contacto registrado con el correo ${email} (${otroConEmail.nombre}).`,
      };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.persona.update({
        where: { id: personaId },
        data: {
          nombre,
          cargo,
          email,
          telefono,
          nota,
        },
      });

      if (afiliacionId) {
        await tx.afiliacion.update({
          where: { id: afiliacionId },
          data: {
            cargo: afiliacionCargo,
          },
        });
      }
    });

    revalidatePath("/contactos");
    if (cuentaId) {
      revalidatePath(`/cuentas/${cuentaId}`);
    }
    return { success: true };
  } catch (err) {
    console.error("Error al actualizar contacto:", err);
    return { error: "Ocurrió un error inesperado al actualizar el contacto." };
  }
}

export async function eliminarContactoAction(
  personaId: string,
  cuentaId?: string | null
): Promise<ContactoActionState> {
  await requireAuth();

  try {
    await prisma.persona.delete({
      where: { id: personaId },
    });

    revalidatePath("/contactos");
    if (cuentaId) {
      revalidatePath(`/cuentas/${cuentaId}`);
    }
    return { success: true };
  } catch (err) {
    console.error("Error al eliminar contacto:", err);
    return { error: "No se pudo eliminar el contacto porque tiene registros vinculados (cotizaciones o firmas)." };
  }
}
