import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  PhoneCall,
  Calendar,
  UserCheck,
  FileSpreadsheet,
  PlusCircle,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { ColaLlamadosView, ProspectoItem } from "./ColaLlamadosView";

export default async function ProspeccionPage() {
  const currentUser = await requireAuth();

  // Fecha inicio del día de hoy
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // 1. Obtener Cuentas con sus afiliaciones y actividades ordenadas
  const [cuentas, actividadesHoy, usuarios] = await Promise.all([
    prisma.cuenta.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        responsable: {
          select: { id: true, name: true },
        },
        afiliaciones: {
          where: { activa: true },
          include: { persona: true },
          orderBy: [{ esPrincipal: "desc" }, { createdAt: "asc" }],
        },
        actividades: {
          orderBy: { fechaRealizada: "desc" },
          take: 1,
          include: {
            usuario: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: { actividades: true },
        },
      },
    }),
    prisma.actividad.findMany({
      where: {
        fechaRealizada: { gte: hoy },
      },
      select: {
        id: true,
        tipo: true,
        usuarioId: true,
        descripcion: true,
      },
    }),
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // 2. Mapear prospectos
  const prospectos: ProspectoItem[] = cuentas.map((c) => {
    const contactoPrincipal = c.afiliaciones[0]?.persona
      ? {
          id: c.afiliaciones[0].persona.id,
          nombre: c.afiliaciones[0].persona.nombre,
          cargo: c.afiliaciones[0].cargo || c.afiliaciones[0].persona.cargo,
          telefono: c.afiliaciones[0].persona.telefono,
          email: c.afiliaciones[0].persona.email,
        }
      : null;

    const ultima = c.actividades[0]
      ? {
          id: c.actividades[0].id,
          tipo: c.actividades[0].tipo,
          descripcion: c.actividades[0].descripcion,
          fechaRealizada: c.actividades[0].fechaRealizada,
          responsable: c.actividades[0].responsable,
          usuario: c.actividades[0].usuario,
          proximoPaso: c.actividades[0].proximoPaso,
          fechaProximoPaso: c.actividades[0].fechaProximoPaso,
        }
      : null;

    return {
      id: c.id,
      razonSocial: c.razonSocial,
      rut: c.rut,
      rubro: c.rubro,
      etapa: c.etapa,
      responsable: c.responsable,
      contactoPrincipal,
      ultimaActividad: ultima,
      totalLlamadas: c._count.actividades,
    };
  });

  // 3. Métricas de hoy
  const llamadasHoy = actividadesHoy.filter((a) => a.tipo === "llamada").length;
  const reunionesHoy = actividadesHoy.filter((a) => a.tipo === "reunion" || a.descripcion.includes("REUNIÓN")).length;
  const misLlamadasHoy = actividadesHoy.filter(
    (a) => a.usuarioId === currentUser.id && a.tipo === "llamada"
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Centro de Prospección & Llamadas
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Trazabilidad en Vivo
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Barrido comercial de contactos, registro de resultados y agendamiento de reuniones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/cuentas/importar"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Importar Excel Contactos</span>
          </Link>

          <Link
            href="/cuentas/nueva"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Nuevo Contacto</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards de Gestión Diaria */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Llamadas de Hoy */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 text-[11px] block font-medium">
              Llamadas Totales Hoy
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{llamadasHoy}</span>
              <span className="text-[10px] text-slate-400 font-semibold">({misLlamadasHoy} mías)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Reuniones Agendadas Hoy */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 text-[11px] block font-medium">
              Reuniones Agendadas Hoy
            </span>
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{reunionesHoy}</span>
          </div>
        </div>

        {/* Card 3: Total en Cola de Prospección */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 text-[11px] block font-medium">
              Prospectos en Base
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{prospectos.length}</span>
          </div>
        </div>

        {/* Card 4: Acceso Rápido a Pipeline */}
        <Link
          href="/oportunidades/pipeline"
          className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-4 shadow-md flex items-center justify-between hover:opacity-95 transition"
        >
          <div>
            <span className="text-blue-100 text-[11px] block font-medium">Pipeline Simplificado</span>
            <span className="text-lg font-black tracking-tight">Ver Kanban →</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
        </Link>
      </div>

      {/* Tabla Interactiva de la Cola de Llamados */}
      <ColaLlamadosView
        prospectos={prospectos}
        currentUserId={currentUser.id}
        usuarios={usuarios}
      />
    </div>
  );
}
