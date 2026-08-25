import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Send,
  UserCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { formatearUF, formatearFecha } from "@/lib/constants";
import {
  cambiarEstadoContratoAction,
  toggleFirmaFirmanteAction,
} from "@/lib/actions-contratos";

export default async function ContratoDetallePage({
  params,
}: {
  params: { id: string };
}) {
  await requireAuth();

  const contrato = await prisma.contrato.findUnique({
    where: { id: params.id },
    include: {
      cuenta: true,
      propuesta: {
        include: {
          planes: true,
          servicios: true,
        },
      },
      firmantes: true,
      onboardings: {
        include: {
          pasos: true,
        },
      },
    },
  });

  if (!contrato) {
    notFound();
  }

  const esFirmado = contrato.estado === "firmado";
  const esRechazado = contrato.estado === "rechazado";
  const onboardingVinculado = contrato.onboardings[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/contratos"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Contrato CONT-{contrato.numero}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${
                  esFirmado
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : esRechazado
                    ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                    : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                }`}
              >
                {contrato.estado.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Empresa: <strong className="text-slate-900 dark:text-slate-200">{contrato.cuenta.razonSocial}</strong>
            </p>
          </div>
        </div>

        {/* Quick state buttons */}
        {!esFirmado && !esRechazado && (
          <div className="flex items-center gap-2">
            {contrato.estado === "borrador" && (
              <form
                action={async () => {
                  "use server";
                  await cambiarEstadoContratoAction(contrato.id, "enviado");
                }}
              >
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar a Firma</span>
                </button>
              </form>
            )}

            <form
              action={async () => {
                "use server";
                await cambiarEstadoContratoAction(contrato.id, "firmado");
              }}
            >
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Marcar como Firmado</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Onboarding trigger banner if signed */}
      {esFirmado && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-emerald-900 dark:text-white">Contrato Firmado y Vigente</h3>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                El flujo de Onboarding y entrega técnica de credenciales ha sido activado automáticamente.
              </p>
            </div>
          </div>

          {onboardingVinculado && (
            <Link
              href={`/onboarding/${onboardingVinculado.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition whitespace-nowrap"
            >
              <span>Ver Onboarding Técnico</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* Contract Details Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Detalles del Acuerdo
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-medium">Objeto / Nombre</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{contrato.nombre}</span>
          </div>

          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-medium">Tipo de Contrato</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
              {contrato.tipo.replace(/_/g, " ")}
            </span>
          </div>

          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-medium">Valor Económico</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{formatearUF(contrato.valor)}</span>
          </div>

          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-medium">Fecha de Firma</span>
            <span className="text-slate-800 dark:text-slate-200 font-semibold">
              {contrato.fechaFirma ? formatearFecha(contrato.fechaFirma) : "Pendiente de firma"}
            </span>
          </div>

          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-medium">Propuesta Origen</span>
            {contrato.propuesta ? (
              <Link
                href={`/propuestas/${contrato.propuesta.id}`}
                className="text-blue-600 dark:text-blue-400 hover:underline font-mono font-bold"
              >
                PROP-{contrato.propuesta.numero}
              </Link>
            ) : (
              <span className="text-slate-400 italic">—</span>
            )}
          </div>
        </div>

        {contrato.observaciones && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Observaciones:</span>
            <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80">
              {contrato.observaciones}
            </p>
          </div>
        )}
      </div>

      {/* Firmantes Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Firmantes Legales y Contrapartes</h2>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {contrato.firmantes.filter((f) => f.estadoFirma === "firmado").length} de{" "}
            {contrato.firmantes.length} firmas registradas
          </span>
        </div>

        {contrato.firmantes.length === 0 ? (
          <p className="text-slate-400 text-xs italic text-center py-6">
            No hay firmantes asignados a este contrato.
          </p>
        ) : (
          <div className="space-y-3">
            {contrato.firmantes.map((f) => (
              <div
                key={f.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 dark:text-white">{f.nombre}</p>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-800 font-semibold">
                      {f.rol}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {f.cargo || "Sin cargo"} {f.email ? `· ${f.email}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      f.estadoFirma === "firmado"
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {f.estadoFirma === "firmado" ? "Firmado" : "Pendiente"}
                  </span>

                  <form
                    action={async () => {
                      "use server";
                      await toggleFirmaFirmanteAction(f.id, contrato.id, f.estadoFirma);
                    }}
                  >
                    <button
                      type="submit"
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-bold"
                    >
                      {f.estadoFirma === "firmado" ? "Desmarcar" : "Marcar Firmado"}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
