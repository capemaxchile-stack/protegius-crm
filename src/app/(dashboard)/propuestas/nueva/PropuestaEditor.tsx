"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { crearPropuestaAction, PropuestaActionState } from "@/lib/actions-propuestas";
import {
  FileSpreadsheet,
  Building2,
  CheckSquare,
  Square,
  Calculator,
  Layers,
  Sparkles,
} from "lucide-react";
import { formatearUF } from "@/lib/constants";
import Link from "next/link";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition disabled:opacity-50 flex items-center gap-2"
    >
      <FileSpreadsheet className="w-4 h-4" />
      <span>{pending ? "Generando y congelando precios..." : "Emitir Propuesta Formal"}</span>
    </button>
  );
}

interface PropuestaEditorProps {
  cuentas: {
    id: string;
    razonSocial: string;
    rut: string | null;
    rubro: string | null;
    afiliaciones: {
      esPrincipal: boolean;
      persona: {
        nombre: string;
        email: string | null;
        telefono: string | null;
        cargo: string | null;
      };
    }[];
    oportunidades: {
      id: string;
      nombre: string;
      etapa: string;
      valorEstimado: number | null;
    }[];
  }[];
  gruposPlan: {
    id: string;
    nombre: string;
    planes: {
      id: string;
      nombre: string;
      detalle: string | null;
      valorEmpresaUF: number;
      valorNaturalUF: number | null;
    }[];
  }[];
  servicios: {
    id: string;
    nombre: string;
    descripcion: string | null;
    tipo: string;
  }[];
  cuentaIdInicial?: string;
  oportunidadIdInicial?: string;
}

export function PropuestaEditor({
  cuentas,
  gruposPlan,
  servicios,
  cuentaIdInicial = "",
  oportunidadIdInicial = "",
}: PropuestaEditorProps) {
  const [cuentaId, setCuentaId] = useState(cuentaIdInicial);
  const [oportunidadId, setOportunidadId] = useState(oportunidadIdInicial);

  // Snapshot de datos cliente
  const [razonSocial, setRazonSocial] = useState("");
  const [rut, setRut] = useState("");
  const [giro, setGiro] = useState("");
  const [contacto, setContacto] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  const [vigenciaDias, setVigenciaDias] = useState(15);
  const [setupValorUF, setSetupValorUF] = useState(0);
  const [setupDescuentoPct, setSetupDescuentoPct] = useState(0);

  // Planes seleccionados con sus descuentos individuales
  const [planesSeleccionados, setPlanesSeleccionados] = useState<
    {
      planId: string;
      grupoNombre: string;
      planNombre: string;
      detalle: string | null;
      valorOriginal: number;
      descuentoPct: number;
      valorFinal: number;
    }[]
  >([]);

  // Servicios seleccionados
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<
    {
      servicioId: string;
      nombre: string;
      descripcion: string | null;
      tipo: string;
    }[]
  >([]);

  const [state, formAction] = useFormState<PropuestaActionState | null, FormData>(
    crearPropuestaAction,
    null
  );

  // Manejar cambio de cuenta y prellenar datos
  function handleSelectCuenta(id: string) {
    setCuentaId(id);
    const cuenta = cuentas.find((c) => c.id === id);
    if (cuenta) {
      setRazonSocial(cuenta.razonSocial);
      setRut(cuenta.rut || "");
      setGiro(cuenta.rubro || "");

      const contactoPrincipal =
        cuenta.afiliaciones.find((a) => a.esPrincipal)?.persona ||
        cuenta.afiliaciones[0]?.persona;

      if (contactoPrincipal) {
        setContacto(contactoPrincipal.nombre);
        setEmail(contactoPrincipal.email || "");
        setTelefono(contactoPrincipal.telefono || "");
      } else {
        setContacto("");
        setEmail("");
        setTelefono("");
      }

      // Preseleccionar oportunidad si existe
      if (cuenta.oportunidades.length > 0) {
        setOportunidadId(cuenta.oportunidades[0].id);
      } else {
        setOportunidadId("");
      }
    }
  }

  // Toggle plan
  function handleTogglePlan(grupoNombre: string, plan: { id: string; nombre: string; detalle: string | null; valorEmpresaUF: number }) {
    const exists = planesSeleccionados.find((p) => p.planId === plan.id);
    if (exists) {
      setPlanesSeleccionados(planesSeleccionados.filter((p) => p.planId !== plan.id));
    } else {
      setPlanesSeleccionados([
        ...planesSeleccionados,
        {
          planId: plan.id,
          grupoNombre,
          planNombre: plan.nombre,
          detalle: plan.detalle,
          valorOriginal: plan.valorEmpresaUF,
          descuentoPct: 0,
          valorFinal: plan.valorEmpresaUF,
        },
      ]);
    }
  }

  // Actualizar descuento de plan
  function handleDescuentoPlan(planId: string, pct: number) {
    setPlanesSeleccionados(
      planesSeleccionados.map((p) => {
        if (p.planId === planId) {
          const discount = Math.min(Math.max(pct, 0), 100);
          const finalVal = Math.round(p.valorOriginal * (1 - discount / 100) * 100) / 100;
          return {
            ...p,
            descuentoPct: discount,
            valorFinal: finalVal,
          };
        }
        return p;
      })
    );
  }

  // Toggle servicio
  function handleToggleServicio(s: { id: string; nombre: string; descripcion: string | null; tipo: string }) {
    const exists = serviciosSeleccionados.find((serv) => serv.servicioId === s.id);
    if (exists) {
      setServiciosSeleccionados(serviciosSeleccionados.filter((serv) => serv.servicioId !== s.id));
    } else {
      setServiciosSeleccionados([
        ...serviciosSeleccionados,
        {
          servicioId: s.id,
          nombre: s.nombre,
          descripcion: s.descripcion,
          tipo: s.tipo,
        },
      ]);
    }
  }

  // Cálculos reactivos en UF
  const totalPlanesOriginalUF = planesSeleccionados.reduce((acc, p) => acc + p.valorOriginal, 0);
  const totalPlanesFinalUF = planesSeleccionados.reduce((acc, p) => acc + p.valorFinal, 0);
  const ahorroPlanesUF = totalPlanesOriginalUF - totalPlanesFinalUF;

  const setupFinalUF = setupValorUF * (1 - setupDescuentoPct / 100);
  const granTotalUF = totalPlanesFinalUF + setupFinalUF;

  const cuentaSeleccionada = cuentas.find((c) => c.id === cuentaId);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-medium">
          {state.error}
        </div>
      )}

      {/* Hidden inputs con snapshots serializados */}
      <input type="hidden" name="cuentaId" value={cuentaId} />
      <input type="hidden" name="oportunidadId" value={oportunidadId} />
      <input type="hidden" name="clienteRazonSocial" value={razonSocial} />
      <input type="hidden" name="clienteRut" value={rut} />
      <input type="hidden" name="clienteGiro" value={giro} />
      <input type="hidden" name="clienteContacto" value={contacto} />
      <input type="hidden" name="clienteEmail" value={email} />
      <input type="hidden" name="clienteTelefono" value={telefono} />
      <input type="hidden" name="vigenciaDias" value={vigenciaDias} />
      <input type="hidden" name="setupValorUF" value={setupValorUF} />
      <input type="hidden" name="setupDescuentoPct" value={setupDescuentoPct} />
      <input
        type="hidden"
        name="planesSeleccionados"
        value={JSON.stringify(planesSeleccionados)}
      />
      <input
        type="hidden"
        name="serviciosSeleccionados"
        value={JSON.stringify(serviciosSeleccionados)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Client & Items Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Selección de Cuenta y Oportunidad */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Building2 className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">1. Empresa & Negocio Destinatario</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Empresa / Cliente <span className="text-rose-400">*</span>
                </label>
                <select
                  value={cuentaId}
                  onChange={(e) => handleSelectCuenta(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Oportunidad Comercial Asociada
                </label>
                <select
                  value={oportunidadId}
                  onChange={(e) => setOportunidadId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">— Ninguna / Cotización General —</option>
                  {cuentaSeleccionada?.oportunidades.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Datos de contacto que aparecerán en la propuesta */}
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Datos de Membrete en la Cotización
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Razón Social</label>
                  <input
                    type="text"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">RUT</label>
                  <input
                    type="text"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Giro / Rubro</label>
                  <input
                    type="text"
                    value={giro}
                    onChange={(e) => setGiro(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Atención a (Contacto)</label>
                  <input
                    type="text"
                    value={contacto}
                    onChange={(e) => setContacto(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Selección de Planes del Catálogo */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">2. Planes y Suscripciones (en UF)</h2>
              </div>
              <span className="text-[11px] text-slate-400">Selecciona los planes a cotizar</span>
            </div>

            <div className="space-y-4">
              {gruposPlan.map((grupo) => (
                <div key={grupo.id} className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    {grupo.nombre}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {grupo.planes.map((plan) => {
                      const selected = planesSeleccionados.find((p) => p.planId === plan.id);

                      return (
                        <div
                          key={plan.id}
                          className={`p-3 rounded-xl border text-xs transition duration-150 ${
                            selected
                              ? "bg-slate-950 border-emerald-500/50 shadow-md"
                              : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <div
                            className="flex items-start gap-2.5 cursor-pointer"
                            onClick={() => handleTogglePlan(grupo.nombre, plan)}
                          >
                            {selected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="font-semibold text-white">{plan.nombre}</p>
                              {plan.detalle && (
                                <p className="text-[11px] text-slate-400 mt-0.5">{plan.detalle}</p>
                              )}
                              <p className="font-bold text-emerald-400 text-xs mt-1">
                                {formatearUF(plan.valorEmpresaUF)} / mes
                              </p>
                            </div>
                          </div>

                          {/* Controls when selected: custom discount */}
                          {selected && (
                            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                              <span className="text-[10px] text-slate-400">Descuento aplicado:</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={selected.descuentoPct}
                                  onChange={(e) =>
                                    handleDescuentoPlan(plan.id, parseFloat(e.target.value) || 0)
                                  }
                                  className="w-14 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-right text-xs text-white"
                                />
                                <span className="text-slate-400 text-xs">%</span>
                              </div>
                              <span className="font-bold text-white text-xs">
                                = {formatearUF(selected.valorFinal)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Servicios Incluidos en el Alcance */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-white">3. Alcance de Servicios Incluidos</h2>
              </div>
              <span className="text-[11px] text-slate-400">Funcionalidades descritas en la propuesta</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {servicios.map((serv) => {
                const isSelected = serviciosSeleccionados.some((s) => s.servicioId === serv.id);

                return (
                  <div
                    key={serv.id}
                    onClick={() => handleToggleServicio(serv)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                      isSelected
                        ? "bg-slate-950 border-indigo-500/50 shadow-sm"
                        : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-semibold text-white">{serv.nombre}</p>
                        {serv.descripcion && (
                          <p className="text-[11px] text-slate-400 mt-1">{serv.descripcion}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Summary & Calculations */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 sticky top-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Calculator className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Resumen Económico (en UF)</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Vigencia de la oferta</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={vigenciaDias}
                    onChange={(e) => setVigenciaDias(parseInt(e.target.value, 10) || 15)}
                    className="w-20 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold text-xs"
                  />
                  <span className="text-slate-400">días corridos</span>
                </div>
              </div>

              {/* Setup fee */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Costo de Habilitación / Setup (Único)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Valor Setup (UF)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={setupValorUF}
                      onChange={(e) => setSetupValorUF(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Descuento (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={setupDescuentoPct}
                      onChange={(e) => setSetupDescuentoPct(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Itemized summary */}
              <div className="pt-2 border-t border-slate-800 space-y-2 text-slate-300">
                <div className="flex justify-between">
                  <span>Planes ({planesSeleccionados.length} seleccionados):</span>
                  <span>{formatearUF(totalPlanesOriginalUF)}</span>
                </div>

                {ahorroPlanesUF > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Descuento en planes:</span>
                    <span>- {formatearUF(ahorroPlanesUF)}</span>
                  </div>
                )}

                <div className="flex justify-between font-semibold text-white">
                  <span>Subtotal Mensual:</span>
                  <span>{formatearUF(totalPlanesFinalUF)}</span>
                </div>

                {setupFinalUF > 0 && (
                  <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800/80">
                    <span>Habilitación / Setup:</span>
                    <span>{formatearUF(setupFinalUF)}</span>
                  </div>
                )}
              </div>

              {/* Total Final */}
              <div className="mt-4 p-4 bg-blue-600/10 border border-blue-500/30 rounded-xl">
                <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block">
                  Total Primer Mes + Setup
                </span>
                <p className="text-2xl font-black text-white tracking-tight mt-1">
                  {formatearUF(granTotalUF)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Recurrente mensual posterior: {formatearUF(totalPlanesFinalUF)}
                </p>
              </div>

              <div className="pt-4 flex flex-col gap-2">
                <SubmitButton />
                <Link
                  href="/propuestas"
                  className="w-full py-2.5 text-center text-xs text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition"
                >
                  Cancelar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
