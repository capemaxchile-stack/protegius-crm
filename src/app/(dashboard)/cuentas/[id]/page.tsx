import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  PlusCircle,
  Star,
} from "lucide-react";
import { formatearRUT } from "@/lib/rut";
import { ETAPAS_CUENTA, formatearUF, formatearFecha } from "@/lib/constants";
import { ContactoModal } from "./ContactoModal";
import { ActividadModal } from "./ActividadModal";
import {
  toggleEstadoContactoAction,
  marcarContactoPrincipalAction,
} from "@/lib/actions-cuentas";

export default async function CuentaDetallePage({
  params,
}: {
  params: { id: string };
}) {
  await requireAuth();

  const cuenta = await prisma.cuenta.findUnique({
    where: { id: params.id },
    include: {
      responsable: true,
      afiliaciones: {
        include: { persona: true },
        orderBy: [{ esPrincipal: "desc" }, { createdAt: "desc" }],
      },
      oportunidades: {
        orderBy: { createdAt: "desc" },
        include: { responsable: true },
      },
      actividades: {
        orderBy: { fechaRealizada: "desc" },
        include: { persona: true },
      },
      tareas: {
        where: { estado: "pendiente" },
        orderBy: { fechaVencimiento: "asc" },
      },
    },
  });

  if (!cuenta) {
    notFound();
  }

  // Obtener personas del sistema no vinculadas a esta cuenta (para el modal de vincular)
  const personasIdsVinculadas = cuenta.afiliaciones.map((a) => a.personaId);
  const personasDisponibles = await prisma.persona.findMany({
    where: {
      id: { notIn: personasIdsVinculadas },
    },
    select: {
      id: true,
      nombre: true,
      email: true,
      telefono: true,
    },
    orderBy: { nombre: "asc" },
  });

  const contactosActivos = cuenta.afiliaciones.filter((a) => a.activa);
  const contactosInactivos = cuenta.afiliaciones.filter((a) => !a.activa);
  const etapaObj = ETAPAS_CUENTA.find((e) => e.id === cuenta.etapa);

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/cuentas"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {cuenta.razonSocial}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {etapaObj?.label || cuenta.etapa}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              RUT: {cuenta.rut ? formatearRUT(cuenta.rut) : "Sin registrar"} · Rubro: {cuenta.rubro || "General"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ActividadModal
            cuentaId={cuenta.id}
            contactos={contactosActivos}
          />
          <Link
            href={`/cuentas/${cuenta.id}/editar`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Editar Datos</span>
          </Link>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details, Contacts & Deals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Informacion General */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Información Comercial
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Responsable Asignado</span>
                <span className="font-medium text-white">{cuenta.responsable?.name || "Sin asignar"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Sitio Web</span>
                {cuenta.sitioWeb ? (
                  <a
                    href={cuenta.sitioWeb.startsWith("http") ? cuenta.sitioWeb : `https://${cuenta.sitioWeb}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-blue-400 hover:underline truncate block"
                  >
                    {cuenta.sitioWeb}
                  </a>
                ) : (
                  <span className="text-slate-500">—</span>
                )}
              </div>
              <div>
                <span className="text-slate-500 block">Origen del Prospecto</span>
                <span className="font-medium text-white capitalize">{cuenta.origenLead || "Directo"}</span>
              </div>
            </div>

            {cuenta.notas && (
              <div className="mt-4 pt-3 border-t border-slate-800 text-xs">
                <span className="text-slate-500 block mb-1">Notas / Observaciones:</span>
                <p className="text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 whitespace-pre-wrap">
                  {cuenta.notas}
                </p>
              </div>
            )}
          </div>

          {/* Card 2: Contactos de la Empresa */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Contactos Vinculados ({contactosActivos.length})
                </h2>
                <p className="text-[11px] text-slate-500">Personas asociadas a esta empresa</p>
              </div>
              <ContactoModal
                cuentaId={cuenta.id}
                personasDisponibles={personasDisponibles}
              />
            </div>

            {contactosActivos.length === 0 ? (
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-slate-500 text-xs">
                Aún no hay contactos registrados. Usa el botón &quot;Agregar Contacto&quot;.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contactosActivos.map((af) => (
                  <div
                    key={af.id}
                    className={`p-3.5 rounded-xl border text-xs relative ${
                      af.esPrincipal
                        ? "bg-slate-950/90 border-blue-500/40 shadow-sm"
                        : "bg-slate-950/50 border-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-white text-sm">{af.persona.nombre}</p>
                          {af.esPrincipal && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Star className="w-2.5 h-2.5 fill-amber-400" />
                              Principal
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          {af.cargo || af.persona.cargo || "Sin cargo especificado"}
                        </p>
                      </div>

                      {!af.esPrincipal && (
                        <form
                          action={async () => {
                            "use server";
                            await marcarContactoPrincipalAction(af.id, cuenta.id);
                          }}
                        >
                          <button
                            type="submit"
                            title="Marcar como contacto principal"
                            className="text-[10px] text-slate-400 hover:text-amber-400 p-1 rounded hover:bg-slate-800"
                          >
                            Hacer Principal
                          </button>
                        </form>
                      )}
                    </div>

                    <div className="mt-3 space-y-1 text-slate-400 text-[11px]">
                      {af.persona.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                          <a href={`mailto:${af.persona.email}`} className="text-blue-400 hover:underline truncate">
                            {af.persona.email}
                          </a>
                        </div>
                      )}
                      {af.persona.telefono && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{af.persona.telefono}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-end">
                      <form
                        action={async () => {
                          "use server";
                          await toggleEstadoContactoAction(af.id, cuenta.id, af.activa);
                        }}
                      >
                        <button
                          type="submit"
                          className="text-[10px] text-slate-500 hover:text-rose-400"
                        >
                          Desactivar vínculo
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Contactos inactivos colapsados */}
            {contactosInactivos.length > 0 && (
              <details className="mt-4 pt-3 border-t border-slate-800 text-xs">
                <summary className="cursor-pointer text-slate-500 hover:text-slate-300 font-medium">
                  Ver contactos anteriores / inactivos ({contactosInactivos.length})
                </summary>
                <div className="mt-3 space-y-2">
                  {contactosInactivos.map((af) => (
                    <div
                      key={af.id}
                      className="p-2.5 rounded-xl bg-slate-950/30 border border-slate-800/60 flex items-center justify-between text-xs text-slate-400"
                    >
                      <div>
                        <span className="font-medium text-slate-300">{af.persona.nombre}</span>
                        <span className="text-[11px] text-slate-500 ml-2">({af.cargo || "Ex-contacto"})</span>
                      </div>
                      <form
                        action={async () => {
                          "use server";
                          await toggleEstadoContactoAction(af.id, cuenta.id, af.activa);
                        }}
                      >
                        <button
                          type="submit"
                          className="text-[11px] text-blue-400 hover:underline"
                        >
                          Reactivar
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>

          {/* Card 3: Oportunidades Comerciales */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Oportunidades de Negocio ({cuenta.oportunidades.length})
                </h2>
                <p className="text-[11px] text-slate-500">Negocios y cotizaciones en curso</p>
              </div>
              <Link
                href="/oportunidades/nueva"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nueva Oportunidad</span>
              </Link>
            </div>

            {cuenta.oportunidades.length === 0 ? (
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-slate-500 text-xs">
                No hay oportunidades registradas para esta cuenta.
              </div>
            ) : (
              <div className="space-y-2">
                {cuenta.oportunidades.map((op) => (
                  <div
                    key={op.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition"
                  >
                    <div>
                      <p className="font-semibold text-white">{op.nombre}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Etapa: <span className="text-slate-200 capitalize">{op.etapa.replace(/_/g, " ")}</span> · Resp: {op.responsable?.name || "Sin asignar"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-white text-sm">{formatearUF(op.valorEstimado)}</p>
                      <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-medium ${
                        op.estado === "ganada"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : op.estado === "perdida"
                          ? "bg-rose-500/10 text-rose-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}>
                        {op.estado.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Timeline & Compromisos */}
        <div className="space-y-6">
          {/* Card: Compromisos / Tareas */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Compromisos Pendientes ({cuenta.tareas.length})
            </h2>

            {cuenta.tareas.length === 0 ? (
              <p className="text-slate-500 text-xs italic">No hay compromisos pendientes.</p>
            ) : (
              <div className="space-y-2">
                {cuenta.tareas.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{t.titulo}</span>
                      <span className="text-[10px] text-amber-400 font-medium">
                        {formatearFecha(t.fechaVencimiento)}
                      </span>
                    </div>
                    {t.descripcion && <p className="text-slate-400 text-[11px]">{t.descripcion}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Timeline de Actividades */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Historial de Interacciones ({cuenta.actividades.length})
            </h2>

            {cuenta.actividades.length === 0 ? (
              <p className="text-slate-500 text-xs italic">No hay actividades registradas.</p>
            ) : (
              <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
                {cuenta.actividades.map((act) => (
                  <div key={act.id} className="relative pl-7 text-xs space-y-1">
                    <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900" />
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-blue-400 capitalize">{act.tipo}</span>
                      <span>{formatearFecha(act.fechaRealizada)}</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      {act.descripcion}
                    </p>
                    {act.persona && (
                      <p className="text-[10px] text-slate-500">
                        Con: <span className="text-slate-300">{act.persona.nombre}</span>
                      </p>
                    )}
                    {act.proximoPaso && (
                      <div className="text-[11px] bg-amber-500/10 border border-amber-500/20 text-amber-300 p-2 rounded-lg mt-1">
                        <strong>Próximo paso:</strong> {act.proximoPaso}{" "}
                        {act.fechaProximoPaso && `(${formatearFecha(act.fechaProximoPaso)})`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
