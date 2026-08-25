"use server";

import { comparePassword, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export interface LoginState {
  error?: string;
  success?: boolean;
}

export async function loginAction(
  prevState: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  const redirectTo = formData.get("redirectTo")?.toString() || "/";

  if (!email || !password) {
    return { error: "Por favor, ingresa tu correo y contraseña." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: "Credenciales inválidas. Verifica tu correo y contraseña." };
    }

    if (!user.active) {
      return { error: "Tu cuenta ha sido desactivada. Contacta al administrador." };
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return { error: "Credenciales inválidas. Verifica tu correo y contraseña." };
    }

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (err) {
    console.error("Error en login:", err);
    return { error: "Ocurrió un error inesperado al iniciar sesión. Intenta nuevamente." };
  }

  redirect(redirectTo);
}
