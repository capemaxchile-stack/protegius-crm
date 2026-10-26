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
    revalidatePath("/configuracion");
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
  revalidatePath("/configuracion");
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
  revalidatePath("/configuracion");
}

export async function editarUsuarioAction(
  prevState: UserActionState | null,
  formData: FormData
): Promise<UserActionState> {
  const currentAdmin = await requireAdmin();

  const userId = formData.get("userId")?.toString().trim();
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const role = formData.get("role")?.toString() as UserRole;
  const password = formData.get("password")?.toString().trim() || null;

  if (!userId || !name || !email || !role) {
    return { error: "Nombre, correo y rol son obligatorios." };
  }

  if (password && password.length < 8) {
    return { error: "La nueva contraseña debe tener al menos 8 caracteres." };
  }

  try {
    // Verificar si el usuario existe
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return { error: "El usuario no existe." };
    }

    // Si cambió el correo, validar que no esté en uso por otro usuario
    if (email !== targetUser.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email },
      });

      if (emailInUse) {
        return { error: "El correo electrónico ya está registrado por otro usuario." };
      }
    }

    // Prevenir que el admin actual se quite su propio rol de ADMIN si es el único o a sí mismo
    if (currentAdmin.id === userId && role !== "ADMIN") {
      return { error: "No puedes quitarte el rol de Administrador a ti mismo." };
    }

    const updateData: {
      name: string;
      email: string;
      role: UserRole;
      passwordHash?: string;
    } = {
      name,
      email,
      role,
    };

    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    revalidatePath("/usuarios");
    revalidatePath("/configuracion");
    return { success: true };
  } catch (err) {
    console.error("Error al editar usuario:", err);
    return { error: "Ocurrió un error al actualizar los datos del usuario." };
  }
}
