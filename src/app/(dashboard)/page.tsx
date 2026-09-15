import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  TrendingUp,
  PhoneCall,
  Calendar,
  ShieldCheck,
  FileSpreadsheet,
  Users2,
} from "lucide-react";
import { USER_ROLE_LABELS, formatearUF, formatearFechaHora } from "@/lib/constants";

export default async function DashboardPage() {
  const user = await requireAuth();

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Obtener estadísticas clave enfocadas en prospección y pipeline
  const [
    totalCuentas,
    oportunidadesAbiertas,
    actividadesHoy,
    proximasReuniones,
    ultimasActividades,
  ] = await Promise.all([
    prisma.cuenta.count(),
    prisma.oportunidad.findMany({
      where: { estado: "abierta" },
      select: { valorEstimado: true, probabilidad: true },
    }),
    prisma.actividad.findMany({
      where: { fechaRealizada: { gte: hoy } },
      select: { tipo: true, usuarioId: true },
    }),
    prisma.tarea.findMany({
      where: {
        tipo: "reunion",
        estado: "pendiente",
      },
      take: 4,
      orderBy: { fechaVencimiento: "asc" },
      include: {
        cuenta: true,
        persona: true,
        responsable: true,
      },
    }),
    prisma.actividad.findMany({
      take: 5,
      orderBy: { fechaRealizada: "desc" },
      include: {
        cuenta: true,
        persona: true,
        usuario: true,
      },
    }),
  ]);

  const llamadasHoy = actividadesHoy.filter((a) => a.tipo === "llamada").length;
  const reunionesHoy = actividadesHoy.filter((a) => a.tipo === "reunion").length;

  const pipelineUF = oportunidadesAbiertas.reduce(
    (acc, op) => acc + (op.valorEstimado || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Welcome banner with high-impact prospecting focus */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden transition-colors">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-400/30 text-blue-700 dark:text-blue-300 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Protegius CRM · Hub Comercial & Prospección</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Hola, {user.name}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-1 font-medium">
              Rol: <strong className="text-slate-900 dark:text-white">{USER_ROLE_LABELS[user.role]}</strong> · Foco comercial: llamadas, reuniones y cierre de propuestas
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/prospeccion"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-md hover:shadow-lg transition duration-150 animate-pulse"
            >
              <PhoneCall className="w-4 h-4" />
              <span>🎯 Iniciar Cola de Llamados</span>
            </Link>
            <Link
              href="/cuentas/importar"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition duration-150"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Importar Excel</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Cards: Prospecting & Pipeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Llamadas Hoy */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Llamadas Realizadas Hoy</span>
            <PhoneCall className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {llamadasHoy}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Trazabilidad por ejecutiva activa
          </p>
        </div>

        {/* Reuniones Agendadas Hoy */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Reuniones Agendadas Hoy</span>
            <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-3xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
            {reunionesHoy}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Meta del barrido comercial
          </p>
        </div>

        {/* Pipeline en UF */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pipeline Activo</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatearUF(pipelineUF)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {oportunidadesAbiertas.length} negocios en curso
          </p>
        </div>

        {/* Prospectos en Base */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Base de Prospectos</span>
            <Users2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {totalCuentas}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Empresas en cartera
          </p>
        </div>
      </div>

      {/* Grid: Próximas Reuniones & Última Trazabilidad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Reuniones */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Próximas Reuniones Agendadas
              </h2>
            </div>
            <Link
              href="/reuniones"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver Agenda &rarr;
            </Link>
          </div>

          {proximasReuniones.length === 0 ? (
            <p className="text-slate-400 text-xs italic text-center py-6">
              No hay reuniones próximas. Inicia la prospección para agendar.
            </p>
          ) : (
            <div className="space-y-2.5">
              {proximasReuniones.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {r.cuenta?.razonSocial || r.titulo}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {r.persona?.nombre ? `Con ${r.persona.nombre} · ` : ""}
                      Resp: <strong>{r.responsable?.name}</strong>
                    </span>
                  </div>

                  <span className="font-bold text-purple-700 dark:text-purple-400 text-[11px] shrink-0">
                    {formatearFechaHora(r.fechaVencimiento)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimas Gestiones Registradas (Trazabilidad) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Últimos Llamados & Gestiones
              </h2>
            </div>
            <Link
              href="/prospeccion"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ir a Llamados &rarr;
            </Link>
          </div>

          {ultimasActividades.length === 0 ? (
            <p className="text-slate-400 text-xs italic text-center py-6">
              Aún no hay llamadas registradas hoy.
            </p>
          ) : (
            <div className="space-y-2.5">
              {ultimasActividades.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {act.cuenta.razonSocial}
                    </span>
                    <span className="text-slate-400">
                      {formatearFechaHora(act.fechaRealizada)} · por <strong>{act.usuario?.name || act.responsable || "Ejecutiva"}</strong>
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-[11px] line-clamp-1">
                    {act.descripcion}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
