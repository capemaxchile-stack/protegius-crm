import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
} from "lucide-react";
import { ETAPAS_OPORTUNIDAD, formatearUF, formatearFecha } from "@/lib/constants";
import {
  cambiarEtapaOportunidadAction,
  marcarOportunidadGanadaAction,
} from "@/lib/actions-oportunidades";
import { MarcarPerdidaModal } from "./MarcarPerdidaModal";
import { CerrarTareaModal } from "./CerrarTareaModal";
import { ActividadModal } from "../../cuentas/[id]/ActividadModal";

export default async function OportunidadDetallePage({
  params,
}: {
  params: { id: string };
}) {
  await requireAuth();

  const op = await prisma.oportunidad.findUnique({
    where: { id: params.id },
    include: {
      cuenta: {
        include: {
          afiliaciones: {
            where: { activa: true },
            include: { persona: true },
          },
        },
      },
      responsable: true,
      contactos: {
        include: { persona: true },
      },
      actividades: {
        orderBy: { fechaRealizada: "desc" },
        include: { persona: true },
      },
      tareas: {
        orderBy: { fechaVencimiento: "asc" },
        include: { responsable: true },
      },
      propuestas: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!op) {
    notFound();
  }

  const etapaActualIndex = ETAPAS_OPORTUNIDAD.findIndex((e) => e.id === op.etapa);
  const esGanada = op.estado === "ganada";
  const esPerdida = op.estado === "perdida";

  const tareasPendientes = op.tareas.filter((t) => t.estado === "pendiente");
  const tareasCompletadas = op.tareas.filter((t) => t.estado === "completada");

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/oportunidades"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{op.nombre}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase border ${
                  esGanada
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : esPerdida
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                }`}
              >
                {op.estado}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <Link href={`/cuentas/${op.cuentaId}`} className="text-slate-300 hover:text-blue-400 font-medium">
                {op.cuenta.razonSocial}
              </Link>
            </p>
          </div>
        </div>

        {/* Quick actions buttons */}
        {!esGanada && !esPerdida && (
          <div className="flex items-center gap-2">
            <form
              action={async () => {
                "use server";
                await marcarOportunidadGanadaAction(op.id);
              }}
            >
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Marcar Ganada</span>
              </button>
            </form>

            <MarcarPerdidaModal oportunidadId={op.id} />
          </div>
        )}
      </div>

      {/* Visual Stages Progress Bar */}
      {!esGanada && !esPerdida ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2 sm:pb-0">
            {ETAPAS_OPORTUNIDAD.map((etapa, idx) => {
              const isPast = idx < etapaActualIndex;
              const isCurrent = idx === etapaActualIndex;

              return (
                <form
                  key={etapa.id}
                  action={async () => {
                    "use server";
                    await cambiarEtapaOportunidadAction(op.id, etapa.id);
                  }}
                  className="flex-1 min-w-[130px]"
                >
                  <button
                    type="submit"
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition duration-150 relative ${
                      isCurrent
                        ? "bg-blue-600 text-white border-blue-500 shadow-md font-semibold"
                        : isPast
                        ? "bg-slate-950/80 text-blue-400 border-slate-800 hover:border-slate-700"
                        : "bg-slate-950/40 text-slate-500 border-slate-900 hover:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] opacity-75 font-mono">{idx + 1}</span>
                      {isPast && <Check className="w-3 h-3 text-blue-400" />}
                    </div>
                    <p className="truncate mt-0.5">{etapa.label}</p>
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      ) : esGanada ? (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>
            Esta oportunidad fue <strong>GANADA</strong> el {formatearFecha(op.fechaCierreReal)}.
          </span>
        </div>
      ) : (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs flex items-center gap-2">
          <XCircle className="w-4 h-4" />
          <span>
            Esta oportunidad fue <strong>PERDIDA</strong> el {formatearFecha(op.fechaCierreReal)}. Motivo: &quot;
            {op.motivoPerdida}&quot;
          </span>
        </div>
      )}

      {/* Key Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-slate-500 text-[11px] block">Valor Estimado</span>
          <p className="text-xl font-bold text-white tracking-tight mt-0.5">
            {formatearUF(op.valorEstimado)}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-slate-500 text-[11px] block">Probabilidad</span>
          <p className="text-xl font-bold text-blue-400 tracking-tight mt-0.5">
            {op.probabilidad || 10}%
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-slate-500 text-[11px] block">Responsable</span>
          <p className="text-sm font-semibold text-white truncate mt-1">
            {op.responsable?.name || "Sin asignar"}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-slate-500 text-[11px] block">Cierre Estimado</span>
          <p className="text-sm font-semibold text-white mt-1">
            {formatearFecha(op.fechaCierreEstimada)}
          </p>
        </div>
      </div>

      {/* Main Grid: Activities & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Bitácora de Actividades */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Historial de Actividades ({op.actividades.length})
            </h2>
            <ActividadModal
              cuentaId={op.cuentaId}
              contactos={op.cuenta.afiliaciones}
            />
          </div>

          {op.actividades.length === 0 ? (
            <p className="text-slate-500 text-xs italic text-center py-6">
              Aún no hay actividades registradas en esta oportunidad.
            </p>
          ) : (
            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
              {op.actividades.map((act) => (
                <div key={act.id} className="relative pl-7 text-xs space-y-1">
                  <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900" />
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-blue-400 capitalize">{act.tipo}</span>
                    <span>{formatearFecha(act.fechaRealizada)}</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {act.descripcion}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Compromisos / Tareas con resultado obligatorio */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Compromisos Pendientes ({tareasPendientes.length})
            </h2>
          </div>

          {tareasPendientes.length === 0 ? (
            <p className="text-slate-500 text-xs italic text-center py-6">
              No hay compromisos pendientes para esta oportunidad.
            </p>
          ) : (
            <div className="space-y-3">
              {tareasPendientes.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-white text-sm">{t.titulo}</p>
                      {t.descripcion && (
                        <p className="text-slate-400 text-xs mt-0.5">{t.descripcion}</p>
                      )}
                    </div>

                    <CerrarTareaModal
                      tareaId={t.id}
                      tituloTarea={t.titulo}
                      oportunidadId={op.id}
                      cuentaId={op.cuentaId}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Clock className="w-3 h-3" />
                      {formatearFecha(t.fechaVencimiento)}
                    </span>
                    <span>Resp: {t.responsable?.name || "Sin asignar"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Compromisos completados colapsados */}
          {tareasCompletadas.length > 0 && (
            <details className="pt-3 border-t border-slate-800 text-xs">
              <summary className="cursor-pointer text-slate-500 hover:text-slate-300 font-medium">
                Ver compromisos completados ({tareasCompletadas.length})
              </summary>
              <div className="mt-2 space-y-2">
                {tareasCompletadas.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 text-[11px] flex items-center justify-between text-slate-400"
                  >
                    <span className="line-through">{t.titulo}</span>
                    <span className="text-emerald-400">
                      Completada el {formatearFecha(t.completadaEn)}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
