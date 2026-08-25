"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { registrarActividadCuentaAction, ActionState } from "@/lib/actions-cuentas";
import { PhoneCall, X } from "lucide-react";
import { TIPOS_ACTIVIDAD } from "@/lib/constants";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition disabled:opacity-50"
    >
      {pending ? "Guardando..." : "Registrar Actividad"}
    </button>
  );
}

interface ActividadModalProps {
  cuentaId: string;
  contactos: {
    id: string;
    persona: {
      id: string;
      nombre: string;
    };
  }[];
}

export function ActividadModal({ cuentaId, contactos }: ActividadModalProps) {
  const [open, setOpen] = useState(false);

  const [state, formAction] = useFormState<ActionState | null, FormData>(
    async (prev: ActionState | null, formData: FormData) => {
      const res = await registrarActividadCuentaAction(cuentaId, prev, formData);
      if (res.success) setOpen(false);
      return res;
    },
    null
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition"
      >
        <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
        <span>Registrar Gestión</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-white text-sm">Registrar Interacción Comercial</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {state?.error && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                {state.error}
              </div>
            )}

            <form action={formAction} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="tipo">
                    Canal / Tipo
                  </label>
                  <select
                    id="tipo"
                    name="tipo"
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
                  <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="personaId">
                    ¿Con quién hablaste?
                  </label>
                  <select
                    id="personaId"
                    name="personaId"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">— Ninguno / General —</option>
                    {contactos.map((c) => (
                      <option key={c.persona.id} value={c.persona.id}>
                        {c.persona.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="descripcion">
                  ¿Qué se conversó o acordó? <span className="text-rose-400">*</span>
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  required
                  rows={3}
                  placeholder="Detalle de la interacción, feedback del cliente, etc..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Próximo Paso / Compromiso
                </p>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="proximoPaso">
                    Acción a realizar
                  </label>
                  <input
                    id="proximoPaso"
                    name="proximoPaso"
                    type="text"
                    placeholder="Ej: Enviar propuesta por correo / Llamar el jueves"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="fechaProximoPaso">
                    Fecha del compromiso
                  </label>
                  <input
                    id="fechaProximoPaso"
                    name="fechaProximoPaso"
                    type="date"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
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
