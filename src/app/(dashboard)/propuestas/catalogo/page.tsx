import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  Layers,
  Shield,
  Power,
} from "lucide-react";
import { formatearUF } from "@/lib/constants";
import {
  crearPlanAction,
  crearServicioAction,
  toggleActivoPlanAction,
  toggleActivoServicioAction,
} from "@/lib/actions-propuestas";

export default async function CatalogoPreciosPage() {
  await requireAuth();

  const [grupos, servicios] = await Promise.all([
    prisma.grupoPlan.findMany({
      orderBy: { orden: "asc" },
      include: {
        planes: {
          orderBy: { valorEmpresaUF: "asc" },
        },
      },
    }),
    prisma.servicio.findMany({
      orderBy: { nombre: "asc" },
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/propuestas"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Catálogo Maestro de Precios en UF</h1>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Administración de planes base, precios y alcance de servicios.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Planes de Suscripción */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Planes y Tarifas Base (en UF)</h2>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Valores mensuales</span>
            </div>

            <div className="space-y-6">
              {grupos.map((grupo) => (
                <div key={grupo.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {grupo.nombre}
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {grupo.planes.map((plan) => (
                      <div
                        key={plan.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 text-xs transition ${
                          plan.activo
                            ? "bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800"
                            : "bg-slate-50/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-900 opacity-60"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 dark:text-white">{plan.nombre}</p>
                            {!plan.activo && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                Inactivo
                              </span>
                            )}
                          </div>
                          {plan.detalle && (
                            <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">{plan.detalle}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                              {formatearUF(plan.valorEmpresaUF)}
                            </p>
                            <span className="text-[10px] text-slate-400">mensual</span>
                          </div>

                          <form
                            action={async () => {
                              "use server";
                              await toggleActivoPlanAction(plan.id, plan.activo);
                            }}
                          >
                            <button
                              type="submit"
                              title={plan.activo ? "Desactivar del cotizador" : "Activar en cotizador"}
                              className={`p-1.5 rounded-lg border transition ${
                                plan.activo
                                  ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 hover:text-rose-600"
                                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-emerald-600"
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form: Agregar Nuevo Plan */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
              + Agregar Nuevo Plan al Catálogo
            </h3>

            <form action={crearPlanAction} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Grupo de Plan</label>
                  <select
                    name="grupoId"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {grupos.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Nombre del Plan</label>
                  <input
                    name="nombre"
                    type="text"
                    required
                    placeholder="Ej: Plan Enterprise Plus"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Detalle / Capacidad</label>
                  <input
                    name="detalle"
                    type="text"
                    placeholder="Ej: Hasta 100 consultas · 10 usuarios"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Valor Empresa (UF/mes)</label>
                  <input
                    name="valorEmpresaUF"
                    type="number"
                    step="0.1"
                    required
                    placeholder="Ej: 12.5"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                >
                  Guardar Plan
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Col: Servicios de Alcance */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Servicios de Alcance</h2>
              </div>
            </div>

            <div className="space-y-2.5">
              {servicios.map((s) => (
                <div
                  key={s.id}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 transition ${
                    s.activo
                      ? "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                      : "bg-slate-50/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-900 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-slate-900 dark:text-white">{s.nombre}</p>
                    <form
                      action={async () => {
                        "use server";
                        await toggleActivoServicioAction(s.id, s.activo);
                      }}
                    >
                      <button
                        type="submit"
                        className={`p-1 rounded-lg border text-[10px] ${
                          s.activo
                            ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                        }`}
                      >
                        <Power className="w-3 h-3" />
                      </button>
                    </form>
                  </div>
                  {s.descripcion && (
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">{s.descripcion}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form: Agregar Nuevo Servicio */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
              + Agregar Servicio de Alcance
            </h3>

            <form action={crearServicioAction} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Nombre del Servicio</label>
                <input
                  name="nombre"
                  type="text"
                  required
                  placeholder="Ej: Monitoreo Continuo de Quiebras"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Descripción / Alcance</label>
                <textarea
                  name="descripcion"
                  rows={2}
                  placeholder="Detalle de lo que incluye el servicio..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
                >
                  Guardar Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
