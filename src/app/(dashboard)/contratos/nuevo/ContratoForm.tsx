"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { crearContratoAction, ContratoActionState } from "@/lib/actions-contratos";
import { FileText, UserPlus, X, Save } from "lucide-react";
import Link from "next/link";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2"
    >
      <Save className="w-4 h-4" />
      <span>{pending ? "Guardando contrato..." : "Crear Contrato"}</span>
    </button>
  );
}

interface ContratoFormProps {
  cuentas: {
    id: string;
    razonSocial: string;
    rut: string | null;
    afiliaciones: {
      persona: {
        nombre: string;
        email: string | null;
        cargo: string | null;
      };
    }[];
  }[];
  propuestas: {
    id: string;
    numero: string;
    cuentaId: string;
    clienteRazonSocial: string;
    planes: {
      valorFinal: number;
    }[];
    setupValorUF: number;
    setupDescuentoPct: number;
  }[];
  propuestaIdInicial?: string;
  cuentaIdInicial?: string;
}

export function ContratoForm({
  cuentas,
  propuestas,
  propuestaIdInicial = "",
  cuentaIdInicial = "",
}: ContratoFormProps) {
  const [cuentaId, setCuentaId] = useState(cuentaIdInicial);
  const [propuestaId, setPropuestaId] = useState(propuestaIdInicial);
  const [nombre, setNombre] = useState("");
  const [valorUF, setValorUF] = useState<number>(0);
  const [tipo, setTipo] = useState("prestacion_servicios");
  const [observaciones, setObservaciones] = useState("");

  const [firmantes, setFirmantes] = useState<
    { nombre: string; email: string; cargo: string; rol: string }[]
  >([]);

  const [nombreFirmante, setNombreFirmante] = useState("");
  const [emailFirmante, setEmailFirmante] = useState("");
  const [cargoFirmante, setCargoFirmante] = useState("");
  const [rolFirmante, setRolFirmante] = useState("Representante Legal");

  const [state, formAction] = useFormState<ContratoActionState | null, FormData>(
    crearContratoAction,
    null
  );

  // Al seleccionar propuesta, prellenar datos
  function handleSelectPropuesta(id: string) {
    setPropuestaId(id);
    const prop = propuestas.find((p) => p.id === id);
    if (prop) {
      setCuentaId(prop.cuentaId);
      setNombre(`Contrato de Prestación de Servicios · ${prop.clienteRazonSocial}`);
      const planesTotal = prop.planes.reduce((acc, pl) => acc + pl.valorFinal, 0);
      const setupTotal = prop.setupValorUF * (1 - prop.setupDescuentoPct / 100);
      setValorUF(Math.round((planesTotal + setupTotal) * 100) / 100);
    }
  }

  function handleAgregarFirmante() {
    if (!nombreFirmante.trim()) return;
    setFirmantes([
      ...firmantes,
      {
        nombre: nombreFirmante,
        email: emailFirmante,
        cargo: cargoFirmante,
        rol: rolFirmante,
      },
    ]);
    setNombreFirmante("");
    setEmailFirmante("");
    setCargoFirmante("");
  }

  function handleEliminarFirmante(idx: number) {
    setFirmantes(firmantes.filter((_, i) => i !== idx));
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl text-rose-700 dark:text-rose-400 text-xs font-bold">
          {state.error}
        </div>
      )}

      <input type="hidden" name="cuentaId" value={cuentaId} />
      <input type="hidden" name="propuestaId" value={propuestaId} />
      <input type="hidden" name="nombre" value={nombre} />
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="valor" value={valorUF} />
      <input type="hidden" name="observaciones" value={observaciones} />
      <input type="hidden" name="firmantes" value={JSON.stringify(firmantes)} />

      {/* Section 1: Datos Principales */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">1. Identificación del Contrato</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Propuesta opcional */}
          <div className="sm:col-span-2">
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              ¿Generar desde una Propuesta Aceptada? (Opcional)
            </label>
            <select
              value={propuestaId}
              onChange={(e) => handleSelectPropuesta(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">— Seleccionar propuesta si aplica —</option>
              {propuestas.map((p) => (
                <option key={p.id} value={p.id}>
                  PROP-{p.numero} · {p.clienteRazonSocial}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              Empresa / Cliente <span className="text-rose-500">*</span>
            </label>
            <select
              value={cuentaId}
              onChange={(e) => setCuentaId(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">— Seleccionar cliente —</option>
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.razonSocial} {c.rut ? `(${c.rut})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Tipo de Contrato</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="prestacion_servicios">Prestación de Servicios Recurrentes</option>
              <option value="anexo">Anexo Modificatorio</option>
              <option value="confidencialidad_nda">Acuerdo de Confidencialidad (NDA)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              Nombre / Objeto del Contrato <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Contrato de Prestación de Servicios de Inteligencia Comercial"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Valor Total / Mensual (UF)</label>
            <input
              type="number"
              step="0.1"
              value={valorUF}
              onChange={(e) => setValorUF(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Observaciones o Cláusulas Especiales</label>
            <textarea
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Comentarios adicionales..."
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Firmantes */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">2. Firmantes y Contrapartes ({firmantes.length})</h2>
          </div>
        </div>

        {/* Lista de firmantes agregados */}
        {firmantes.length > 0 && (
          <div className="space-y-2">
            {firmantes.map((f, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{f.nombre}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {f.cargo || "Sin cargo"} · {f.email || "Sin email"} · <span className="text-blue-600 dark:text-blue-400 font-semibold">{f.rol}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleEliminarFirmante(i)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Agregar firmante */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 text-xs">
          <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">+ Agregar Representante o Firmante</p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <input
                type="text"
                placeholder="Nombre completo"
                value={nombreFirmante}
                onChange={(e) => setNombreFirmante(e.target.value)}
                className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Correo electrónico"
                value={emailFirmante}
                onChange={(e) => setEmailFirmante(e.target.value)}
                className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Cargo (Ej: Gerente)"
                value={cargoFirmante}
                onChange={(e) => setCargoFirmante(e.target.value)}
                className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>
            <div>
              <select
                value={rolFirmante}
                onChange={(e) => setRolFirmante(e.target.value)}
                className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Representante Legal">Representante Legal</option>
                <option value="Contraparte Técnica">Contraparte Técnica</option>
                <option value="Contacto de Facturación">Contacto de Facturación</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAgregarFirmante}
              className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm transition"
            >
              Agregar a la lista
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/contratos"
          className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
        >
          Cancelar
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}
