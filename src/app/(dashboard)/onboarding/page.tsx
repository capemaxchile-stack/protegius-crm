import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  UserCheck,
  ChevronRight,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react";
import { formatearFecha } from "@/lib/constants";
import { PanelAyuda } from "@/components/PanelAyuda";
import { Prisma } from "@prisma/client";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { estado?: string };
}) {
  await requireAuth();
  const estadoFiltro = searchParams.estado || "";

  const whereClause: Prisma.OnboardingClienteWhereInput = {};
  if (estadoFiltro) {
    whereClause.estado = estadoFiltro;
  }

  const onboardings = await prisma.onboardingCliente.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      cuenta: true,
      contrato: true,
      pasos: {
        orderBy: { orden: "asc" },
      },
      servicios: true,
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-500" />
            <h1 className="text-xl font-bold text-white tracking-tight">Onboarding & Activación Técnica</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Entrega de credenciales, recepción de antecedentes legales y activación de clientes.
          </p>
        </div>
      </div>

      {/* Contextual Help Panel */}
      <PanelAyuda
        titulo="¿Cómo funciona el módulo de Onboarding?"
        descripcion="El Onboarding garantiza que un cliente recién firmado reciba sus accesos, se capacite y quede 100% operativo en la plataforma Protegius."
        pasos={[
          {
            titulo: "Hito 1: Legal",
            detalle: "Recepción y validación de e-RUT, escritura y personería.",
          },
          {
            titulo: "Hito 2: Credenciales",
            detalle: "Configuración de usuarios autorizados en la plataforma Protegius.",
          },
          {
            titulo: "Hito 3: Salida a Producción",
            detalle: "Al completar todos los hitos, los servicios pasan a estado Activo automáticamente.",
          },
        ]}
        consejoPro="Cuando se completan los 4 hitos, el sistema marca el cliente como 'Alta Real' y activa sus servicios para control de facturación mensual."
      />

      {/* Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
        <form method="GET" className="flex items-center gap-2">
          <select
            name="estado"
            defaultValue={estadoFiltro}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="en_proceso">En Proceso</option>
            <option value="completado">Completado / Alta Real</option>
            <option value="bloqueado">Bloqueado</option>
            <option value="no_iniciado">No Iniciado</option>
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
                <th className="py-3.5 px-4">Empresa / Cliente</th>
                <th className="py-3.5 px-4">Contrato Asociado</th>
                <th className="py-3.5 px-4">Estado Onboarding</th>
                <th className="py-3.5 px-4">Progreso de Hitos</th>
                <th className="py-3.5 px-4">Fecha Inicio</th>
                <th className="py-3.5 px-4">Fecha Alta Real</th>
                <th className="py-3.5 px-4 text-right">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {onboardings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-sm font-medium text-slate-300">No hay procesos de onboarding activos</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Los procesos se generan automáticamente cuando se firma un contrato.
                    </p>
                  </td>
                </tr>
              ) : (
                onboardings.map((ob) => {
                  const completados = ob.pasos.filter((p) => p.estado === "completado").length;
                  const total = ob.pasos.length;
                  const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

                  return (
                    <tr key={ob.id} className="hover:bg-slate-800/30 transition group">
                      <td className="py-4 px-4 font-semibold text-white">
                        <Link href={`/onboarding/${ob.id}`} className="hover:text-cyan-400">
                          {ob.cuenta.razonSocial}
                        </Link>
                      </td>

                      <td className="py-4 px-4 font-mono text-slate-300">
                        {ob.contrato ? (
                          <Link
                            href={`/contratos/${ob.contrato.id}`}
                            className="text-rose-400 hover:underline flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>CONT-{ob.contrato.numero}</span>
                          </Link>
                        ) : (
                          <span className="text-slate-500 italic">Directo</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                            ob.estado === "completado"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : ob.estado === "bloqueado"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                          }`}
                        >
                          {ob.estado === "completado" && <CheckCircle2 className="w-3 h-3" />}
                          {ob.estado === "en_proceso" && <Clock className="w-3 h-3" />}
                          <span className="capitalize">{ob.estado.replace(/_/g, " ")}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-1 w-32">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>
                              {completados}/{total} pasos
                            </span>
                            <span>{porcentaje}%</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                porcentaje === 100 ? "bg-emerald-500" : "bg-cyan-500"
                              }`}
                              style={{ width: `${porcentaje}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-400">
                        {formatearFecha(ob.fechaInicio)}
                      </td>

                      <td className="py-4 px-4 text-slate-400">
                        {ob.fechaAltaReal ? formatearFecha(ob.fechaAltaReal) : "En proceso"}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/onboarding/${ob.id}`}
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
