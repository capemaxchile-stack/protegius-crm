import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NavegacionOportunidades } from "@/components/NavegacionOportunidades";
import { ETAPAS_OPORTUNIDAD, formatearUF, formatearFecha } from "@/lib/constants";
import { TrendingUp, Target, Award, DollarSign, Calendar } from "lucide-react";
import Link from "next/link";

export default async function OportunidadesDashboardPage() {
  await requireAuth();

  const [oportunidades, ganadas, perdidas] = await Promise.all([
    prisma.oportunidad.findMany({
      include: { cuenta: true, responsable: true },
      orderBy: { fechaCierreEstimada: "asc" },
    }),
    prisma.oportunidad.count({ where: { estado: "ganada" } }),
    prisma.oportunidad.count({ where: { estado: "perdida" } }),
  ]);

  const abiertas = oportunidades.filter((op) => op.estado === "abierta" || op.estado === "pausada");

  const pipelineTotalUF = abiertas.reduce((acc, op) => acc + (op.valorEstimado || 0), 0);
  const pipelinePonderadoUF = abiertas.reduce(
    (acc, op) => acc + ((op.valorEstimado || 0) * (op.probabilidad || 0)) / 100,
    0
  );

  const totalCerradas = ganadas + perdidas;
  const tasaCierre = totalCerradas > 0 ? Math.round((ganadas / totalCerradas) * 100) : 0;

  const ticketPromedioUF =
    abiertas.length > 0 ? Math.round((pipelineTotalUF / abiertas.length) * 10) / 10 : 0;

  // Próximos cierres estimados
  const proximosCierres = abiertas
    .filter((op) => op.fechaCierreEstimada)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <NavegacionOportunidades />

      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard de Métricas Comerciales</h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
          Resumen ejecutivo del pipeline comercial en UF y rendimiento de ventas.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pipeline Abierto</span>
            <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{formatearUF(pipelineTotalUF)}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {abiertas.length} negocios activos en curso
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pipeline Ponderado</span>
            <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{formatearUF(pipelinePonderadoUF)}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ajustado por probabilidad de éxito</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tasa de Cierre</span>
            <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{tasaCierre}%</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {ganadas} ganadas de {totalCerradas} cerradas
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Ticket Promedio</span>
            <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{formatearUF(ticketPromedioUF)}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Valor medio por oportunidad</p>
        </div>
      </div>

      {/* Stage Breakdown & Closings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Etapa */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Distribución por Etapa Comercial
          </h2>

          <div className="space-y-3">
            {ETAPAS_OPORTUNIDAD.map((etapa) => {
              const opsEnEtapa = abiertas.filter((op) => op.etapa === etapa.id);
              const sumaUF = opsEnEtapa.reduce((acc, op) => acc + (op.valorEstimado || 0), 0);
              const porcentaje = pipelineTotalUF > 0 ? (sumaUF / pipelineTotalUF) * 100 : 0;

              return (
                <div key={etapa.id} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">{etapa.label}</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {opsEnEtapa.length} ops · <strong className="text-slate-900 dark:text-white font-bold">{formatearUF(sumaUF)}</strong>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(porcentaje, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Próximos Cierres */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Próximos Cierres Estimados
          </h2>

          {proximosCierres.length === 0 ? (
            <p className="text-slate-400 text-xs italic">
              No hay oportunidades con fecha estimada de cierre configurada.
            </p>
          ) : (
            <div className="space-y-2.5">
              {proximosCierres.map((op) => (
                <Link
                  key={op.id}
                  href={`/oportunidades/${op.id}`}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs hover:border-blue-500 transition shadow-sm"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{op.nombre}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{op.cuenta.razonSocial}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                        <Calendar className="w-3 h-3" />
                        {formatearFecha(op.fechaCierreEstimada)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-black text-slate-900 dark:text-white">{formatearUF(op.valorEstimado)}</p>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">{op.probabilidad || 10}% prob.</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
