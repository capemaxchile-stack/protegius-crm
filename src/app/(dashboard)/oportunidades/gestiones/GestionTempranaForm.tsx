"use client";

import { useFormState, useFormStatus } from "react-dom";
import { registrarGestionTempranaAction, OportunidadActionState } from "@/lib/actions-oportunidades";
import { PhoneCall, CheckCircle2, User, Building2 } from "lucide-react";
import { TIPOS_ACTIVIDAD } from "@/lib/constants";
import { useState } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition disabled:opacity-50"
    >
      {pending ? "Guardando gestión..." : "Registrar Gestión Comercial"}
    </button>
  );
}

interface GestionTempranaFormProps {
  cuentas: {
    id: string;
    razonSocial: string;
    afiliaciones: {
      persona: {
        id: string;
        nombre: string;
        cargo: string | null;
      };
    }[];
  }[];
  resetKey: string;
  okMessage?: boolean;
}

export function GestionTempranaForm({ cuentas, resetKey, okMessage }: GestionTempranaFormProps) {
  const [cuentaSeleccionadaId, setCuentaSeleccionadaId] = useState<string>("");
  const [modoNuevaCuenta, setModoNuevaCuenta] = useState(false);
  const [modoNuevoContacto, setModoNuevoContacto] = useState(false);
  const [crearTarea, setCrearTarea] = useState(true);

  const [state, formAction] = useFormState<OportunidadActionState | null, FormData>(
    registrarGestionTempranaAction,
    null
  );

  const cuentaActual = cuentas.find((c) => c.id === cuentaSeleccionadaId);
  const contactosDeCuenta = cuentaActual?.afiliaciones.map((a) => a.persona) || [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Registro de Gestión Temprana</h2>
        </div>
        <span className="text-[11px] text-slate-400">
          Para contactos y prospección previa a abrir una oportunidad
        </span>
      </div>

      {okMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2 font-medium animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>¡Gestión comercial registrada con éxito! El formulario ha sido limpiado.</span>
        </div>
      )}

      {state?.error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium">
          {state.error}
        </div>
      )}

      <form key={resetKey} action={formAction} className="space-y-5">
        {/* A. Cuenta / Empresa */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Empresa / Prospecto</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setModoNuevaCuenta(!modoNuevaCuenta);
                setCuentaSeleccionadaId("");
              }}
              className="text-[11px] text-blue-400 hover:underline"
            >
              {modoNuevaCuenta ? "Seleccionar cuenta existente" : "+ Ingresar empresa nueva"}
            </button>
          </div>

          {!modoNuevaCuenta ? (
            <select
              name="cuentaId"
              value={cuentaSeleccionadaId}
              onChange={(e) => setCuentaSeleccionadaId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">— Seleccionar empresa de la lista —</option>
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.razonSocial}
                </option>
              ))}
            </select>
          ) : (
            <input
              name="nuevaCuentaNombre"
              type="text"
              required
              placeholder="Nombre de la nueva empresa o prospecto"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          )}
        </div>

        {/* B. Contacto */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Contacto</span>
            </label>
            <button
              type="button"
              onClick={() => setModoNuevoContacto(!modoNuevoContacto)}
              className="text-[11px] text-emerald-400 hover:underline"
            >
              {modoNuevoContacto ? "Seleccionar contacto existente" : "+ Ingresar contacto nuevo"}
            </button>
          </div>

          {!modoNuevoContacto && !modoNuevaCuenta && contactosDeCuenta.length > 0 ? (
            <select
              name="personaId"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">— Seleccionar contacto —</option>
              {contactosDeCuenta.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.cargo ? `(${p.cargo})` : ""}
                </option>
              ))}
            </select>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <div>
                <input
                  name="nuevoContactoNombre"
                  type="text"
                  placeholder="Nombre del contacto (opcional)"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  name="nuevoContactoCargo"
                  type="text"
                  placeholder="Cargo"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  name="nuevoContactoEmail"
                  type="email"
                  placeholder="Correo electrónico"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  name="nuevoContactoTelefono"
                  type="text"
                  placeholder="Teléfono / WhatsApp"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* C. Detalle de la Gestión */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tipo de Contacto
              </label>
              <select
                name="tipoActividad"
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

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                ¿Qué se conversó o coordinó? <span className="text-rose-400">*</span>
              </label>
              <input
                name="descripcionActividad"
                type="text"
                required
                placeholder="Ej: Llamado de presentación, interesado en informe comercial con clave..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* D. Compromiso / Tarea de Seguimiento */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <input
              id="crearTarea"
              name="crearTarea"
              type="checkbox"
              checked={crearTarea}
              onChange={(e) => setCrearTarea(e.target.checked)}
              className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="crearTarea" className="text-xs font-semibold text-slate-200">
              Crear compromiso o tarea de seguimiento
            </label>
          </div>

          {crearTarea && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Próxima acción</label>
                <input
                  name="tituloTarea"
                  type="text"
                  placeholder="Ej: Volver a llamar el jueves / Enviar catálogo"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Fecha de vencimiento</label>
                <input
                  name="fechaVencimientoTarea"
                  type="date"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
