import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ETAPAS_OPORTUNIDAD } from "@/lib/constants";
import { crearOportunidadAction } from "@/lib/actions-oportunidades";

export default async function NuevaOportunidadPage({
  searchParams,
}: {
  searchParams: { cuentaId?: string };
}) {
  const currentUser = await requireAuth();

  const [cuentas, usuarios] = await Promise.all([
    prisma.cuenta.findMany({
      orderBy: { razonSocial: "asc" },
      select: { id: true, razonSocial: true },
    }),
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  async function handleCrear(formData: FormData) {
    "use server";
    await crearOportunidadAction(null, formData);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/oportunidades"
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Nueva Oportunidad Comercial</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Crea un nuevo negocio asociado a una empresa existente.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <form action={handleCrear} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="nombre">
                Nombre del Negocio <span className="text-rose-500">*</span>
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                placeholder="Ej: Contratación Plan Empresa Pro · 50 Informes"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="cuentaId">
                Empresa / Cuenta <span className="text-rose-500">*</span>
              </label>
              <select
                id="cuentaId"
                name="cuentaId"
                required
                defaultValue={searchParams.cuentaId || ""}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">— Seleccionar empresa —</option>
                {cuentas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.razonSocial}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="etapa">
                Etapa Comercial
              </label>
              <select
                id="etapa"
                name="etapa"
                defaultValue="contacto_inicial"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {ETAPAS_OPORTUNIDAD.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="valorEstimado">
                Valor Estimado (UF)
              </label>
              <input
                id="valorEstimado"
                name="valorEstimado"
                type="number"
                step="0.1"
                placeholder="Ej: 8.5"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="probabilidad">
                Probabilidad de Cierre (%)
              </label>
              <input
                id="probabilidad"
                name="probabilidad"
                type="number"
                min="0"
                max="100"
                defaultValue={10}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="responsableId">
                Responsable Asignado
              </label>
              <select
                id="responsableId"
                name="responsableId"
                defaultValue={currentUser.id}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="fechaCierreEstimada">
                Fecha Estimada de Cierre
              </label>
              <input
                id="fechaCierreEstimada"
                name="fechaCierreEstimada"
                type="date"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="descripcion">
                Descripción / Necesidad Levantada
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                rows={3}
                placeholder="Detalle de los requerimientos y condiciones comerciales..."
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/oportunidades"
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
            >
              Crear Oportunidad
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
