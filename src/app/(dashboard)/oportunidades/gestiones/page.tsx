import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NavegacionOportunidades } from "@/components/NavegacionOportunidades";
import { GestionTempranaForm } from "./GestionTempranaForm";
import Link from "next/link";
import { Building2, Clock } from "lucide-react";
import { formatearFecha } from "@/lib/constants";

export default async function GestionesPage({
  searchParams,
}: {
  searchParams: { ok?: string };
}) {
  await requireAuth();

  const cuentas = await prisma.cuenta.findMany({
    orderBy: { razonSocial: "asc" },
    select: {
      id: true,
      razonSocial: true,
      afiliaciones: {
        where: { activa: true },
        select: {
          persona: {
            select: {
              id: true,
              nombre: true,
              cargo: true,
            },
          },
        },
      },
    },
  });

  // Gestiones sin oportunidad (actividades donde oportunidadId es null)
  const gestionesSinOp = await prisma.actividad.findMany({
    where: { oportunidadId: null },
    orderBy: { fechaRealizada: "desc" },
    take: 20,
    include: {
      cuenta: true,
      persona: true,
    },
  });

  // Compromisos sin oportunidad (tareas donde oportunidadId es null y pendientes)
  const compromisosSinOp = await prisma.tarea.findMany({
    where: {
      oportunidadId: null,
      estado: "pendiente",
    },
    orderBy: { fechaVencimiento: "asc" },
    take: 20,
    include: {
      cuenta: true,
      persona: true,
    },
  });

  return (
    <div className="space-y-6">
      {/* Navigation Sub-menu */}
      <NavegacionOportunidades />

      {/* Main interactive form */}
      <GestionTempranaForm
        cuentas={cuentas}
        resetKey={searchParams.ok || "initial"}
        okMessage={Boolean(searchParams.ok)}
      />

      {/* 2-Columns for Recent Gestiones & Pending Commitments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gestiones Recientes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Gestiones sin Oportunidad ({gestionesSinOp.length})
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Últimas 20 interacciones</span>
          </div>

          {gestionesSinOp.length === 0 ? (
            <p className="text-slate-500 text-xs italic">No hay gestiones tempranas registradas.</p>
          ) : (
            <div className="space-y-3">
              {gestionesSinOp.map((g) => (
                <div
                  key={g.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/cuentas/${g.cuentaId}`}
                      className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5"
                    >
                      <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{g.cuenta.razonSocial}</span>
                    </Link>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formatearFecha(g.fechaRealizada)}
                    </span>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                    <span className="font-bold text-blue-600 dark:text-blue-400 capitalize mr-1.5">[{g.tipo}]</span>
                    {g.descripcion}
                  </p>

                  {g.persona && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Contacto: <span className="text-slate-800 dark:text-slate-300 font-semibold">{g.persona.nombre}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compromisos Pendientes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Compromisos de Seguimiento ({compromisosSinOp.length})
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Tareas sin oportunidad formal</span>
          </div>

          {compromisosSinOp.length === 0 ? (
            <p className="text-slate-500 text-xs italic">No hay compromisos pendientes.</p>
          ) : (
            <div className="space-y-3">
              {compromisosSinOp.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{t.titulo}</span>
                    {t.fechaVencimiento && (
                      <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatearFecha(t.fechaVencimiento)}
                      </span>
                    )}
                  </div>

                  {t.cuenta && (
                    <Link
                      href={`/cuentas/${t.cuentaId}`}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{t.cuenta.razonSocial}</span>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
