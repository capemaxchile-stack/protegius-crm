import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  TrendingUp,
  PhoneCall,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  FileSpreadsheet,
  FileCheck2,
} from "lucide-react";
import { USER_ROLE_LABELS, formatearUF } from "@/lib/constants";
import { PanelAyuda } from "@/components/PanelAyuda";

export default async function DashboardPage() {
  const user = await requireAuth();

  // Obtener estadísticas rápidas
  const [
    totalCuentas,
    totalOportunidades,
    oportunidadesAbiertas,
    totalTareasPendientes,
    totalContratosFirmados,
    totalOnboardingsActivos,
  ] = await Promise.all([
    prisma.cuenta.count(),
    prisma.oportunidad.count(),
    prisma.oportunidad.findMany({
      where: { estado: "abierta" },
      select: { valorEstimado: true, probabilidad: true },
    }),
    prisma.tarea.count({
      where: { estado: "pendiente" },
    }),
    prisma.contrato.count({
      where: { estado: "firmado" },
    }),
    prisma.onboardingCliente.count({
      where: { estado: "en_proceso" },
    }),
  ]);

  const pipelineUF = oportunidadesAbiertas.reduce(
    (acc, op) => acc + (op.valorEstimado || 0),
    0
  );

  const pipelinePonderadoUF = oportunidadesAbiertas.reduce(
    (acc, op) => acc + ((op.valorEstimado || 0) * (op.probabilidad || 0)) / 100,
    0
  );

  return (
    <div className="space-y-6">
      {/* Welcome banner - Pure white in light mode, Dark navy gradient in dark mode */}
      <div className="bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden transition-colors">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-400/30 text-blue-700 dark:text-blue-300 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Protegius CRM · Homelab Ready</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Bienvenido, {user.name}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
              Perfil: <span className="font-bold text-slate-900 dark:text-white">{USER_ROLE_LABELS[user.role]}</span> · Control comercial y gestión de clientes
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/oportunidades/gestiones"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition duration-150"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Nueva Gestión</span>
            </Link>
            <Link
              href="/oportunidades/alta-rapida"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-sm transition duration-150"
            >
              <PlusCircle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>Alta Rápida</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Contextual Help Banner */}
      <PanelAyuda
        titulo="Guía Rápida del Flujo Comercial"
        descripcion="Protegius CRM organiza el ciclo de ventas B2B en etapas claras: Prospección Temprana -> Oportunidad en UF -> Propuesta Formal -> Contrato Firmado -> Onboarding Técnico."
        pasos={[
          {
            titulo: "1. Captación",
            detalle: "Registra llamadas en Gestiones Tempranas o usa Alta Rápida para crear todo en un paso.",
          },
          {
            titulo: "2. Negociación",
            detalle: "Mueve los negocios por las 6 etapas del Pipeline y emite propuestas con precios congelados en UF.",
          },
          {
            titulo: "3. Activación",
            detalle: "Firma el contrato y completa el Onboarding técnico para activar los servicios recurrentes.",
          },
        ]}
        consejoPro="Puedes revisar la guía completa en cualquier momento desde la sección 'Centro de Ayuda' en la barra lateral."
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pipeline Abierto */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Pipeline Abierto</span>
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatearUF(pipelineUF)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ponderado: <span className="text-blue-600 dark:text-blue-400 font-bold">{formatearUF(pipelinePonderadoUF)}</span>
          </p>
        </div>

        {/* Oportunidades */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Oportunidades</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {oportunidadesAbiertas.length}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Total histórico: <span className="font-semibold text-slate-800 dark:text-slate-200">{totalOportunidades}</span>
          </p>
        </div>

        {/* Contratos Firmados */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Contratos Firmados</span>
            <FileCheck2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {totalContratosFirmados}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            En Onboarding: <span className="text-cyan-600 dark:text-cyan-400 font-bold">{totalOnboardingsActivos}</span>
          </p>
        </div>

        {/* Tareas Pendientes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Compromisos Pendientes</span>
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {totalTareasPendientes}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cuentas en cartera: <span className="font-semibold text-slate-800 dark:text-slate-200">{totalCuentas}</span>
          </p>
        </div>
      </div>

      {/* Module shortcuts */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Acceso Rápido a Módulos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/oportunidades/pipeline"
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition duration-150 group shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition duration-150" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Pipeline de Ventas (UF)</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Tablero Kanban con 6 etapas de venta y métricas en vivo.
            </p>
          </Link>

          <Link
            href="/propuestas"
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition duration-150 group shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition duration-150" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Cotizador de Propuestas</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Cotizaciones con precios congelados y membresías en UF.
            </p>
          </Link>

          <Link
            href="/contratos"
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition duration-150 group shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <FileCheck2 className="w-5 h-5 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition duration-150" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Contratos & Onboarding</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Firma de acuerdos y entrega técnica de credenciales a clientes.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
