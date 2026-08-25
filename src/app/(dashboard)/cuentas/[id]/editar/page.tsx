import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { ETAPAS_CUENTA } from "@/lib/constants";
import { actualizarCuentaAction } from "@/lib/actions-cuentas";

export default async function EditarCuentaPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAuth();

  const cuenta = await prisma.cuenta.findUnique({
    where: { id: params.id },
  });

  if (!cuenta) {
    notFound();
  }

  const cuentaId = cuenta.id;

  const usuarios = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  async function handleActualizar(formData: FormData) {
    "use server";
    await actualizarCuentaAction(cuentaId, null, formData);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/cuentas/${cuenta.id}`}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Editar Cuenta: {cuenta.razonSocial}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Modifica los datos comerciales de la empresa.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <form action={handleActualizar} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="razonSocial">
                Razón Social <span className="text-rose-400">*</span>
              </label>
              <input
                id="razonSocial"
                name="razonSocial"
                type="text"
                defaultValue={cuenta.razonSocial}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="rut">
                RUT
              </label>
              <input
                id="rut"
                name="rut"
                type="text"
                defaultValue={cuenta.rut || ""}
                placeholder="76543210-K"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="rubro">
                Rubro / Giro
              </label>
              <input
                id="rubro"
                name="rubro"
                type="text"
                defaultValue={cuenta.rubro || ""}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="sitioWeb">
                Sitio Web
              </label>
              <input
                id="sitioWeb"
                name="sitioWeb"
                type="text"
                defaultValue={cuenta.sitioWeb || ""}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="etapa">
                Etapa Comercial
              </label>
              <select
                id="etapa"
                name="etapa"
                defaultValue={cuenta.etapa}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {ETAPAS_CUENTA.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="responsableId">
                Responsable Asignado
              </label>
              <select
                id="responsableId"
                name="responsableId"
                defaultValue={cuenta.responsableId || ""}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">— Sin responsable asignado —</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="origenLead">
                Origen del Lead
              </label>
              <input
                id="origenLead"
                name="origenLead"
                type="text"
                defaultValue={cuenta.origenLead || ""}
                placeholder="Ej: Referido, LinkedIn, Prospección"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="notas">
                Notas y Antecedentes
              </label>
              <textarea
                id="notas"
                name="notas"
                rows={3}
                defaultValue={cuenta.notas || ""}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Link
              href={`/cuentas/${cuenta.id}`}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
