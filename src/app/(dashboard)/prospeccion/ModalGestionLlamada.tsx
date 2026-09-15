"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  registrarLlamadaProspeccionAction,
  ProspeccionActionState,
} from "@/lib/actions-prospeccion";
import { RESULTADOS_LLAMADA } from "@/lib/constants";
import {
  PhoneCall,
  Calendar,
  Clock,
  X,
  CheckCircle2,
} from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
    >
      <CheckCircle2 className="w-4 h-4" />
      <span>{pending ? "Guardando..." : "Guardar Gestión"}</span>
    </button>
  );
}

interface ModalGestionLlamadaProps {
  cuenta: {
    id: string;
    razonSocial: string;
    rut?: string | null;
  };
  contacto?: {
    id: string;
    nombre: string;
    cargo?: string | null;
    telefono?: string | null;
    email?: string | null;
  } | null;
}

export function ModalGestionLlamada({
  cuenta,
  contacto,
}: ModalGestionLlamadaProps) {
  const [open, setOpen] = useState(false);
  const [resultado, setResultado] = useState<string>("no_contesta");

  const [state, formAction] = useFormState<ProspeccionActionState | null, FormData>(
    async (prev, formData) => {
      const res = await registrarLlamadaProspeccionAction(prev, formData);
      if (res.success) {
        setOpen(false);
      }
      return res;
    },
    null
  );

  // Fecha por defecto mañana o hoy
  const hoyStr = new Date().toISOString().split("T")[0];
  const manana = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition"
      >
        <PhoneCall className="w-3.5 h-3.5" />
        <span>Registrar Llamada</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 my-8">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  Trazabilidad de Prospección
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {cuenta.razonSocial}
                </h3>
                {contacto && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Contacto: <strong className="text-slate-800 dark:text-slate-200">{contacto.nombre}</strong>
                    {contacto.cargo && ` (${contacto.cargo})`}
                    {contacto.telefono && ` · 📞 ${contacto.telefono}`}
                  </p>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {state?.error && (
              <div className="mt-4 p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-bold">
                {state.error}
              </div>
            )}

            <form action={formAction} className="space-y-4 mt-4">
              <input type="hidden" name="cuentaId" value={cuenta.id} />
              {contacto && <input type="hidden" name="personaId" value={contacto.id} />}

              {/* Selector de Resultado Rápido */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  ¿Cuál fue el resultado del llamado? <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {RESULTADOS_LLAMADA.map((r) => {
                    const isSelected = resultado === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setResultado(r.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition duration-150 relative ${
                          isSelected
                            ? r.id === "reunion_agendada"
                              ? "bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-700 dark:text-purple-300 font-bold shadow-sm"
                              : r.id === "propuesta_solicitada"
                              ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-bold shadow-sm"
                              : r.id === "rellamar"
                              ? "bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-700 dark:text-amber-300 font-bold shadow-sm"
                              : r.id === "no_contesta"
                              ? "bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-700 dark:text-rose-300 font-bold shadow-sm"
                              : "bg-slate-100 dark:bg-slate-800 border-slate-400 text-slate-900 dark:text-white font-bold"
                            : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        <p className="leading-tight">{r.label}</p>
                      </button>
                    );
                  })}
                </div>
                <input type="hidden" name="resultado" value={resultado} />
              </div>

              {/* Sección Condicional: Reunión Agendada */}
              {resultado === "reunion_agendada" && (
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-bold text-xs">
                    <Calendar className="w-4 h-4" />
                    <span>Datos de la Reunión Agendada</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Fecha Reunión <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="fechaReunion"
                        required
                        defaultValue={manana}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Hora Reunión <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="time"
                        name="horaReunion"
                        required
                        defaultValue="10:30"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Modalidad
                      </label>
                      <select
                        name="modalidadReunion"
                        defaultValue="online"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="online">Videollamada (Meet / Teams / Zoom)</option>
                        <option value="presencial">Presencial (Oficina Cliente)</option>
                        <option value="telefonica">Llamada Agendada</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Link / Lugar (Opcional)
                      </label>
                      <input
                        type="text"
                        name="linkReunion"
                        placeholder="meet.google.com/xyz o Dirección"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sección Condicional: Rellamar o No Contesta */}
              {(resultado === "rellamar" || resultado === "no_contesta") && (
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-bold text-xs">
                    <Clock className="w-4 h-4" />
                    <span>Programar Próximo Intento / Rellamada</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Fecha Rellamada
                      </label>
                      <input
                        type="date"
                        name="fechaRellamada"
                        defaultValue={resultado === "no_contesta" ? hoyStr : manana}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Hora Sugerida
                      </label>
                      <input
                        type="time"
                        name="horaRellamada"
                        defaultValue={resultado === "no_contesta" ? "15:30" : "11:00"}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Detalle / Observación */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notas / Observación del llamado
                </label>
                <textarea
                  name="observacion"
                  rows={2}
                  placeholder={
                    resultado === "reunion_agendada"
                      ? "Detalles de lo conversado y objetivos de la reunión..."
                      : resultado === "no_contesta"
                      ? "Sonó ocupado / Se dejó mensaje en buzón..."
                      : "Resumen de lo hablado con el cliente..."
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
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
