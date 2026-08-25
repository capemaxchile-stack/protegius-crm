"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  agregarContactoNuevoAction,
  vincularContactoExistenteAction,
  ActionState,
} from "@/lib/actions-cuentas";
import { UserPlus, Link2, X } from "lucide-react";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
    >
      {pending ? "Guardando..." : label}
    </button>
  );
}

interface ContactoModalProps {
  cuentaId: string;
  personasDisponibles: {
    id: string;
    nombre: string;
    email: string | null;
    telefono: string | null;
  }[];
}

export function ContactoModal({ cuentaId, personasDisponibles }: ContactoModalProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"nuevo" | "existente">("nuevo");

  const [stateNuevo, formActionNuevo] = useFormState<ActionState | null, FormData>(
    async (prev: ActionState | null, formData: FormData) => {
      const res = await agregarContactoNuevoAction(cuentaId, prev, formData);
      if (res.success) setOpen(false);
      return res;
    },
    null
  );

  const [stateExistente, formActionExistente] = useFormState<ActionState | null, FormData>(
    async (prev: ActionState | null, formData: FormData) => {
      const res = await vincularContactoExistenteAction(cuentaId, prev, formData);
      if (res.success) setOpen(false);
      return res;
    },
    null
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition"
      >
        <UserPlus className="w-3.5 h-3.5" />
        <span>Agregar Contacto</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Gestionar Contactos de la Empresa</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 mt-4 mb-4">
              <button
                type="button"
                onClick={() => setTab("nuevo")}
                className={`flex-1 py-2 text-xs font-bold border-b-2 transition flex items-center justify-center gap-1.5 ${
                  tab === "nuevo"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Contacto Nuevo</span>
              </button>
              <button
                type="button"
                onClick={() => setTab("existente")}
                className={`flex-1 py-2 text-xs font-bold border-b-2 transition flex items-center justify-center gap-1.5 ${
                  tab === "existente"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Vincular Existente</span>
              </button>
            </div>

            {/* Tab 1: Nuevo Contacto */}
            {tab === "nuevo" && (
              <form action={formActionNuevo} className="space-y-4">
                {stateNuevo?.error && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-bold">
                    {stateNuevo.error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="nombre">
                    Nombre Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    required
                    placeholder="Ej: Marcela Peña"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="cargo">
                      Cargo en la Empresa
                    </label>
                    <input
                      id="cargo"
                      name="cargo"
                      type="text"
                      placeholder="Ej: Gerente de Finanzas"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="telefono">
                      Teléfono / Móvil
                    </label>
                    <input
                      id="telefono"
                      name="telefono"
                      type="text"
                      placeholder="+56 9 8765 4321"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="email">
                    Correo Electrónico
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="mpena@empresa.cl"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="nota">
                    Nota o Perfil del Contacto
                  </label>
                  <textarea
                    id="nota"
                    name="nota"
                    rows={2}
                    placeholder="Observaciones de contacto..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="esPrincipal"
                    name="esPrincipal"
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="esPrincipal" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Marcar como contacto principal de esta empresa
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                  >
                    Cancelar
                  </button>
                  <SubmitButton label="Crear y Asociar" />
                </div>
              </form>
            )}

            {/* Tab 2: Vincular Existente */}
            {tab === "existente" && (
              <form action={formActionExistente} className="space-y-4">
                {stateExistente?.error && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-bold">
                    {stateExistente.error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="personaId">
                    Seleccionar Persona del Sistema <span className="text-rose-500">*</span>
                  </label>
                  {personasDisponibles.length === 0 ? (
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 text-xs font-medium">
                      No hay otras personas registradas en el directorio para vincular.
                    </div>
                  ) : (
                    <select
                      id="personaId"
                      name="personaId"
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">— Seleccionar contacto —</option>
                      {personasDisponibles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} {p.email ? `(${p.email})` : ""} {p.telefono ? `· ${p.telefono}` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="cargoExistente">
                    Cargo en ESTA Empresa
                  </label>
                  <input
                    id="cargoExistente"
                    name="cargo"
                    type="text"
                    placeholder="Ej: Director / Asesor Legal"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="esPrincipalExistente"
                    name="esPrincipal"
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="esPrincipalExistente" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Marcar como contacto principal de esta empresa
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                  >
                    Cancelar
                  </button>
                  <SubmitButton label="Vincular a la Empresa" />
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
