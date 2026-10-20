"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface NotificacionItem {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: "llamada" | "reunion" | "seguimiento" | "correo" | "otro";
  fechaVencimiento: Date | null;
  estado: string;
  prioridad: string;
  cuenta?: {
    id: string;
    razonSocial: string;
  } | null;
  persona?: {
    id: string;
    nombre: string;
    telefono?: string | null;
  } | null;
  esVencida: boolean;
  esHoy: boolean;
}

export interface NotificacionesResumen {
  totalPendientes: number;
  totalHoy: number;
  totalVencidas: number;
  reunionesHoy: number;
  items: NotificacionItem[];
}

export async function obtenerNotificacionesUsuarioAction(): Promise<NotificacionesResumen> {
  const currentUser = await requireAuth();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Buscar tareas pendientes asignadas al usuario (o todas si es ADMIN)
  const whereClause: Record<string, unknown> = {
    estado: "pendiente",
  };

  if (currentUser.role !== "ADMIN") {
    whereClause.responsableId = currentUser.id;
  }

  const tareas = await prisma.tarea.findMany({
    where: whereClause,
    include: {
      cuenta: {
        select: {
          id: true,
          razonSocial: true,
        },
      },
      persona: {
        select: {
          id: true,
          nombre: true,
          telefono: true,
        },
      },
    },
    orderBy: [
      { fechaVencimiento: "asc" },
      { prioridad: "desc" },
    ],
    take: 30,
  });

  let totalHoy = 0;
  let totalVencidas = 0;
  let reunionesHoy = 0;

  const items: NotificacionItem[] = tareas.map((t) => {
    let esVencida = false;
    let esHoy = false;

    if (t.fechaVencimiento) {
      const fecha = new Date(t.fechaVencimiento);
      if (fecha < startOfToday) {
        esVencida = true;
        totalVencidas++;
      } else if (fecha >= startOfToday && fecha <= endOfToday) {
        esHoy = true;
        totalHoy++;
        if (t.tipo === "reunion") {
          reunionesHoy++;
        }
      }
    }

    return {
      id: t.id,
      titulo: t.titulo,
      descripcion: t.descripcion,
      tipo: (t.tipo as "llamada" | "reunion" | "seguimiento" | "correo" | "otro") || "seguimiento",
      fechaVencimiento: t.fechaVencimiento,
      estado: t.estado,
      prioridad: t.prioridad,
      cuenta: t.cuenta,
      persona: t.persona,
      esVencida,
      esHoy,
    };
  });

  return {
    totalPendientes: items.length,
    totalHoy,
    totalVencidas,
    reunionesHoy,
    items,
  };
}

export async function completarTareaNotificacionAction(tareaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await requireAuth();

    const tarea = await prisma.tarea.findUnique({
      where: { id: tareaId },
    });

    if (!tarea) {
      return { success: false, error: "Tarea no encontrada." };
    }

    // Extraer actividad vinculada si existe en etapaRelacionada (ej: "ORIGEN:Nombre|ACT:id")
    let actividadVinculadaId: string | null = null;
    if (tarea.etapaRelacionada && tarea.etapaRelacionada.includes("ACT:")) {
      const partes = tarea.etapaRelacionada.split("ACT:");
      actividadVinculadaId = partes[1]?.trim() || null;
    }

    await prisma.$transaction([
      prisma.tarea.update({
        where: { id: tareaId },
        data: {
          estado: "completada",
          completadaEn: new Date(),
        },
      }),
      ...(actividadVinculadaId
        ? [
            prisma.actividad.updateMany({
              where: { id: actividadVinculadaId },
              data: { estadoPaso: "hecho" },
            }),
          ]
        : []),
      // Si la tarea tenía cuenta asociada, registrar en la bitácora como realizada
      ...(tarea.cuentaId
        ? [
            prisma.actividad.create({
              data: {
                cuentaId: tarea.cuentaId,
                personaId: tarea.personaId || null,
                usuarioId: currentUser.id,
                responsable: currentUser.name,
                tipo: tarea.tipo === "llamada" ? "llamada" : tarea.tipo === "reunion" ? "reunion" : "nota",
                descripcion: `[✓ Compromiso Realizado] "${tarea.titulo}"`,
                fechaRealizada: new Date(),
                estadoPaso: "hecho",
              },
            }),
          ]
        : []),
    ]);

    revalidatePath("/prospeccion");
    revalidatePath("/reuniones");
    revalidatePath("/auditoria");
    revalidatePath("/oportunidades/pipeline");
    revalidatePath("/cuentas");

    return { success: true };
  } catch (error) {
    console.error("Error completando tarea:", error);
    return { success: false, error: "No se pudo completar la tarea." };
  }
}
