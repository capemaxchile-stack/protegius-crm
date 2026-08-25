import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Send,
  Shield,
} from "lucide-react";
import { formatearUF, formatearFecha } from "@/lib/constants";
import { cambiarEstadoPropuestaAction } from "@/lib/actions-propuestas";
import { BotonImprimir } from "./BotonImprimir";

export default async function PropuestaDetallePage({
  params,
}: {
  params: { id: string };
}) {
  await requireAuth();

  const propuesta = await prisma.propuesta.findUnique({
    where: { id: params.id },
    include: {
      cuenta: true,
      oportunidad: true,
      planes: true,
      servicios: true,
    },
  });

  if (!propuesta) {
    notFound();
  }

  const totalPlanesUF = propuesta.planes.reduce((acc, pl) => acc + pl.valorFinal, 0);
  const setupFinalUF = propuesta.setupValorUF * (1 - propuesta.setupDescuentoPct / 100);
  const totalConSetupUF = totalPlanesUF + setupFinalUF;

  const esAceptada = propuesta.estado === "aceptada";
  const esRechazada = propuesta.estado === "rechazada";

  // Fecha de vencimiento calculada
  const fechaEmision = new Date(propuesta.createdAt);
  const fechaVence = new Date(
    fechaEmision.getTime() + propuesta.vigenciaDias * 24 * 60 * 60 * 1000
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top action bar - Hidden during print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/propuestas"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Propuesta PROP-{propuesta.numero}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${
                  esAceptada
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : esRechazada
                    ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                    : propuesta.estado === "enviada"
                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                }`}
              >
                {propuesta.estado}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Emitida para: <strong className="text-slate-900 dark:text-slate-200">{propuesta.clienteRazonSocial}</strong>
            </p>
          </div>
        </div>

        {/* Status update actions */}
        <div className="flex items-center gap-2">
          <BotonImprimir />

          {propuesta.estado === "borrador" && (
            <form
              action={async () => {
                "use server";
                await cambiarEstadoPropuestaAction(propuesta.id, "enviada");
              }}
            >
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Marcar Enviada</span>
              </button>
            </form>
          )}

          {!esAceptada && !esRechazada && (
            <>
              <form
                action={async () => {
                  "use server";
                  await cambiarEstadoPropuestaAction(propuesta.id, "aceptada");
                }}
              >
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Aprobar / Aceptada</span>
                </button>
              </form>

              <form
                action={async () => {
                  "use server";
                  await cambiarEstadoPropuestaAction(propuesta.id, "rechazada");
                }}
              >
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 font-bold text-xs transition"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Rechazada</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Formal Document Sheet */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-8 print:bg-white print:text-slate-900 print:border-none print:shadow-none print:p-0 transition-colors">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800 print:border-slate-300">
          <div>
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo_protegius.svg"
                alt="Logo Protegius"
                width={28}
                height={36}
                className="w-7 h-9 object-contain"
              />
              <span className="font-black text-xl text-slate-900 dark:text-white tracking-tight print:text-slate-900">
                PROTEGIUS
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 print:text-slate-600">
              Plataforma de Inteligencia Comercial y Prevención de Fraude
            </p>
            <p className="text-[11px] text-slate-500 print:text-slate-500">
              Santiago, Chile · contacto@protegius.cl
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block print:text-blue-700">
              Propuesta Comercial
            </span>
            <p className="text-xl font-mono font-bold text-slate-900 dark:text-white mt-0.5 print:text-slate-900">
              N° PROP-{propuesta.numero}
            </p>
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5 mt-2 print:text-slate-600 font-medium">
              <p>Fecha Emisión: {formatearFecha(propuesta.createdAt)}</p>
              <p>Vigencia: {propuesta.vigenciaDias} días ({formatearFecha(fechaVence)})</p>
              <p>Moneda: <strong>Unidades de Fomento (UF)</strong></p>
            </div>
          </div>
        </div>

        {/* Client Metadata */}
        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 print:bg-slate-50 print:border-slate-200">
          <h2 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3 print:text-slate-700">
            Datos del Destinatario
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium print:text-slate-500">Razón Social</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm print:text-slate-900">
                {propuesta.clienteRazonSocial}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium print:text-slate-500">RUT</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold print:text-slate-800">
                {propuesta.clienteRut || "Sin registrar"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium print:text-slate-500">Giro / Rubro</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium print:text-slate-800">
                {propuesta.clienteGiro || "General"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium print:text-slate-500">Atención a</span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold print:text-slate-800">
                {propuesta.clienteContacto || "Gerencia Comercial / Compras"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium print:text-slate-500">Correo Electrónico</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium print:text-slate-800">
                {propuesta.clienteEmail || "—"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium print:text-slate-500">Teléfono</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium print:text-slate-800">
                {propuesta.clienteTelefono || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Services Included */}
        {propuesta.servicios.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider print:text-slate-700">
              1. Alcance y Servicios Incluidos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {propuesta.servicios.map((serv) => (
                <div
                  key={serv.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 text-xs space-y-1 print:bg-white print:border-slate-200"
                >
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 print:text-blue-600" />
                    <span className="font-bold text-slate-900 dark:text-white print:text-slate-900">{serv.nombre}</span>
                  </div>
                  {serv.descripcion && (
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] print:text-slate-600">{serv.descripcion}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Investment Table in UF */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider print:text-slate-700">
            2. Cuadro de Inversión y Planes Seleccionados (en UF)
          </h2>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden print:border-slate-300">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold print:bg-slate-100 print:text-slate-700 print:border-slate-300">
                <tr>
                  <th className="py-3 px-4">Plan / Suscripción</th>
                  <th className="py-3 px-4">Detalle / Capacidad</th>
                  <th className="py-3 px-4 text-right">Valor Lista</th>
                  <th className="py-3 px-4 text-right">Descuento</th>
                  <th className="py-3 px-4 text-right">Valor Final (UF/mes)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200 print:divide-slate-200 print:text-slate-800">
                {propuesta.planes.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white print:text-slate-900">
                      {p.planNombre}
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-normal print:text-slate-500">
                        {p.grupoNombre}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 print:text-slate-600">{p.detalle || "—"}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500 dark:text-slate-400 print:text-slate-600">
                      {formatearUF(p.valorOriginal)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {p.descuentoPct > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold print:text-emerald-700">
                          {p.descuentoPct}%
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white print:text-slate-900">
                      {formatearUF(p.valorFinal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Economic Totals Box */}
        <div className="flex flex-col sm:flex-row justify-end">
          <div className="w-full sm:w-80 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2.5 text-xs print:bg-slate-50 print:border-slate-300">
            <div className="flex justify-between text-slate-600 dark:text-slate-400 print:text-slate-600 font-medium">
              <span>Subtotal Planes Mensual:</span>
              <span className="font-bold text-slate-900 dark:text-white print:text-slate-900">{formatearUF(totalPlanesUF)}</span>
            </div>

            {setupFinalUF > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-slate-400 print:text-slate-600 font-medium">
                <span>Setup / Habilitación:</span>
                <span className="font-bold text-slate-900 dark:text-white print:text-slate-900">{formatearUF(setupFinalUF)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 print:border-slate-300 flex justify-between items-baseline">
              <span className="font-bold text-slate-900 dark:text-white text-sm print:text-slate-900">
                Total Inversión Inicial:
              </span>
              <span className="font-black text-blue-600 dark:text-blue-400 text-lg print:text-blue-800">
                {formatearUF(totalConSetupUF)}
              </span>
            </div>

            <p className="text-[10px] text-slate-500 text-right print:text-slate-500 font-medium">
              Valores en UF netos. No incluyen IVA.
            </p>
          </div>
        </div>

        {/* Commercial Conditions & Signature */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6 text-xs text-slate-600 dark:text-slate-400 print:border-slate-300 print:text-slate-600">
          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900 dark:text-slate-300 print:text-slate-800">Condiciones Comerciales:</h3>
            <ul className="list-disc list-inside space-y-1 text-[11px]">
              <li>Facturación mensual en pesos chilenos según el valor de la UF al último día del mes de servicio.</li>
              <li>Plazo de vigencia de la oferta: {propuesta.vigenciaDias} días corridos desde su emisión.</li>
              <li>Los precios y condiciones quedan congelados tras la aceptación formal de esta propuesta.</li>
            </ul>
          </div>

          <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs">
            <div className="border-t border-slate-300 dark:border-slate-700 pt-2 print:border-slate-400">
              <p className="font-bold text-slate-900 dark:text-slate-200 print:text-slate-900">Protegius SpA</p>
              <p className="text-[11px] text-slate-500">Firma Comercial Autorizada</p>
            </div>
            <div className="border-t border-slate-300 dark:border-slate-700 pt-2 print:border-slate-400">
              <p className="font-bold text-slate-900 dark:text-slate-200 print:text-slate-900">{propuesta.clienteRazonSocial}</p>
              <p className="text-[11px] text-slate-500">Aceptación y Firma Cliente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
