"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  registrarAccionFlujoAction,
  InteraccionActionState,
} from "@/lib/actions-interacciones";
import { TIPOS_ACTIVIDAD, HITOS_FLUJO_SLA } from "@/lib/constants";
import {
  Zap,
  X,
  CheckCircle2,
  UserCheck,
  Clock,
  ShieldAlert,
} from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
    >
      <CheckCircle2 className="w-4 h-4" />
      <span>{pending ? "Guardando..." : "Guardar Acción"}</span>
    </button>
  );
}

interface ModalRegistrarAccionProps {
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
  usuarios: { id: string; name: string }[];
  currentUserId: string;
}

export function ModalRegistrarAccion({
  cuenta,
  contacto,
  usuarios,
  currentUserId,
}: ModalRegistrarAccionProps) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<string>("whatsapp");
  const [requiereCompromiso, setRequiereCompromiso] = useState<"si" | "no">("si");
  const [hitoFlujo, setHitoFlujo] = useState<string>("cotizacion");
  const [proximoPaso, setProximoPaso] = useState<string>(
    `Enviar cotización / propuesta comercial a ${cuenta.razonSocial}`
  );

  const mananaStr = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [state, formAction] = useFormState<InteraccionActionState | null, FormData>(
    async (prev, formData) => {
      const res = await registrarAccionFlujoAction(prev, formData);
      if (res.success) {
        setOpen(false);
      }
      return res;
    },
    null
  );

  const handleSelectHito = (id: string) => {
    setHitoFlujo(id);
    if (id === "cotizacion") {
      setProximoPaso(`Enviar cotización / propuesta comercial a ${cuenta.razonSocial}`);
    } else if (id === "contrato") {
      setProximoPaso(`Preparar y enviar contrato de servicios a ${cuenta.razonSocial}`);
    } else if (id === "reunion") {
      setProximoPaso(`Realizar reunión de diagnóstico con ${cuenta.razonSocial}`);
    } else if (id === "llamada") {
      setProximoPaso(`Hacer seguimiento telefónico a ${cuenta.razonSocial}`);
    } else {
      setProximoPaso(`Enviar información comercial por correo a ${cuenta.razonSocial}`);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition"
        title="Registrar otra acción comercial o delegar cotización/contrato"
      >
        <Zap className="w-3.5 h-3.5" />
        <span>Registrar Acción</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto text-left">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 my-8">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Acción Comercial & Flujo Auditado (SLA)
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {cuenta.razonSocial}
                </h3>
                {contacto && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Contacto: <strong className="text-slate-800 dark:text-slate-200">{contacto.nombre}</strong>
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
              <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-bold">
                {state.error}
              </div>
            )}

            <form action={formAction} className="space-y-4 mt-4">
              <input type="hidden" name="cuentaId" value={cuenta.id} />
              {contacto && <input type="hidden" name="personaId" value={contacto.id} />}

              {/* 1. Canal / Tipo de Acción */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  1. ¿Qué acción acabas de realizar?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {TIPOS_ACTIVIDAD.filter((t) => t.id !== "otro").map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTipo(t.id)}
                      className={`px-2.5 py-2 rounded-xl border text-[11px] font-bold transition text-center ${
                        tipo === t.id
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      {t.label.split(" ")[0]}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="tipo" value={tipo} />
              </div>

              {/* 2. Detalle de la interacción */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  2. Resumen / Detalle de la Acción <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="descripcion"
                  required
                  rows={2}
                  placeholder="Ej: Conversamos por WhatsApp, confirmó interés en plan corporativo y pidió cotización formal..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* 3. ¿Genera un siguiente paso o compromiso auditado? */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>3. Flujo de Seguimiento y Auditoría SLA</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setRequiereCompromiso("si")}
                      className={`px-2.5 py-1 rounded-md transition ${
                        requiereCompromiso === "si"
                          ? "bg-blue-600 text-white"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      }`}
                    >
                      Asignar Próximo Paso
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequiereCompromiso("no")}
                      className={`px-2.5 py-1 rounded-md transition ${
                        requiereCompromiso === "no"
                          ? "bg-emerald-600 text-white"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      }`}
                    >
                      ✓ Ya Realizada
                    </button>
                  </div>
                </div>
                <input type="hidden" name="requiereCompromiso" value={requiereCompromiso} />

                {requiereCompromiso === "si" ? (
                  <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                    {/* Tipo de hito rápido */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Hito del Flujo Comercial
                      </label>
                      <select
                        name="hitoFlujo"
                        value={hitoFlujo}
                        onChange={(e) => handleSelectHito(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                      >
                        {HITOS_FLUJO_SLA.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.label} (SLA ref: {h.slaHorasDefault}h)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Acción requerida */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Acción específica a auditar <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="proximoPaso"
                        required
                        value={proximoPaso}
                        onChange={(e) => setProximoPaso(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Encargado responsable + Prioridad */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-blue-600" />
                          <span>Encargado Responsable</span>
                        </label>
                        <select
                          name="encargadoId"
                          defaultValue={currentUserId}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                        >
                          {usuarios.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} {u.id === currentUserId ? "(Yo)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Prioridad / Nivel SLA
                        </label>
                        <select
                          name="prioridad"
                          defaultValue="alta"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                        >
                          <option value="critica">🚨 Crítica / Urgente</option>
                          <option value="alta">⚡ Alta (Cotización / Reunión)</option>
                          <option value="media">📌 Media (Seguimiento)</option>
                        </select>
                      </div>
                    </div>

                    {/* Fecha y Hora Límite (SLA) */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Fecha Límite (SLA)</span>
                        </label>
                        <input
                          type="date"
                          name="fechaLimite"
                          required
                          defaultValue={mananaStr}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Hora Límite
                        </label>
                        <input
                          type="time"
                          name="horaLimite"
                          required
                          defaultValue="18:00"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5 pt-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Esta interacción quedará marcada de inmediato en verde como ✓ Realizada.</span>
                  </p>
                )}
              </div>

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
