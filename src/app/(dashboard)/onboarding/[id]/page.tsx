import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  UserCheck,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";
import { formatearUF, formatearFecha } from "@/lib/constants";
import { togglePasoOnboardingAction } from "@/lib/actions-onboarding";

export default async function OnboardingDetallePage({
  params,
}: {
  params: { id: string };
}) {
  await requireAuth();

  const onboarding = await prisma.onboardingCliente.findUnique({
    where: { id: params.id },
    include: {
      cuenta: true,
      contrato: true,
      pasos: {
        orderBy: { orden: "asc" },
      },
      servicios: true,
    },
  });

  if (!onboarding) {
    notFound();
  }

  const esCompletado = onboarding.estado === "completado";
  const pasosCompletados = onboarding.pasos.filter((p) => p.estado === "completado").length;
  const porcentaje =
    onboarding.pasos.length > 0
      ? Math.round((pasosCompletados / onboarding.pasos.length) * 100)
      : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/onboarding"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Onboarding: {onboarding.cuenta.razonSocial}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${
                  esCompletado
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20"
                }`}
              >
                {onboarding.estado.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-2">
              {onboarding.contrato && (
                <Link
                  href={`/contratos/${onboarding.contrato.id}`}
                  className="text-rose-600 dark:text-rose-400 hover:underline font-mono font-bold"
                >
                  CONT-{onboarding.contrato.numero}
                </Link>
              )}
              <span>· Inicio: {formatearFecha(onboarding.fechaInicio)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Progress completion banner if complete */}
      {esCompletado ? (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold text-emerald-900 dark:text-white">¡Cliente en Alta Real / Producción!</p>
            <p className="text-[11px] mt-0.5 text-emerald-700 dark:text-emerald-300">
              Todos los hitos técnicos fueron completados el {formatearFecha(onboarding.fechaAltaReal)}.
              Los servicios recurrentes han sido activados para facturación.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 dark:text-white">Avance del Onboarding Técnico</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-black">
              {pasosCompletados} de {onboarding.pasos.length} hitos ({porcentaje}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-800">
            <div
              className="bg-cyan-600 dark:bg-cyan-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>
      )}

      {/* Checklist de Hitos de Onboarding */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Checklist de Activación Técnica</h2>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Haz clic en cada hito para completarlo</span>
        </div>

        <div className="space-y-3">
          {onboarding.pasos.map((paso) => {
            const isCompleted = paso.estado === "completado";

            return (
              <div
                key={paso.id}
                className={`p-4 rounded-xl border transition duration-150 flex items-start justify-between gap-4 ${
                  isCompleted
                    ? "bg-emerald-50/50 dark:bg-slate-950 border-emerald-200 dark:border-emerald-500/40 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </div>
                  <div>
                    <p className={`font-bold text-xs ${isCompleted ? "text-slate-700 dark:text-white line-through opacity-80" : "text-slate-900 dark:text-white"}`}>
                      {paso.titulo}
                    </p>
                    {paso.descripcion && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {paso.descripcion}
                      </p>
                    )}
                    {isCompleted && paso.completadoEn && (
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                        Completado el {formatearFecha(paso.completadoEn)}
                      </p>
                    )}
                  </div>
                </div>

                <form
                  action={async () => {
                    "use server";
                    await togglePasoOnboardingAction(paso.id, onboarding.id, paso.estado);
                  }}
                  className="shrink-0"
                >
                  <button
                    type="submit"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      isCompleted
                        ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:border-rose-200"
                        : "bg-cyan-600 hover:bg-cyan-500 text-white border-transparent shadow-sm"
                    }`}
                  >
                    {isCompleted ? "Desmarcar" : "Marcar Hito Listo"}
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </div>

      {/* Servicios Activados */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Servicios y Suscripciones Recurrentes</h2>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{onboarding.servicios.length} suscripciones</span>
        </div>

        {onboarding.servicios.length === 0 ? (
          <p className="text-slate-400 text-xs italic text-center py-6">
            No hay servicios registrados en este onboarding.
          </p>
        ) : (
          <div className="space-y-2.5">
            {onboarding.servicios.map((s) => (
              <div
                key={s.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 dark:text-white">{s.observaciones || "Servicio Protegius"}</p>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold border ${
                        s.estado === "activo"
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                          : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                      }`}
                    >
                      {s.estado}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Facturación: <span className="capitalize font-medium text-slate-700 dark:text-slate-300">{s.modalidadFacturacion}</span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-black text-slate-900 dark:text-white text-sm">{formatearUF(s.montoRecurrente)}</p>
                  <span className="text-[10px] text-slate-400">mensual</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
