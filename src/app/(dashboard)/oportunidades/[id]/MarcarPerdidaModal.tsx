"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { marcarOportunidadPerdidaAction, OportunidadActionState } from "@/lib/actions-oportunidades";
import { XCircle, X } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
    >
      {pending ? "Guardando..." : "Confirmar Pérdida"}
    </button>
  );
}

interface MarcarPerdidaModalProps {
  oportunidadId: string;
}

export function MarcarPerdidaModal({ oportunidadId }: MarcarPerdidaModalProps) {
  const [open, setOpen] = useState(false);

  const [state, formAction] = useFormState<OportunidadActionState | null, FormData>(
    async (prev: OportunidadActionState | null, formData: FormData) => {
      const res = await marcarOportunidadPerdidaAction(oportunidadId, prev, formData);
      if (res.success) setOpen(false);
      return res;
    },
    null
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 font-bold text-xs transition"
      >
        <XCircle className="w-3.5 h-3.5" />
        <span>Marcar Perdida</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <XCircle className="w-4 h-4" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Marcar Oportunidad como Perdida</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {state?.error && (
              <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-bold">
                {state.error}
              </div>
            )}

            <form action={formAction} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="motivoPerdida">
                  Motivo de Pérdida <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="motivoPerdida"
                  name="motivoPerdida"
                  required
                  rows={3}
                  placeholder="Ej: Precio fuera de presupuesto / Eligió proveedor alternativo / Proyecto congelado..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
