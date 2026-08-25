"use client";

import { useFormState, useFormStatus } from "react-dom";
import { crearAltaRapidaAction, OportunidadActionState } from "@/lib/actions-oportunidades";
import { NavegacionOportunidades } from "@/components/NavegacionOportunidades";
import {
  Zap,
  Building2,
  UserPlus,
  TrendingUp,
  PhoneCall,
} from "lucide-react";
import Link from "next/link";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition disabled:opacity-50 flex items-center gap-2"
    >
      <Zap className="w-4 h-4 text-amber-300" />
      <span>{pending ? "Guardando todo en el sistema..." : "Crear Alta Rápida Completa"}</span>
    </button>
  );
}

export default function AltaRapidaPage() {
  const [state, formAction] = useFormState<OportunidadActionState | null, FormData>(
    crearAltaRapidaAction,
    null
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <NavegacionOportunidades />

      <div>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h1 className="text-xl font-bold text-white tracking-tight">Alta Rápida Comercial</h1>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Formulario único para cargar Empresa + Contacto + Oportunidad en UF + Actividad + Próximo Compromiso.
        </p>
      </div>

      {state?.error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-medium">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        {/* 1. Empresa */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Building2 className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">1. Empresa / Prospecto</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Razón Social <span className="text-rose-400">*</span>
              </label>
              <input
                name="razonSocial"
                type="text"
                required
                placeholder="Ej: Inversiones Los Alerces SpA"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                RUT (validado Módulo 11)
              </label>
              <input
                name="rut"
                type="text"
                placeholder="Ej: 76.543.210-K"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 2. Contacto */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">2. Contacto Principal (Opcional)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nombre</label>
              <input
                name="contactoNombre"
                type="text"
                placeholder="Ej: Rodrigo Bucarey"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Cargo</label>
              <input
                name="contactoCargo"
                type="text"
                placeholder="Ej: Gerente General"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
              <input
                name="contactoEmail"
                type="email"
                placeholder="rodrigo@empresa.cl"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Teléfono / WhatsApp</label>
              <input
                name="contactoTelefono"
                type="text"
                placeholder="+56 9 1234 5678"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 3. Oportunidad en UF */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">3. Oportunidad Comercial</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nombre del Negocio <span className="text-rose-400">*</span>
              </label>
              <input
                name="opNombre"
                type="text"
                required
                placeholder="Ej: Contratación Plan Corporativo 2026"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Valor Estimado (UF)</label>
              <input
                name="opValorEstimado"
                type="number"
                step="0.1"
                placeholder="Ej: 18.5"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 4. Actividad Inicial y Tarea */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <PhoneCall className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">4. Gestión Inicial y Compromiso</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                ¿Qué se conversó en el primer contacto?
              </label>
              <input
                name="actDescripcion"
                type="text"
                placeholder="Ej: Reunión inicial, interesado en due diligence y validación tributaria..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Próximo Compromiso / Tarea</label>
                <input
                  name="tareaTitulo"
                  type="text"
                  placeholder="Ej: Enviar propuesta formal"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Fecha de Compromiso</label>
                <input
                  name="tareaFechaVencimiento"
                  type="date"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/oportunidades"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            Cancelar
          </Link>
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
