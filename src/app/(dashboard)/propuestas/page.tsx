import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  FileSpreadsheet,
  Plus,
  Search,
  ChevronRight,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
} from "lucide-react";
import { formatearUF, formatearFecha } from "@/lib/constants";
import { Prisma } from "@prisma/client";

export default async function PropuestasPage({
  searchParams,
}: {
  searchParams: { q?: string; estado?: string };
}) {
  await requireAuth();
  const query = searchParams.q?.trim() || "";
  const estadoFiltro = searchParams.estado || "";

  const whereClause: Prisma.PropuestaWhereInput = {};

  if (query) {
    whereClause.OR = [
      { numero: { contains: query, mode: "insensitive" } },
      { clienteRazonSocial: { contains: query, mode: "insensitive" } },
      { clienteRut: { contains: query, mode: "insensitive" } },
    ];
  }

  if (estadoFiltro) {
    whereClause.estado = estadoFiltro;
  }

  const propuestas = await prisma.propuesta.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      cuenta: true,
      oportunidad: true,
      planes: true,
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Propuestas Comerciales</h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Emisión y archivo de cotizaciones formales en UF con congelamiento de precios.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/propuestas/catalogo"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 shadow-sm transition"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Catálogo de Precios</span>
          </Link>

          <Link
            href="/propuestas/nueva"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Propuesta</span>
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
            placeholder="Buscar por correlativo (2026-001), cliente o RUT..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </form>

        <form method="GET" className="w-full sm:w-auto flex items-center gap-2">
          {query && <input type="hidden" name="q" value={query} />}
          <select
            name="estado"
            defaultValue={estadoFiltro}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="borrador">Borrador</option>
            <option value="enviada">Enviada al Cliente</option>
            <option value="aceptada">Aceptada / Aprobada</option>
            <option value="rechazada">Rechazada</option>
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
                <th className="py-3.5 px-4">N° Propuesta</th>
                <th className="py-3.5 px-4">Cliente / Destinatario</th>
                <th className="py-3.5 px-4">Oportunidad</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Recurrente Mensual</th>
                <th className="py-3.5 px-4">Total c/ Setup</th>
                <th className="py-3.5 px-4">Fecha Emisión</th>
                <th className="py-3.5 px-4 text-right">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {propuestas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No se encontraron propuestas</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {query ? "Prueba con otro filtro." : "Crea tu primera cotización en UF."}
                    </p>
                  </td>
                </tr>
              ) : (
                propuestas.map((p) => {
                  const totalPlanesUF = p.planes.reduce((acc, pl) => acc + pl.valorFinal, 0);
                  const setupFinalUF = p.setupValorUF * (1 - p.setupDescuentoPct / 100);
                  const totalConSetupUF = totalPlanesUF + setupFinalUF;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition group">
                      <td className="py-4 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        <Link href={`/propuestas/${p.id}`} className="hover:underline">
                          PROP-{p.numero}
                        </Link>
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-900 dark:text-white">{p.clienteRazonSocial}</p>
                        {p.clienteRut && (
                          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{p.clienteRut}</p>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                        {p.oportunidad ? (
                          <Link
                            href={`/oportunidades/${p.oportunidad.id}`}
                            className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline font-medium"
                          >
                            {p.oportunidad.nombre}
                          </Link>
                        ) : (
                          <span className="text-slate-400 italic">Sin oportunidad</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            p.estado === "aceptada"
                              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                              : p.estado === "rechazada"
                              ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                              : p.estado === "enviada"
                              ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {p.estado === "aceptada" && <CheckCircle2 className="w-3 h-3" />}
                          {p.estado === "rechazada" && <XCircle className="w-3 h-3" />}
                          {p.estado === "enviada" && <Send className="w-3 h-3" />}
                          {p.estado === "borrador" && <Clock className="w-3 h-3" />}
                          <span className="capitalize">{p.estado}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4 font-black text-slate-900 dark:text-white">
                        {formatearUF(totalPlanesUF)}
                      </td>

                      <td className="py-4 px-4 font-black text-emerald-600 dark:text-emerald-400">
                        {formatearUF(totalConSetupUF)}
                      </td>

                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400">
                        {formatearFecha(p.createdAt)}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/propuestas/${p.id}`}
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
