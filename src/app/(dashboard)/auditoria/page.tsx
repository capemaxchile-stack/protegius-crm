import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { obtenerConfigAlertas } from "@/lib/alertas-externas";
import { AuditoriaSLAView, ItemAuditoriaSLA } from "./AuditoriaSLAView";
import { ShieldAlert, Sparkles } from "lucide-react";

export default async function AuditoriaSLAPage() {
  const currentUser = await requireAuth();
  const config = obtenerConfigAlertas();

  const [tareas, usuarios] = await Promise.all([
    prisma.tarea.findMany({
      orderBy: [{ estado: "desc" }, { fechaVencimiento: "asc" }],
      take: 150,
      include: {
        cuenta: { select: { id: true, razonSocial: true } },
        responsable: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const ahora = new Date();
  const ventanaPreventivaMs = config.horasAlertaPreventiva * 60 * 60 * 1000;

  const items: ItemAuditoriaSLA[] = tareas.map((t) => {
    // Extraer quién originó la solicitud si viene en etapaRelacionada (ej: "ORIGEN:Camila|ACT:xyz")
    let originador = "Sistema / Directo";
    if (t.etapaRelacionada && t.etapaRelacionada.startsWith("ORIGEN:")) {
      const partes = t.etapaRelacionada.split("|");
      originador = partes[0].replace("ORIGEN:", "").trim() || "Ejecutivo";
    } else if (t.responsable?.name) {
      originador = t.responsable.name;
    }

    let estadoSLA: "vencida" | "por_vencer" | "en_plazo" | "realizada" = "en_plazo";
    let horasRestantes: number | null = null;

    if (t.estado === "completada") {
      estadoSLA = "realizada";
    } else if (t.fechaVencimiento) {
      const diffMs = new Date(t.fechaVencimiento).getTime() - ahora.getTime();
      horasRestantes = Math.round(diffMs / (1000 * 60 * 60));

      if (diffMs < 0) {
        estadoSLA = "vencida";
      } else if (diffMs <= ventanaPreventivaMs) {
        estadoSLA = "por_vencer";
      } else {
        estadoSLA = "en_plazo";
      }
    }

    return {
      id: t.id,
      titulo: t.titulo,
      descripcion: t.descripcion,
      tipo: t.tipo,
      estado: t.estado,
      prioridad: t.prioridad,
      fechaCreacion: t.createdAt,
      fechaVencimiento: t.fechaVencimiento,
      completadaEn: t.completadaEn,
      originador,
      responsable: t.responsable,
      cuenta: t.cuenta,
      estadoSLA,
      horasRestantes,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Auditoría de Interacciones, Flujo & Alertas SLA
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Control Supervisores
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Trazabilidad de compromisos entre vendedores, encargados de cotizaciones y contratos, con semáforo SLA y alertas por Telegram / Correo.
          </p>
        </div>
      </div>

      <AuditoriaSLAView
        items={items}
        usuarios={usuarios}
        config={config}
        isAdmin={currentUser.role === "ADMIN"}
      />
    </div>
  );
}
