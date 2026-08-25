import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { NavegacionOportunidades } from "@/components/NavegacionOportunidades";
import {
  TrendingUp,
  Plus,
  Search,
  Building2,
  ChevronRight,
  User,
  Zap,
} from "lucide-react";
import { formatearUF, ETAPAS_OPORTUNIDAD, ESTADOS_OPORTUNIDAD } from "@/lib/constants";
import { Prisma } from "@prisma/client";

export default async function OportunidadesPage({
  searchParams,
}: {
  searchParams: { q?: string; etapa?: string; estado?: string };
}) {
  await requireAuth();
  const query = searchParams.q?.trim() || "";
  const etapaFiltro = searchParams.etapa || "";
  const estadoFiltro = searchParams.estado || "";

  const whereClause: Prisma.OportunidadWhereInput = {};

  if (query) {
    whereClause.OR = [
      { nombre: { contains: query, mode: "insensitive" } },
      { cuenta: { razonSocial: { contains: query, mode: "insensitive" } } },
    ];
  }

  if (etapaFiltro) {
    whereClause.etapa = etapaFiltro;
  }

  if (estadoFiltro) {
    whereClause.estado = estadoFiltro;
  }

  const oportunidades = await prisma.oportunidad.findMany({
    where: whereClause,
    orderBy: { updatedAt: "desc" },
    include: {
      cuenta: true,
      responsable: { select: { name: true } },
      _count: {
        select: {
          actividades: true,
          tareas: true,
          propuestas: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Sub-navbar */}
      <NavegacionOportunidades />

      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Oportunidades Comerciales</h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Gestión y seguimiento de negocios y propuestas en UF.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/oportunidades/alta-rapida"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 shadow-sm transition"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Alta Rápida</span>
          </Link>
          <Link
            href="/oportunidades/nueva"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Oportunidad</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <form method="GET" className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            name="q"
            defaultValue={query}
            placeholder="Buscar por negocio o empresa..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </form>

        <form method="GET" className="w-full sm:w-auto flex items-center gap-2">
          {query && <input type="hidden" name="q" value={query} />}
          <select
            name="etapa"
            defaultValue={etapaFiltro}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todas las etapas</option>
            {ETAPAS_OPORTUNIDAD.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>

          <select
            name="estado"
            defaultValue={estadoFiltro}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value={ESTADOS_OPORTUNIDAD.ABIERTA}>Abierta</option>
            <option value={ESTADOS_OPORTUNIDAD.GANADA}>Ganada</option>
            <option value={ESTADOS_OPORTUNIDAD.PERDIDA}>Perdida</option>
            <option value={ESTADOS_OPORTUNIDAD.PAUSADA}>Pausada</option>
          </select>

          <button
            type="submit"
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition"
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Oportunidad / Negocio</th>
                <th className="py-3.5 px-4">Empresa</th>
                <th className="py-3.5 px-4">Etapa</th>
                <th className="py-3.5 px-4">Valor Estimado</th>
                <th className="py-3.5 px-4">Probabilidad</th>
                <th className="py-3.5 px-4">Responsable</th>
                <th className="py-3.5 px-4 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {oportunidades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No se encontraron oportunidades</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {query ? "Intenta con otro filtro." : "Crea tu primera oportunidad comercial o usa Alta Rápida."}
                    </p>
                  </td>
                </tr>
              ) : (
                oportunidades.map((op) => {
                  const etapaObj = ETAPAS_OPORTUNIDAD.find((e) => e.id === op.etapa);

                  return (
                    <tr key={op.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition group">
                      <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                        <Link
                          href={`/oportunidades/${op.id}`}
                          className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5"
                        >
                          <span>{op.nombre}</span>
                        </Link>
                      </td>

                      <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-300">
                        <Link
                          href={`/cuentas/${op.cuentaId}`}
                          className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5"
                        >
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{op.cuenta.razonSocial}</span>
                        </Link>
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {etapaObj?.label || op.etapa.replace(/_/g, " ")}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-black text-slate-900 dark:text-white">
                        {formatearUF(op.valorEstimado)}
                      </td>

                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 dark:bg-blue-500 h-full rounded-full"
                              style={{ width: `${op.probabilidad || 10}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{op.probabilidad || 10}%</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{op.responsable?.name || "Sin asignar"}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/oportunidades/${op.id}`}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
