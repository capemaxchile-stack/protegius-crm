"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { actualizarContactoAction, ContactoActionState } from "@/lib/actions-contactos";
import { Edit, User, X } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
    >
      {pending ? "Guardando cambios..." : "Guardar Cambios"}
    </button>
  );
}

interface EditarContactoModalProps {
  contacto: {
    id: string;
    nombre: string;
    cargo: string | null;
    email: string | null;
    telefono: string | null;
    nota?: string | null;
  };
  afiliacionId?: string;
  afiliacionCargo?: string | null;
  cuentaId?: string;
  variant?: "button" | "icon";
}

export function EditarContactoModal({
  contacto,
  afiliacionId,
  afiliacionCargo,
  cuentaId,
  variant = "button",
}: EditarContactoModalProps) {
  const [open, setOpen] = useState(false);

  const [state, formAction] = useFormState<ContactoActionState | null, FormData>(
    async (prev: ContactoActionState | null, formData: FormData) => {
      const res = await actualizarContactoAction(
        contacto.id,
        afiliacionId,
        cuentaId,
        prev,
        formData
      );
      if (res.success) {
        setOpen(false);
      }
      return res;
    },
    null
  );

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Editar contacto"
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <Edit className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/40 text-[11px] font-semibold transition"
        >
          <Edit className="w-3 h-3" />
          <span>Editar</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Editar Información del Contacto</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{contacto.nombre}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="nombre">
                  Nombre Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  required
                  defaultValue={contacto.nombre}
                  placeholder="Ej: Marcela Peña"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="cargo">
                    Cargo Principal / Perfil
                  </label>
                  <input
                    id="cargo"
                    name="cargo"
                    type="text"
                    defaultValue={contacto.cargo || ""}
                    placeholder="Ej: Gerente Comercial"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {afiliacionId ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="afiliacionCargo">
                      Cargo en esta Empresa
                    </label>
                    <input
                      id="afiliacionCargo"
                      name="afiliacionCargo"
                      type="text"
                      defaultValue={afiliacionCargo || contacto.cargo || ""}
                      placeholder="Ej: Jefa de Compras"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="telefono">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      id="telefono"
                      name="telefono"
                      type="text"
                      defaultValue={contacto.telefono || ""}
                      placeholder="+56 9 8765 4321"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="email">
                    Correo Electrónico
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={contacto.email || ""}
                    placeholder="contacto@empresa.cl"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {afiliacionId && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="telefono">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      id="telefono"
                      name="telefono"
                      type="text"
                      defaultValue={contacto.telefono || ""}
                      placeholder="+56 9 8765 4321"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="nota">
                  Notas o Comentarios Internos
                </label>
                <textarea
                  id="nota"
                  name="nota"
                  rows={2}
                  defaultValue={contacto.nota || ""}
                  placeholder="Información adicional, disponibilidad horaria, toma de decisiones..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
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
