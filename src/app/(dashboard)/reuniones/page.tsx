import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Phone,
  ExternalLink,
} from "lucide-react";
import { formatearFechaHora } from "@/lib/constants";
import { sincronizarInteraccionesYTareas } from "@/lib/actions-interacciones";

export default async function ReunionesPage() {
  const currentUser = await requireAuth();
  await sincronizarInteraccionesYTareas();

  const isAdmin = currentUser.role === "ADMIN";

  const finDeHoy = new Date();
  finDeHoy.setHours(23, 59, 59, 999);

  const en7Dias = new Date();
  en7Dias.setDate(en7Dias.getDate() + 7);
  en7Dias.setHours(23, 59, 59, 999);

  // Obtener tareas de tipo reunión y actividades de reunión (filtradas por comercial si no es Admin)
  const [reuniones, actividadesReunion] = await Promise.all([
    prisma.tarea.findMany({
      where: {
        tipo: "reunion",
        ...(isAdmin ? {} : { responsableId: currentUser.id }),
      },
      orderBy: { fechaVencimiento: "asc" },
      include: {
        cuenta: true,
        persona: true,
        responsable: true,
      },
    }),
    prisma.actividad.findMany({
      where: {
        tipo: "reunion",
        ...(isAdmin ? {} : { usuarioId: currentUser.id }),
      },
      orderBy: { fechaRealizada: "desc" },
      take: 10,
      include: {
        cuenta: true,
        persona: true,
        usuario: true,
      },
    }),
  ]);

  const reunionesHoy = reuniones.filter((r) => {
    if (!r.fechaVencimiento) return false;
    return r.fechaVencimiento <= finDeHoy && r.estado === "pendiente";
  });

  const reunionesEstaSemana = reuniones.filter((r) => {
    if (!r.fechaVencimiento) return false;
    return (
      r.fechaVencimiento > finDeHoy &&
      r.fechaVencimiento <= en7Dias &&
      r.estado === "pendiente"
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Agenda de Reuniones Comerciales
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
              {reunionesHoy.length + reunionesEstaSemana.length} Activas esta semana
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Trazabilidad de reuniones agendadas, videoconferencias y compromisos comerciales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/prospeccion"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition"
          >
            <Calendar className="w-4 h-4" />
            <span>Ir a Centro de Prospección</span>
          </Link>
        </div>
      </div>

      {/* Grid de Secciones */}
      <div className="space-y-6">
        {/* 1. Reuniones para HOY */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
              <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Reuniones para Hoy ({reunionesHoy.length})
              </h2>
            </div>
          </div>

          {reunionesHoy.length === 0 ? (
            <p className="text-slate-400 text-xs italic py-4 text-center">
              No tienes reuniones agendadas para el día de hoy.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reunionesHoy.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatearFechaHora(r.fechaVencimiento)}
                      </span>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm mt-1">
                        {r.cuenta?.razonSocial || r.titulo}
                      </h3>
                      {r.persona && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          Con: <strong className="text-slate-800 dark:text-slate-200">{r.persona.nombre}</strong>{" "}
                          {r.persona.cargo ? `(${r.persona.cargo})` : ""}
                        </p>
                      )}
                    </div>

                    <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 text-[10px] font-bold">
                      {r.responsable?.name || "Ejecutivo"}
                    </span>
                  </div>

                  {r.descripcion && (
                    <p className="text-slate-700 dark:text-slate-300 text-xs bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-purple-100 dark:border-purple-900/40">
                      {r.descripcion}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-purple-100 dark:border-purple-900/40 text-xs">
                    {r.persona?.telefono ? (
                      <a
                        href={`tel:${r.persona.telefono}`}
                        className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{r.persona.telefono}</span>
                      </a>
                    ) : (
                      <span />
                    )}

                    {r.cuenta && (
                      <Link
                        href={`/cuentas/${r.cuenta.id}`}
                        className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>Ver Ficha</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Reuniones Próximos 7 Días */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Próximos 7 Días ({reunionesEstaSemana.length})
            </h2>
          </div>

          {reunionesEstaSemana.length === 0 ? (
            <p className="text-slate-400 text-xs italic py-4 text-center">
              No hay reuniones agendadas para los próximos 7 días.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {reunionesEstaSemana.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3 h-3" />
                      {formatearFechaHora(r.fechaVencimiento)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">{r.responsable?.name}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      {r.cuenta?.razonSocial || r.titulo}
                    </h4>
                    {r.persona && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {r.persona.nombre} {r.persona.cargo ? `· ${r.persona.cargo}` : ""}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Historial de Reuniones Realizadas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Bitácora de Reuniones Realizadas ({actividadesReunion.length})
          </h2>

          {actividadesReunion.length === 0 ? (
            <p className="text-slate-400 text-xs italic text-center py-4">
              Aún no hay reuniones registradas en la bitácora.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {actividadesReunion.map((act) => (
                <div key={act.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {act.cuenta.razonSocial}
                      </span>
                      {act.persona && (
                        <span className="text-slate-500 text-[11px]">
                          ({act.persona.nombre})
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {act.descripcion}
                    </p>
                  </div>

                  <div className="text-right shrink-0 text-[11px] text-slate-400">
                    <span className="block font-semibold text-slate-700 dark:text-slate-300">
                      {formatearFechaHora(act.fechaRealizada)}
                    </span>
                    <span>por {act.usuario?.name || act.responsable || "Ejecutiva"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
