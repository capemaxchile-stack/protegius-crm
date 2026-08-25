import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  BarChart3,
  UserCheck,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { formatearUF } from "@/lib/constants";
import { PanelAyuda } from "@/components/PanelAyuda";

export default async function ReportesGerencialesPage() {
  await requireAuth();

  const [
    usuarios,
    oportunidades,
    actividades,
    propuestas,
    contratos,
    cuentas,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, email: true, role: true },
    }),
    prisma.oportunidad.findMany({
      include: {
        responsable: { select: { id: true, name: true } },
        cuenta: { select: { id: true, razonSocial: true } },
      },
    }),
    prisma.actividad.findMany({
      include: {
        usuario: { select: { id: true, name: true } },
      },
    }),
    prisma.propuesta.findMany({
      include: { planes: true },
    }),
    prisma.contrato.findMany({
      include: {
        responsable: { select: { id: true, name: true } },
      },
    }),
    prisma.cuenta.findMany({
      include: {
        actividades: {
          orderBy: { fechaRealizada: "desc" },
          take: 1,
        },
      },
    }),
  ]);

  // 1. Métricas Globales
  const totalOportunidades = oportunidades.length;
  const ganadas = oportunidades.filter((o) => o.estado === "ganada");
  const perdidas = oportunidades.filter((o) => o.estado === "perdida");
  const abiertas = oportunidades.filter((o) => o.estado === "abierta");

  const montoGanadoUF = ganadas.reduce((acc, o) => acc + (o.valorEstimado || 0), 0);
  const montoAbiertoUF = abiertas.reduce((acc, o) => acc + (o.valorEstimado || 0), 0);
  const winRate =
    ganadas.length + perdidas.length > 0
      ? Math.round((ganadas.length / (ganadas.length + perdidas.length)) * 100)
      : 0;

  // 2. Rendimiento por Ejecutivo
  const metricasPorEjecutivo = usuarios.map((user) => {
    const opsUser = oportunidades.filter((o) => o.responsableId === user.id);
    const ganadasUser = opsUser.filter((o) => o.estado === "ganada");
    const perdidasUser = opsUser.filter((o) => o.estado === "perdida");
    const montoGanadoUserUF = ganadasUser.reduce((acc, o) => acc + (o.valorEstimado || 0), 0);
    const montoAbiertoUserUF = opsUser
      .filter((o) => o.estado === "abierta")
      .reduce((acc, o) => acc + (o.valorEstimado || 0), 0);

    const actUser = actividades.filter((a) => a.usuarioId === user.id);
    const llamadas = actUser.filter((a) => a.tipo === "llamada").length;
    const reuniones = actUser.filter((a) => a.tipo === "reunion").length;
    const whatsapp = actUser.filter((a) => a.tipo === "whatsapp").length;

    const contratosUser = contratos.filter((c) => c.responsableId === user.id && c.estado === "firmado");

    const winRateUser =
      ganadasUser.length + perdidasUser.length > 0
        ? Math.round((ganadasUser.length / (ganadasUser.length + perdidasUser.length)) * 100)
        : 0;

    return {
      user,
      totalOps: opsUser.length,
      ganadas: ganadasUser.length,
      perdidas: perdidasUser.length,
      montoGanadoUF: montoGanadoUserUF,
      montoAbiertoUF: montoAbiertoUserUF,
      totalActividades: actUser.length,
      llamadas,
      reuniones,
      whatsapp,
      contratosFirmados: contratosUser.length,
      winRate: winRateUser,
    };
  });

  // 3. Distribución de Motivos de Pérdida
  const motivosMap: Record<string, number> = {};
  perdidas.forEach((p) => {
    const motivo = p.motivoPerdida || "Sin especificar";
    motivosMap[motivo] = (motivosMap[motivo] || 0) + 1;
  });

  const motivosList = Object.entries(motivosMap).sort((a, b) => b[1] - a[1]);

  // 4. Salud de la Cartera: Cuentas sin contacto reciente (> 30 días)
  const ahora = new Date().getTime();
  const cuentasDesatendidas = cuentas.filter((c) => {
    const ultimaAct = c.actividades[0];
    if (!ultimaAct) return true;
    const dias = (ahora - new Date(ultimaAct.fechaRealizada).getTime()) / (1000 * 60 * 60 * 24);
    return dias > 30;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Reporte Gerencial & Métricas Comerciales
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Supervisión de rendimiento del equipo comercial, efectividad de cierre en UF y salud de cartera.
          </p>
        </div>
      </div>

      {/* Contextual Help Panel */}
      <PanelAyuda
        titulo="¿Cómo interpretar el Reporte Gerencial?"
        descripcion="Este tablero permite a jefaturas y directores evaluar la productividad del equipo comercial, identificar cuellos de botella en la conversión y auditar las cuentas desatendidas."
        pasos={[
          {
            titulo: "Actividad vs Cierre",
            detalle: "Compara el volumen de gestiones (llamadas/reuniones) contra el total de UF cerradas por ejecutivo.",
          },
          {
            titulo: "Motivos de Pérdida",
            detalle: "Detecta patrones frecuentes de rechazo para ajustar precios o argumentos comerciales.",
          },
          {
            titulo: "Salud de Cartera",
            detalle: "Supervisa las empresas sin interacción en los últimos 30 días para evitar pérdida de clientes.",
          },
        ]}
        consejoPro="Un ejecutivo con alta actividad pero bajo Win Rate suele requerir apoyo en la etapa de Negociación o Propuestas."
      />

      {/* Global KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-2">
            Ventas Cerradas (Ganadas)
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatearUF(montoGanadoUF)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {ganadas.length} de {totalOportunidades} negocios
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-2">
            Pipeline Activo (en Juego)
          </span>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
            {formatearUF(montoAbiertoUF)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {abiertas.length} negocios en negociación
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-2">
            Tasa de Cierre Global (Win Rate)
          </span>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight">{winRate}%</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {ganadas.length} ganadas · {perdidas.length} perdidas
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-2">
            Total Actividades Registradas
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{actividades.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {propuestas.length} propuestas · {contratos.filter((c) => c.estado === "firmado").length} contratos
          </p>
        </div>
      </div>

      {/* Table: Rendimiento por Ejecutivo */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm space-y-4 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Desempeño y Productividad por Ejecutivo
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{metricasPorEjecutivo.length} miembros activos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Ejecutivo Comercial</th>
                <th className="py-3 px-4 text-center">Gestiones Realizadas</th>
                <th className="py-3 px-4 text-center">Llamadas / Reuniones</th>
                <th className="py-3 px-4 text-center">Negocios Ganados</th>
                <th className="py-3 px-4 text-center">Win Rate</th>
                <th className="py-3 px-4 text-right">Monto Ganado (UF)</th>
                <th className="py-3 px-4 text-right">Pipeline Abierto (UF)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {metricasPorEjecutivo.map((m) => (
                <tr key={m.user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {m.user.name}
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-normal">{m.user.email}</span>
                  </td>

                  <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-white">
                    {m.totalActividades}
                  </td>

                  <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-300">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">{m.llamadas} llam.</span> ·{" "}
                    <span className="text-purple-600 dark:text-purple-400 font-semibold">{m.reuniones} reun.</span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/20">
                      {m.ganadas} / {m.totalOps}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center font-black text-purple-600 dark:text-purple-400">
                    {m.winRate}%
                  </td>

                  <td className="py-3.5 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatearUF(m.montoGanadoUF)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                    {formatearUF(m.montoAbiertoUF)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Motivos de Pérdida & Cuentas Desatendidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Motivos de Pérdida */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Análisis de Pérdidas ({perdidas.length} negocios)
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Distribución de causas</span>
          </div>

          {motivosList.length === 0 ? (
            <p className="text-slate-500 text-xs italic text-center py-6">
              Aún no hay oportunidades marcadas como perdidas.
            </p>
          ) : (
            <div className="space-y-3">
              {motivosList.map(([motivo, count]) => {
                const pct = Math.round((count / perdidas.length) * 100);
                return (
                  <div key={motivo} className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-900 dark:text-white">{motivo}</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {count} veces ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-800">
                      <div
                        className="bg-rose-500 h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cuentas Desatendidas / Sin contacto > 30 días */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Cuentas sin Gestión Reciente (&gt; 30 días)
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              {cuentasDesatendidas.length} cuentas
            </span>
          </div>

          {cuentasDesatendidas.length === 0 ? (
            <p className="text-emerald-600 dark:text-emerald-400 text-xs text-center py-6 font-semibold">
              ✓ ¡Excelente! Todas las cuentas tienen gestiones registradas en los últimos 30 días.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {cuentasDesatendidas.slice(0, 8).map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{c.razonSocial}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Rubro: {c.rubro || "General"} · Estado: {c.etapa}
                    </p>
                  </div>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Sin contacto</span>
                </div>
              ))}
              {cuentasDesatendidas.length > 8 && (
                <p className="text-[11px] text-slate-500 text-center pt-1">
                  y {cuentasDesatendidas.length - 8} empresas más...
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
