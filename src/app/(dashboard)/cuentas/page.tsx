import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  User,
} from "lucide-react";
import { formatearRUT } from "@/lib/rut";
import { ETAPAS_CUENTA } from "@/lib/constants";
import { Prisma } from "@prisma/client";

export default async function CuentasPage({
  searchParams,
}: {
  searchParams: { q?: string; etapa?: string };
}) {
  await requireAuth();
  const query = searchParams.q?.trim() || "";
  const etapaFiltro = searchParams.etapa || "";

  const whereClause: Prisma.CuentaWhereInput = {};

  if (query) {
    whereClause.OR = [
      { razonSocial: { contains: query, mode: "insensitive" } },
      { rut: { contains: query, mode: "insensitive" } },
      { rubro: { contains: query, mode: "insensitive" } },
    ];
  }

  if (etapaFiltro) {
    whereClause.etapa = etapaFiltro;
  }

  const cuentas = await prisma.cuenta.findMany({
    where: whereClause,
    orderBy: { updatedAt: "desc" },
    include: {
      responsable: { select: { name: true, email: true } },
      afiliaciones: {
        where: { activa: true },
        include: { persona: true },
      },
      _count: {
        select: {
          oportunidades: true,
          actividades: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            <h1 className="text-xl font-bold text-white tracking-tight">Cuentas y Empresas</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Directorio corporativo de prospectos y clientes de Protegius.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/cuentas/importar"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition"
          >
            <span>+ Importar CSV</span>
          </Link>
          <Link
            href="/cuentas/nueva"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cuenta</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <form method="GET" className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            name="q"
            defaultValue={query}
            placeholder="Buscar por razón social, RUT o rubro..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </form>

        <form method="GET" className="w-full sm:w-auto flex items-center gap-2">
          {query && <input type="hidden" name="q" value={query} />}
          <select
            name="etapa"
            defaultValue={etapaFiltro}
            className="w-full sm:w-auto px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todas las etapas</option>
            {ETAPAS_CUENTA.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition"
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-medium">
              <tr>
                <th className="py-3.5 px-4">Empresa / Razón Social</th>
                <th className="py-3.5 px-4">RUT</th>
                <th className="py-3.5 px-4">Etapa Comercial</th>
                <th className="py-3.5 px-4">Contacto Principal</th>
                <th className="py-3.5 px-4">Responsable</th>
                <th className="py-3.5 px-4">Oportunidades</th>
                <th className="py-3.5 px-4 text-right">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {cuentas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-sm font-medium text-slate-300">No se encontraron cuentas</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {query ? "Intenta con otro término de búsqueda." : "Comienza registrando la primera empresa."}
                    </p>
                  </td>
                </tr>
              ) : (
                cuentas.map((c) => {
                  const contactoPrincipal =
                    c.afiliaciones.find((a) => a.esPrincipal)?.persona ||
                    c.afiliaciones[0]?.persona;

                  const etapaObj = ETAPAS_CUENTA.find((e) => e.id === c.etapa);

                  return (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition group">
                      <td className="py-4 px-4 font-semibold text-white">
                        <Link
                          href={`/cuentas/${c.id}`}
                          className="hover:text-blue-400 flex items-center gap-2"
                        >
                          <span>{c.razonSocial}</span>
                          {c.sitioWeb && (
                            <ExternalLink className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition" />
                          )}
                        </Link>
                        {c.rubro && <p className="text-[11px] text-slate-400 font-normal">{c.rubro}</p>}
                      </td>

                      <td className="py-4 px-4 font-mono text-slate-300">
                        {c.rut ? formatearRUT(c.rut) : "—"}
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {etapaObj?.label || c.etapa}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        {contactoPrincipal ? (
                          <div>
                            <p className="font-medium text-slate-200">{contactoPrincipal.nombre}</p>
                            <p className="text-[10px] text-slate-400">{contactoPrincipal.cargo || contactoPrincipal.email || "—"}</p>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Sin contacto</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>{c.responsable?.name || "Sin asignar"}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                          <span>{c._count.oportunidades}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/cuentas/${c.id}`}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
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
