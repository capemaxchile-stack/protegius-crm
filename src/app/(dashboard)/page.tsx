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
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Protegius CRM · Homelab Ready</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Bienvenido, {user.name}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Perfil: <span className="text-slate-200 font-medium">{USER_ROLE_LABELS[user.role]}</span> · Control comercial y gestión de clientes
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/oportunidades/gestiones"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md hover:shadow-lg transition duration-150"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Nueva Gestión</span>
            </Link>
            <Link
              href="/oportunidades/alta-rapida"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition duration-150"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
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
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Pipeline Abierto</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatearUF(pipelineUF)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ponderado: <span className="text-blue-400 font-semibold">{formatearUF(pipelinePonderadoUF)}</span>
          </p>
        </div>

        {/* Oportunidades */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Oportunidades</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {oportunidadesAbiertas.length}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Total histórico: <span className="text-slate-200">{totalOportunidades}</span>
          </p>
        </div>

        {/* Contratos Firmados */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Contratos Firmados</span>
            <FileCheck2 className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {totalContratosFirmados}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            En Onboarding: <span className="text-cyan-400 font-semibold">{totalOnboardingsActivos}</span>
          </p>
        </div>

        {/* Tareas Pendientes */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Compromisos Pendientes</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {totalTareasPendientes}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cuentas en cartera: <span className="text-slate-200">{totalCuentas}</span>
          </p>
        </div>
      </div>

      {/* Module shortcuts */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white mb-4">Acceso Rápido a Módulos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/oportunidades/pipeline"
            className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-blue-500/40 transition duration-150 group"
          >
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-purple-400 group-hover:scale-110 transition duration-150" />
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition" />
            </div>
            <h3 className="font-semibold text-sm text-white">Pipeline de Ventas (UF)</h3>
            <p className="text-xs text-slate-400 mt-1">
              Tablero Kanban con 6 etapas de venta y métricas en vivo.
            </p>
          </Link>

          <Link
            href="/propuestas"
            className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-blue-500/40 transition duration-150 group"
          >
            <div className="flex items-center justify-between mb-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-400 group-hover:scale-110 transition duration-150" />
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition" />
            </div>
            <h3 className="font-semibold text-sm text-white">Cotizador de Propuestas</h3>
            <p className="text-xs text-slate-400 mt-1">
              Cotizaciones con precios congelados y membresías en UF.
            </p>
          </Link>

          <Link
            href="/contratos"
            className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-blue-500/40 transition duration-150 group"
          >
            <div className="flex items-center justify-between mb-2">
              <FileCheck2 className="w-5 h-5 text-rose-400 group-hover:scale-110 transition duration-150" />
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-rose-400 transition" />
            </div>
            <h3 className="font-semibold text-sm text-white">Contratos & Onboarding</h3>
            <p className="text-xs text-slate-400 mt-1">
              Firma de acuerdos y entrega técnica de credenciales a clientes.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
