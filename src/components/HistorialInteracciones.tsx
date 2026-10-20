"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  toggleEstadoInteraccionAction,
  editarInteraccionAction,
  eliminarInteraccionAction,
  InteraccionActionState,
} from "@/lib/actions-interacciones";
import { TIPOS_ACTIVIDAD, formatearFechaHora } from "@/lib/constants";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  RotateCcw,
} from "lucide-react";

export interface InteraccionTimelineItem {
  id: string;
  tipo: string;
  descripcion: string;
  fechaRealizada: Date | string;
  responsable: string | null;
  proximoPaso: string | null;
  fechaProximoPaso: Date | string | null;
  estadoPaso: string | null;
  persona?: {
    id: string;
    nombre: string;
  } | null;
  usuario?: {
    id: string;
    name: string;
  } | null;
}

interface HistorialInteraccionesProps {
  actividades: InteraccionTimelineItem[];
  isAdmin: boolean;
  usuarios?: { id: string; name: string }[];
}

function SaveEditButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
    >
      {pending ? "Guardando..." : "Guardar Cambios"}
    </button>
  );
}

export function HistorialInteracciones({
  actividades,
  isAdmin,
  usuarios = [],
}: HistorialInteraccionesProps) {
  const [editandoItem, setEditandoItem] = useState<InteraccionTimelineItem | null>(null);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const [editState, editFormAction] = useFormState<InteraccionActionState | null, FormData>(
    async (prev, formData) => {
      const res = await editarInteraccionAction(prev, formData);
      if (res.success) {
        setEditandoItem(null);
      }
      return res;
    },
    null
  );

  const handleToggleRealizada = async (id: string, marcarHecho: boolean) => {
    setProcesandoId(id);
    try {
      await toggleEstadoInteraccionAction(id, marcarHecho);
    } finally {
      setProcesandoId(null);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta interacción y su compromiso asociado?")) {
      return;
    }
    setProcesandoId(id);
    try {
      await eliminarInteraccionAction(id);
    } finally {
      setProcesandoId(null);
    }
  };

  if (actividades.length === 0) {
    return (
      <p className="text-slate-400 text-xs italic py-4 text-center">
        No hay interacciones registradas aún.
      </p>
    );
  }

  const ahora = new Date();

  return (
    <>
      <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {actividades.map((act) => {
          // Si estadoPaso es "hecho", o si no tenía próximo paso pendiente y estadoPaso !== "pendiente"
          const esPendiente = act.estadoPaso === "pendiente";
          const esRealizada = !esPendiente;

          const fechaPaso = act.fechaProximoPaso ? new Date(act.fechaProximoPaso) : null;
          const esVencida = esPendiente && fechaPaso && fechaPaso < ahora;
          const esPorVencer =
            esPendiente &&
            fechaPaso &&
            fechaPaso >= ahora &&
            fechaPaso.getTime() - ahora.getTime() <= 24 * 60 * 60 * 1000;

          // Regla: Usuario comercial puede editar mientras esté pendiente/activa; Admin puede editar siempre
          const puedeEditar = esPendiente || isAdmin;

          return (
            <div key={act.id} className="relative pl-9 text-xs space-y-1.5">
              {/* Indicador circular en la línea de tiempo (Verde con Tick si está realizada) */}
              <div
                className={`absolute left-1 top-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs ${
                  esRealizada
                    ? "bg-emerald-500 text-white"
                    : esVencida
                    ? "bg-rose-600 text-white animate-pulse"
                    : "bg-amber-500 text-white"
                }`}
                title={esRealizada ? "Interacción Realizada" : "Interacción Pendiente / En Curso"}
              >
                {esRealizada ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
              </div>

              {/* Tarjeta de la Interacción */}
              <div
                className={`p-3.5 rounded-2xl border transition ${
                  esRealizada
                    ? "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/80 dark:border-emerald-800/40"
                    : esVencida
                    ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50"
                    : "bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800"
                }`}
              >
                {/* Fila Superior: Tipo, Estado Visual y Botones de Acción */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/70">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-blue-600 dark:text-blue-400 uppercase text-[10px] tracking-wider">
                      {act.tipo}
                    </span>

                    {/* Badge de Estado Visual Claro */}
                    {esRealizada ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>✓ Realizada</span>
                      </span>
                    ) : esVencida ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 text-[10px] font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        <span>🚨 SLA Vencido / Pendiente</span>
                      </span>
                    ) : esPorVencer ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 text-[10px] font-bold">
                        <Clock className="w-3 h-3" />
                        <span>⚠️ Por vencer (&lt;24h)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 text-[10px] font-bold">
                        <Clock className="w-3 h-3" />
                        <span>⏳ Pendiente</span>
                      </span>
                    )}
                  </div>

                  {/* Controles: Marcar Realizada, Editar, Eliminar (Admin) */}
                  <div className="flex items-center gap-1">
                    {esPendiente ? (
                      <button
                        type="button"
                        disabled={procesandoId === act.id}
                        onClick={() => handleToggleRealizada(act.id, true)}
                        title="Marcar interacción como Realizada"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow-xs transition disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Marcar Realizada</span>
                      </button>
                    ) : isAdmin ? (
                      <button
                        type="button"
                        disabled={procesandoId === act.id}
                        onClick={() => handleToggleRealizada(act.id, false)}
                        title="Reabrir como Pendiente (Admin)"
                        className="p-1 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    ) : null}

                    {puedeEditar && (
                      <button
                        type="button"
                        onClick={() => setEditandoItem(act)}
                        title={
                          isAdmin
                            ? "Editar interacción (Modo Admin)"
                            : "Editar interacción pendiente"
                        }
                        className="p-1 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        type="button"
                        disabled={procesandoId === act.id}
                        onClick={() => handleEliminar(act.id)}
                        title="Eliminar interacción (Solo Administrador)"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Descripción principal */}
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed pt-1 whitespace-pre-wrap">
                  {act.descripcion}
                </p>

                {/* Metadatos de autor y contacto */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                  <span>
                    Registrado por:{" "}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {act.usuario?.name || act.responsable || "Ejecutivo"}
                    </strong>
                    {act.persona && (
                      <>
                        {" "}
                        · Con: <strong className="text-slate-700 dark:text-slate-300">{act.persona.nombre}</strong>
                      </>
                    )}
                  </span>
                  <span>{formatearFechaHora(act.fechaRealizada)}</span>
                </div>

                {/* Próximo paso / SLA */}
                {act.proximoPaso && (
                  <div
                    className={`mt-2 p-2.5 rounded-xl border text-[11px] flex items-center justify-between gap-2 ${
                      esRealizada
                        ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300"
                        : esVencida
                        ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300"
                        : "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-300"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold block">
                        {esRealizada ? "✓ Compromiso cumplido:" : "🎯 Compromiso / Próximo paso:"}{" "}
                        <span className={esRealizada ? "line-through opacity-85" : ""}>
                          {act.proximoPaso}
                        </span>
                      </span>
                      {act.fechaProximoPaso && (
                        <span className="text-[10px] opacity-90 block">
                          Fecha límite SLA: <strong>{formatearFechaHora(act.fechaProximoPaso)}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Edición de Interacción */}
      {editandoItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Editar Interacción Comercial
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Corrige detalles, fecha SLA o encargado responsable
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditandoItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editState?.error && (
              <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-bold">
                {editState.error}
              </div>
            )}

            <form action={editFormAction} className="space-y-3.5 mt-4">
              <input type="hidden" name="actividadId" value={editandoItem.id} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Canal / Tipo
                  </label>
                  <select
                    name="tipo"
                    defaultValue={editandoItem.tipo}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    {TIPOS_ACTIVIDAD.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Estado de la Interacción
                  </label>
                  <select
                    name="estadoPaso"
                    defaultValue={editandoItem.estadoPaso === "pendiente" ? "pendiente" : "hecho"}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="pendiente">⏳ Pendiente / Activa</option>
                    <option value="hecho">✓ Realizada (Verde)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Detalle de la Interacción <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="descripcion"
                  required
                  rows={3}
                  defaultValue={editandoItem.descripcion}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                  Compromiso / Próximo Paso (SLA)
                </p>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Acción comprometida
                  </label>
                  <input
                    type="text"
                    name="proximoPaso"
                    defaultValue={
                      editandoItem.proximoPaso
                        ? editandoItem.proximoPaso.replace(/\s*\[Resp:.*\]$/, "")
                        : ""
                    }
                    placeholder="Dejar vacío si no hay compromiso pendiente"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {usuarios.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Reasignar Encargado Responsable
                    </label>
                    <select
                      name="encargadoId"
                      defaultValue=""
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                    >
                      <option value="">— Mantener encargado actual —</option>
                      {usuarios.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha Límite SLA
                  </label>
                  <input
                    type="date"
                    name="fechaProximoPaso"
                    defaultValue={
                      editandoItem.fechaProximoPaso
                        ? new Date(editandoItem.fechaProximoPaso).toISOString().split("T")[0]
                        : ""
                    }
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditandoItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <SaveEditButton />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
