"use server";

import { requireAuth, comparePassword, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function cambiarMiPasswordAction(
  passwordActual: string,
  nuevaPassword: string,
  confirmarPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();

    if (!passwordActual || !nuevaPassword || !confirmarPassword) {
      return { success: false, error: "Todos los campos son obligatorios." };
    }

    if (nuevaPassword.length < 8) {
      return {
        success: false,
        error: "La nueva contraseña debe tener al menos 8 caracteres.",
      };
    }

    if (nuevaPassword !== confirmarPassword) {
      return {
        success: false,
        error: "La nueva contraseña y su confirmación no coinciden.",
      };
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!dbUser) {
      return { success: false, error: "Usuario no encontrado." };
    }

    const passwordValida = await comparePassword(passwordActual, dbUser.passwordHash);
    if (!passwordValida) {
      return { success: false, error: "La contraseña actual no es correcta." };
    }

    const nuevoHash = await hashPassword(nuevaPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: nuevoHash },
    });

    return { success: true };
  } catch (err) {
    console.error("Error al cambiar contraseña de usuario:", err);
    return {
      success: false,
      error: "Ocurrió un error inesperado al actualizar la contraseña.",
    };
  }
}
