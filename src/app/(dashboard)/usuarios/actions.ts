"use server";

import { requireAdmin, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface UserActionState {
  error?: string;
  success?: boolean;
}

export async function crearUsuarioAction(
  prevState: UserActionState | null,
  formData: FormData
): Promise<UserActionState> {
  await requireAdmin();

  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  const role = formData.get("role")?.toString() as UserRole;

  if (!name || !email || !password || !role) {
    return { error: "Todos los campos son obligatorios." };
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return { error: "Ya existe un usuario registrado con este correo electrónico." };
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        active: true,
      },
    });

    revalidatePath("/usuarios");
    return { success: true };
  } catch (err) {
    console.error("Error al crear usuario:", err);
    return { error: "Ocurrió un error al guardar el nuevo usuario." };
  }
}

export async function toggleEstadoUsuarioAction(userId: string, currentActive: boolean) {
  const currentAdmin = await requireAdmin();

  // Prevenir que el admin se desactive a sí mismo
  if (currentAdmin.id === userId) {
    throw new Error("No puedes desactivar tu propia cuenta de administrador.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { active: !currentActive },
  });

  revalidatePath("/usuarios");
}

export async function resetPasswordUsuarioAction(userId: string, newPassword: string) {
  await requireAdmin();

  if (newPassword.length < 8) {
    throw new Error("La nueva contraseña debe tener al menos 8 caracteres.");
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  revalidatePath("/usuarios");
}
