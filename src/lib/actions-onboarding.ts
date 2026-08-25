"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function togglePasoOnboardingAction(
  pasoId: string,
  onboardingId: string,
  estadoActual: string
) {
  await requireAuth();

  const nuevoEstado = estadoActual === "completado" ? "pendiente" : "completado";
  const completadoEn = nuevoEstado === "completado" ? new Date() : null;

  await prisma.$transaction(async (tx) => {
    // 1. Actualizar el paso
    await tx.pasoOnboarding.update({
      where: { id: pasoId },
      data: {
        estado: nuevoEstado,
        completadoEn,
      },
    });

    // 2. Verificar si todos los pasos del onboarding están completados
    const todosLosPasos = await tx.pasoOnboarding.findMany({
      where: { onboardingId },
    });

    const todosCompletos = todosLosPasos.every(
      (p) => (p.id === pasoId ? nuevoEstado === "completado" : p.estado === "completado")
    );

    if (todosCompletos) {
      await tx.onboardingCliente.update({
        where: { id: onboardingId },
        data: {
          estado: "completado",
          fechaAltaReal: new Date(),
        },
      });

      // Activar los servicios del cliente a estado 'activo'
      await tx.servicioCliente.updateMany({
        where: { onboardingId },
        data: {
          estado: "activo",
          fechaInicio: new Date(),
        },
      });
    } else {
      // Si se desmarcó alguno, volver a en_proceso
      await tx.onboardingCliente.update({
        where: { id: onboardingId },
        data: {
          estado: "en_proceso",
          fechaAltaReal: null,
        },
      });
    }
  });

  revalidatePath(`/onboarding/${onboardingId}`);
  revalidatePath("/onboarding");
}

export async function cambiarEstadoOnboardingAction(
  onboardingId: string,
  nuevoEstado: "no_iniciado" | "en_proceso" | "bloqueado" | "completado" | "cancelado"
) {
  await requireAuth();

  await prisma.onboardingCliente.update({
    where: { id: onboardingId },
    data: { estado: nuevoEstado },
  });

  revalidatePath(`/onboarding/${onboardingId}`);
  revalidatePath("/onboarding");
}
