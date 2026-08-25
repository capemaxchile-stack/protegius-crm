import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { NavegacionOportunidades } from "@/components/NavegacionOportunidades";
import { ETAPAS_OPORTUNIDAD, formatearUF } from "@/lib/constants";
import { Building2, User, CheckCircle2, XCircle } from "lucide-react";

export default async function PipelinePage() {
  await requireAuth();

  const oportunidades = await prisma.oportunidad.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      cuenta: true,
      responsable: true,
    },
  });

  return (
    <div className="space-y-6">
      {/* Sub-navbar */}
      <NavegacionOportunidades />

      {/* Pipeline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Pipeline Comercial (Kanban)</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Tablero visual de negocios por etapas de venta en UF.
          </p>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex gap-4 overflow-x-auto pb-6 min-h-[calc(100vh-280px)]">
        {ETAPAS_OPORTUNIDAD.map((etapa) => {
          // Oportunidades abiertas o pausadas en esta etapa
          const opsEnEtapa = oportunidades.filter(
            (op) => op.etapa === etapa.id && (op.estado === "abierta" || op.estado === "pausada")
          );

          const totalUFEtapa = opsEnEtapa.reduce(
            (acc, op) => acc + (op.valorEstimado || 0),
            0
          );

          return (
            <div
              key={etapa.id}
              className="w-72 shrink-0 bg-slate-100/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col max-h-[75vh]"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-950/40 rounded-t-2xl">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500" />
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate">{etapa.label}</h3>
                  </div>
                  <p className="text-[11px] font-black text-blue-600 dark:text-blue-400 mt-0.5">
                    {formatearUF(totalUFEtapa)}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 text-[10px] font-bold">
                  {opsEnEtapa.length}
                </span>
              </div>

              {/* Cards list */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1">
                {opsEnEtapa.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs italic">
                    Sin negocios en esta etapa
                  </div>
                ) : (
                  opsEnEtapa.map((op) => (
                    <Link
                      key={op.id}
                      href={`/oportunidades/${op.id}`}
                      className="block p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:shadow-md transition duration-150 group shadow-sm"
                    >
                      <p className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug">
                        {op.nombre}
                      </p>

                      <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 truncate">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{op.cuenta.razonSocial}</span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between text-xs">
                        <span className="font-black text-slate-900 dark:text-white text-xs">
                          {formatearUF(op.valorEstimado)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                          {op.probabilidad || 10}%
                        </span>
                      </div>

                      {op.responsable && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{op.responsable.name}</span>
                        </div>
                      )}
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}

        {/* Columna Ganadas */}
        <div className="w-72 shrink-0 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl flex flex-col max-h-[75vh]">
          <div className="p-3.5 border-b border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between bg-emerald-100/50 dark:bg-emerald-950/40 rounded-t-2xl">
            <div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-xs text-emerald-800 dark:text-emerald-300">Ganadas</h3>
              </div>
              <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatearUF(
                  oportunidades
                    .filter((op) => op.estado === "ganada")
                    .reduce((acc, op) => acc + (op.valorEstimado || 0), 0)
                )}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
              {oportunidades.filter((op) => op.estado === "ganada").length}
            </span>
          </div>

          <div className="p-3 space-y-3 overflow-y-auto flex-1">
            {oportunidades
              .filter((op) => op.estado === "ganada")
              .map((op) => (
                <Link
                  key={op.id}
                  href={`/oportunidades/${op.id}`}
                  className="block p-3 rounded-xl bg-white dark:bg-slate-950/90 border border-emerald-200 dark:border-emerald-900/30 hover:border-emerald-500 transition shadow-sm"
                >
                  <p className="font-bold text-xs text-slate-900 dark:text-white">{op.nombre}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 truncate">{op.cuenta.razonSocial}</p>
                  <p className="font-black text-emerald-600 dark:text-emerald-400 text-xs mt-2">{formatearUF(op.valorEstimado)}</p>
                </Link>
              ))}
          </div>
        </div>

        {/* Columna Perdidas */}
        <div className="w-72 shrink-0 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl flex flex-col max-h-[75vh]">
          <div className="p-3.5 border-b border-rose-200 dark:border-rose-900/40 flex items-center justify-between bg-rose-100/50 dark:bg-rose-950/40 rounded-t-2xl">
            <div>
              <div className="flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <h3 className="font-bold text-xs text-rose-800 dark:text-rose-300">Perdidas</h3>
              </div>
              <p className="text-[11px] font-black text-rose-600 dark:text-rose-400 mt-0.5">
                {formatearUF(
                  oportunidades
                    .filter((op) => op.estado === "perdida")
                    .reduce((acc, op) => acc + (op.valorEstimado || 0), 0)
                )}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 text-[10px] font-bold">
              {oportunidades.filter((op) => op.estado === "perdida").length}
            </span>
          </div>

          <div className="p-3 space-y-3 overflow-y-auto flex-1">
            {oportunidades
              .filter((op) => op.estado === "perdida")
              .map((op) => (
                <Link
                  key={op.id}
                  href={`/oportunidades/${op.id}`}
                  className="block p-3 rounded-xl bg-white dark:bg-slate-950/90 border border-rose-200 dark:border-rose-900/30 hover:border-rose-500 transition opacity-90 shadow-sm"
                >
                  <p className="font-bold text-xs text-slate-900 dark:text-white">{op.nombre}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 truncate">{op.cuenta.razonSocial}</p>
                  <p className="font-black text-rose-600 dark:text-rose-400 text-xs mt-2">{formatearUF(op.valorEstimado)}</p>
                  {op.motivoPerdida && (
                    <p className="text-[10px] text-rose-700 dark:text-rose-300 mt-1 italic line-clamp-2">
                      &quot;{op.motivoPerdida}&quot;
                    </p>
                  )}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
