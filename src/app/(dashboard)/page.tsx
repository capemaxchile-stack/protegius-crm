import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  TrendingUp,
  Building2,
  PhoneCall,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  FileSpreadsheet,
} from "lucide-react";
import { USER_ROLE_LABELS, formatearUF } from "@/lib/constants";

export default async function DashboardPage() {
  const user = await requireAuth();

  // Obtener estadísticas rápidas
  const [totalCuentas, totalOportunidades, oportunidadesAbiertas, totalTareasPendientes] =
    await Promise.all([
      prisma.cuenta.count(),
      prisma.oportunidad.count(),
      prisma.oportunidad.findMany({
        where: { estado: "abierta" },
        select: { valorEstimado: true, probabilidad: true },
      }),
      prisma.tarea.count({
        where: { estado: "pendiente" },
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
              href="/oportunidades/nueva"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition duration-150"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Crear Oportunidad</span>
            </Link>
          </div>
        </div>
      </div>

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

        {/* Empresas / Prospectos */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Cuentas Registradas</span>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {totalCuentas}
          </div>
          <p className="text-xs text-slate-400 mt-1">Empresas en cartera</p>
        </div>

        {/* Tareas Pendientes */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Compromisos / Tareas</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {totalTareasPendientes}
          </div>
          <p className="text-xs text-slate-400 mt-1">Acciones pendientes de seguimiento</p>
        </div>
      </div>

      {/* Quick shortcuts & System status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module shortcuts */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-4">Acceso Rápido a Módulos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/oportunidades/gestiones"
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-blue-500/40 transition duration-150 group"
            >
              <div className="flex items-center justify-between mb-2">
                <PhoneCall className="w-5 h-5 text-blue-400 group-hover:scale-110 transition duration-150" />
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition" />
              </div>
              <h3 className="font-semibold text-sm text-white">Gestiones Tempranas</h3>
              <p className="text-xs text-slate-400 mt-1">
                Registra llamadas, WhatsApp y reuniones sin crear oportunidad forzada.
              </p>
            </Link>

            <Link
              href="/oportunidades"
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-blue-500/40 transition duration-150 group"
            >
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition duration-150" />
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition" />
              </div>
              <h3 className="font-semibold text-sm text-white">Pipeline de Oportunidades</h3>
              <p className="text-xs text-slate-400 mt-1">
                Monitorea el avance de negocios en UF a través de las 6 etapas comerciales.
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
              <h3 className="font-semibold text-sm text-white">Módulo de Propuestas</h3>
              <p className="text-xs text-slate-400 mt-1">
                Cotizaciones estandarizadas y generación de documentos profesionales.
              </p>
            </Link>

            <Link
              href="/cuentas"
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-blue-500/40 transition duration-150 group"
            >
              <div className="flex items-center justify-between mb-2">
                <Building2 className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition duration-150" />
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition" />
              </div>
              <h3 className="font-semibold text-sm text-white">Fichero de Clientes y Contactos</h3>
              <p className="text-xs text-slate-400 mt-1">
                Directorio unificado con validación de RUT y trazabilidad histórica.
              </p>
            </Link>
          </div>
        </div>

        {/* Infrastructure & System Details */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-white mb-3">Infraestructura Homelab</h2>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Motor de Base de Datos</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-blue-400">PostgreSQL 16</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Autenticación</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-emerald-400">JWT + RBAC</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Contenedor</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-indigo-400">Docker Compose</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Moneda Base</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-400">UF (Chile)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <p className="text-[11px] text-slate-500">
              Protegius CRM v1.0.0 · Diseñado para arquitectura autónoma y flexible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
