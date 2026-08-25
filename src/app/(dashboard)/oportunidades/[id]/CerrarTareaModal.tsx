"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { completarTareaConResultadoAction, OportunidadActionState } from "@/lib/actions-oportunidades";
import { CheckCircle2, X } from "lucide-react";
import { TIPOS_ACTIVIDAD } from "@/lib/constants";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition disabled:opacity-50"
    >
      {pending ? "Guardando resultado..." : "Completar Compromiso"}
    </button>
  );
}

interface CerrarTareaModalProps {
  tareaId: string;
  tituloTarea: string;
  oportunidadId: string;
  cuentaId: string;
}

export function CerrarTareaModal({
  tareaId,
  tituloTarea,
  oportunidadId,
  cuentaId,
}: CerrarTareaModalProps) {
  const [open, setOpen] = useState(false);

  const [state, formAction] = useFormState<OportunidadActionState | null, FormData>(
    async (prev: OportunidadActionState | null, formData: FormData) => {
      const res = await completarTareaConResultadoAction(
        tareaId,
        oportunidadId,
        cuentaId,
        prev,
        formData
      );
      if (res.success) setOpen(false);
      return res;
    },
    null
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-400 border border-slate-700 hover:border-emerald-500/30 text-[11px] font-medium transition flex items-center gap-1"
      >
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        <span>Completar</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-white text-sm">Registrar Resultado del Compromiso</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs">
              <span className="text-slate-500 block">Compromiso a cerrar:</span>
              <p className="font-semibold text-white mt-0.5">{tituloTarea}</p>
            </div>

            {state?.error && (
              <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                {state.error}
              </div>
            )}

            <form action={formAction} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="tipoGestion">
                  Tipo de Gestión Realizada
                </label>
                <select
                  id="tipoGestion"
                  name="tipoGestion"
                  defaultValue="llamada"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {TIPOS_ACTIVIDAD.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="resultado">
                  ¿Cuál fue el resultado de la gestión? <span className="text-rose-400">*</span>
                </label>
                <textarea
                  id="resultado"
                  name="resultado"
                  required
                  rows={3}
                  placeholder="Ej: Se realizó la llamada, el cliente revisó la cotización y solicitó enviar el contrato..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
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
