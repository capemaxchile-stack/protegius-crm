import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Building2,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
} from "lucide-react";
import { formatearUF, formatearFecha } from "@/lib/constants";
import { PanelAyuda } from "@/components/PanelAyuda";
import { Prisma } from "@prisma/client";

export default async function ContratosPage({
  searchParams,
}: {
  searchParams: { q?: string; estado?: string };
}) {
  await requireAuth();
  const query = searchParams.q?.trim() || "";
  const estadoFiltro = searchParams.estado || "";

  const whereClause: Prisma.ContratoWhereInput = {};

  if (query) {
    whereClause.OR = [
      { numero: { contains: query, mode: "insensitive" } },
      { nombre: { contains: query, mode: "insensitive" } },
      { cuenta: { razonSocial: { contains: query, mode: "insensitive" } } },
    ];
  }

  if (estadoFiltro) {
    whereClause.estado = estadoFiltro;
  }

  const contratos = await prisma.contrato.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      cuenta: true,
      propuesta: true,
      firmantes: true,
      onboardings: true,
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Contratos & Formalización</h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Gestión de contratos de prestación de servicios, firmantes legales y paso a Onboarding.
          </p>
        </div>

        <Link
          href="/contratos/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Contrato</span>
        </Link>
      </div>

      {/* Contextual Help Panel */}
      <PanelAyuda
        titulo="¿Cómo funciona el módulo de Contratos?"
        descripcion="Los contratos formalizan los acuerdos comerciales previamente cotizados en las propuestas en UF. Al firmar un contrato, se habilita el inicio del Onboarding técnico del cliente."
        pasos={[
          {
            titulo: "Creación",
            detalle: "Puedes crearlo desde cero o asociarlo a una propuesta aceptada en UF.",
          },
          {
            titulo: "Firmantes",
            detalle: "Registra a los representantes legales y valida la recepción de la firma.",
          },
          {
            titulo: "Firma & Onboarding",
            detalle: "Al marcarlo como Firmado, el sistema crea automáticamente el flujo de Onboarding.",
          },
        ]}
        consejoPro="Una vez firmado el contrato, los servicios pasan a cola de Onboarding y se activan para facturación mensual tras la entrega de accesos."
      />

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <form method="GET" className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            name="q"
            defaultValue={query}
            placeholder="Buscar por N° contrato (2026-001), nombre o empresa..."
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
            <option value="enviado">Enviado a Firma</option>
            <option value="en_revision">En Revisión Legal</option>
            <option value="firmado">Firmado / Vigente</option>
            <option value="rechazado">Rechazado</option>
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
                <th className="py-3.5 px-4">N° Contrato</th>
                <th className="py-3.5 px-4">Nombre / Objeto</th>
                <th className="py-3.5 px-4">Empresa</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Valor (UF)</th>
                <th className="py-3.5 px-4">Firmantes</th>
                <th className="py-3.5 px-4">Fecha Firma</th>
                <th className="py-3.5 px-4 text-right">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {contratos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No se encontraron contratos</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {query ? "Prueba con otro filtro." : "Crea tu primer contrato o formaliza una propuesta aceptada."}
                    </p>
                  </td>
                </tr>
              ) : (
                contratos.map((c) => {
                  const firmadosCount = c.firmantes.filter((f) => f.estadoFirma === "firmado").length;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition group">
                      <td className="py-4 px-4 font-mono font-bold text-rose-600 dark:text-rose-400">
                        <Link href={`/contratos/${c.id}`} className="hover:underline">
                          CONT-{c.numero}
                        </Link>
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                        <Link href={`/contratos/${c.id}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                          {c.nombre}
                        </Link>
                      </td>

                      <td className="py-4 px-4">
                        <Link
                          href={`/cuentas/${c.cuentaId}`}
                          className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200"
                        >
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.cuenta.razonSocial}</span>
                        </Link>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            c.estado === "firmado"
                              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                              : c.estado === "rechazado"
                              ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                              : c.estado === "enviado" || c.estado === "en_revision"
                              ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {c.estado === "firmado" && <CheckCircle2 className="w-3 h-3" />}
                          {c.estado === "rechazado" && <XCircle className="w-3 h-3" />}
                          {c.estado === "borrador" && <Clock className="w-3 h-3" />}
                          {(c.estado === "enviado" || c.estado === "en_revision") && <Send className="w-3 h-3" />}
                          <span className="capitalize">{c.estado.replace(/_/g, " ")}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4 font-black text-slate-900 dark:text-white">
                        {formatearUF(c.valor)}
                      </td>

                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                        {c.firmantes.length > 0 ? (
                          <span className="text-[11px] font-medium">
                            {firmadosCount} de {c.firmantes.length} firmados
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Sin firmantes</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400">
                        {c.fechaFirma ? formatearFecha(c.fechaFirma) : "Pendiente"}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/contratos/${c.id}`}
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
