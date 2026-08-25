import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NavegacionOportunidades } from "@/components/NavegacionOportunidades";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  Calendar,
  Building2,
} from "lucide-react";
import { formatearFecha } from "@/lib/constants";

export default async function SeguimientoPage() {
  await requireAuth();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const in7Days = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [tareasVencidas, tareasHoy, tareasProximas, actividadesRecientes] =
    await Promise.all([
      prisma.tarea.findMany({
        where: {
          estado: "pendiente",
          fechaVencimiento: { lt: startOfToday },
        },
        orderBy: { fechaVencimiento: "asc" },
        include: { cuenta: true, oportunidad: true, responsable: true },
      }),
      prisma.tarea.findMany({
        where: {
          estado: "pendiente",
          fechaVencimiento: { gte: startOfToday, lte: endOfToday },
        },
        orderBy: { prioridad: "desc" },
        include: { cuenta: true, oportunidad: true, responsable: true },
      }),
      prisma.tarea.findMany({
        where: {
          estado: "pendiente",
          fechaVencimiento: { gt: endOfToday, lte: in7Days },
        },
        orderBy: { fechaVencimiento: "asc" },
        include: { cuenta: true, oportunidad: true, responsable: true },
      }),
      prisma.actividad.findMany({
        orderBy: { fechaRealizada: "desc" },
        take: 15,
        include: { cuenta: true, oportunidad: true, persona: true },
      }),
    ]);

  return (
    <div className="space-y-6">
      <NavegacionOportunidades />

      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Seguimiento Comercial Diario</h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
          Control de compromisos, llamadas pendientes y actividades recientes.
        </p>
      </div>

      {/* Task Buckets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bucket 1: Vencidas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider">Vencidas ({tareasVencidas.length})</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[10px] font-bold border border-rose-200 dark:border-rose-500/20">
              Urgente
            </span>
          </div>

          {tareasVencidas.length === 0 ? (
            <p className="text-slate-400 text-xs italic text-center py-6">No hay tareas vencidas. ¡Excelente!</p>
          ) : (
            <div className="space-y-2.5">
              {tareasVencidas.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-rose-50/50 dark:bg-slate-950 border border-rose-200 dark:border-rose-900/30 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{t.titulo}</span>
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                      {formatearFecha(t.fechaVencimiento)}
                    </span>
                  </div>

                  {t.cuenta && (
                    <Link
                      href={`/cuentas/${t.cuentaId}`}
                      className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 font-medium"
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

        {/* Bucket 2: Para Hoy */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider">Para Hoy ({tareasHoy.length})</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold border border-amber-200 dark:border-amber-500/20">
              Prioridad
            </span>
          </div>

          {tareasHoy.length === 0 ? (
            <p className="text-slate-400 text-xs italic text-center py-6">No hay compromisos agendados para hoy.</p>
          ) : (
            <div className="space-y-2.5">
              {tareasHoy.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-amber-50/50 dark:bg-slate-950 border border-amber-200 dark:border-amber-900/30 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{t.titulo}</span>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Hoy</span>
                  </div>

                  {t.cuenta && (
                    <Link
                      href={`/cuentas/${t.cuentaId}`}
                      className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 font-medium"
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

        {/* Bucket 3: Próximos 7 días */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Calendar className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider">
                Próximos 7 Días ({tareasProximas.length})
              </h2>
            </div>
          </div>

          {tareasProximas.length === 0 ? (
            <p className="text-slate-400 text-xs italic text-center py-6">Sin tareas para los próximos 7 días.</p>
          ) : (
            <div className="space-y-2.5">
              {tareasProximas.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{t.titulo}</span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      {formatearFecha(t.fechaVencimiento)}
                    </span>
                  </div>

                  {t.cuenta && (
                    <Link
                      href={`/cuentas/${t.cuentaId}`}
                      className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 font-medium"
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

      {/* Actividades Recientes */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Bitácora de Interacciones Recientes
        </h2>

        <div className="space-y-3">
          {actividadesRecientes.map((act) => (
            <div
              key={act.id}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 capitalize">
                    {act.tipo}
                  </span>
                  <Link
                    href={`/cuentas/${act.cuentaId}`}
                    className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {act.cuenta.razonSocial}
                  </Link>
                  {act.oportunidad && (
                    <span className="text-slate-500 dark:text-slate-400">
                      · Negocio: <strong className="text-slate-800 dark:text-slate-300">{act.oportunidad.nombre}</strong>
                    </span>
                  )}
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-xs">{act.descripcion}</p>
              </div>

              <div className="text-right text-[11px] text-slate-500 shrink-0">
                <p className="font-medium">{formatearFecha(act.fechaRealizada)}</p>
                <p className="text-slate-500 dark:text-slate-400">{act.responsable || "Ejecutivo"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
