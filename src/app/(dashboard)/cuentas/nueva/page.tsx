"use client";

import { useFormState, useFormStatus } from "react-dom";
import { crearCuentaAction, ActionState } from "@/lib/actions-cuentas";
import Link from "next/link";
import {
  Building2,
  ArrowLeft,
  UserPlus,
} from "lucide-react";
import { ETAPAS_CUENTA } from "@/lib/constants";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
    >
      {pending ? "Guardando cuenta..." : "Crear Cuenta"}
    </button>
  );
}

export default function NuevaCuentaPage() {
  const [state, formAction] = useFormState<ActionState | null, FormData>(
    crearCuentaAction,
    null
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top navigation */}
      <div className="flex items-center gap-3">
        <Link
          href="/cuentas"
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Nueva Cuenta / Empresa</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Registra una nueva empresa o prospecto en el sistema.
          </p>
        </div>
      </div>

      {state?.error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl text-rose-700 dark:text-rose-400 text-xs font-bold">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        {/* Section 1: Datos de la Empresa */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">1. Identificación de la Empresa</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="razonSocial">
                Razón Social / Nombre de Fantasía <span className="text-rose-500">*</span>
              </label>
              <input
                id="razonSocial"
                name="razonSocial"
                type="text"
                required
                placeholder="Ej: Constructora Andes SpA"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="rut">
                RUT (validación Módulo 11)
              </label>
              <input
                id="rut"
                name="rut"
                type="text"
                placeholder="Ej: 76.543.210-K o 76543210K"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="rubro">
                Giro / Rubro
              </label>
              <input
                id="rubro"
                name="rubro"
                type="text"
                placeholder="Ej: Minería, Servicios, Construcción"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="sitioWeb">
                Sitio Web
              </label>
              <input
                id="sitioWeb"
                name="sitioWeb"
                type="text"
                placeholder="Ej: www.empresa.cl"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="etapa">
                Etapa Comercial Inicial
              </label>
              <select
                id="etapa"
                name="etapa"
                defaultValue="nuevo"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {ETAPAS_CUENTA.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="notas">
                Notas y Antecedentes
              </label>
              <textarea
                id="notas"
                name="notas"
                rows={3}
                placeholder="Contexto comercial, necesidad detectada o comentarios internos..."
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contacto Rápido Opcional */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">2. Contacto Principal (Opcional)</h2>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Puedes agregarlo ahora o después</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="contactoNombre">
                Nombre del Contacto
              </label>
              <input
                id="contactoNombre"
                name="contactoNombre"
                type="text"
                placeholder="Ej: Marcela Peña"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="contactoCargo">
                Cargo
              </label>
              <input
                id="contactoCargo"
                name="contactoCargo"
                type="text"
                placeholder="Ej: Jefa de Compras / Finanzas"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="contactoEmail">
                Correo Electrónico
              </label>
              <input
                id="contactoEmail"
                name="contactoEmail"
                type="email"
                placeholder="mpena@empresa.cl"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="contactoTelefono">
                Teléfono / WhatsApp
              </label>
              <input
                id="contactoTelefono"
                name="contactoTelefono"
                type="text"
                placeholder="+56 9 8765 4321"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/cuentas"
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
          >
            Cancelar
          </Link>
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
