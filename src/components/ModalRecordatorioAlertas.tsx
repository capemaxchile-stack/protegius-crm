"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  X,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import {
  NotificacionesResumen,
  obtenerNotificacionesUsuarioAction,
  completarTareaNotificacionAction,
} from "@/lib/actions-notificaciones";
import { formatearFechaHora } from "@/lib/constants";

export function ModalRecordatorioAlertas() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [resumen, setResumen] = useState<NotificacionesResumen | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);

    // Verificar si ya se mostró en esta sesión de navegación
    const yaMostrado = sessionStorage.getItem("protegius_alerta_ingreso_vista");

    obtenerNotificacionesUsuarioAction().then((data) => {
      setResumen(data);

      // Abrir automáticamente si hay tareas vencidas o reuniones hoy y aún no se mostró
      if (!yaMostrado && (data.totalVencidas > 0 || data.reunionesHoy > 0)) {
        setOpen(true);
        sessionStorage.setItem("protegius_alerta_ingreso_vista", "true");
      }
    });
  }, []);

  const handleCerrar = () => {
    setOpen(false);
    sessionStorage.setItem("protegius_alerta_ingreso_vista", "true");
  };

  const handleCompletar = (tareaId: string) => {
    startTransition(async () => {
      const res = await completarTareaNotificacionAction(tareaId);
      if (res.success && resumen) {
        setResumen({
          ...resumen,
          totalPendientes: Math.max(0, resumen.totalPendientes - 1),
          items: resumen.items.filter((item) => item.id !== tareaId),
        });
      }
    });
  };

  if (!mounted || !open || !resumen) return null;

  const itemsUrgentes = resumen.items.filter(
    (item) => item.esVencida || item.esHoy
  );

  if (itemsUrgentes.length === 0) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-500/20 shadow-xs">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Recordatorio de Compromisos SLA
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tienes tareas comerciales vencidas o programadas para hoy que requieren atención.
              </p>
            </div>
          </div>
          <button
            onClick={handleCerrar}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Cerrar recordatorio"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resumen numérico */}
        <div className="grid grid-cols-2 gap-3 my-4 shrink-0">
          <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
              🚨 SLA Vencido (Atrasadas)
            </span>
            <span className="text-2xl font-black text-rose-700 dark:text-rose-300">
              {resumen.totalVencidas}
            </span>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
              📅 Compromisos Para Hoy
            </span>
            <span className="text-2xl font-black text-blue-700 dark:text-blue-300">
              {resumen.totalHoy}
            </span>
          </div>
        </div>

        {/* Listado de items urgentes */}
        <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 my-1">
          {itemsUrgentes.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border text-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                item.esVencida
                  ? "bg-rose-50/60 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="space-y-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      item.esVencida
                        ? "bg-rose-600 text-white"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {item.esVencida ? "VENCIDO" : "HOY"}
                  </span>

                  {item.cuenta && (
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {item.cuenta.razonSocial}
                    </span>
                  )}
                </div>

                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {item.titulo}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                  {item.fechaVencimiento && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatearFechaHora(item.fechaVencimiento)}</span>
                    </span>
                  )}
                  {item.responsableName && (
                    <span>
                      Resp: <strong>{item.responsableName}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.cuenta?.id && (
                  <Link
                    href={`/cuentas/${item.cuenta.id}`}
                    onClick={handleCerrar}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition"
                    title="Ver ficha del cliente"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleCompletar(item.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
                  title="Marcar compromiso como realizado"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Listo</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0 mt-3">
          <Link
            href="/auditoria"
            onClick={handleCerrar}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Ir al panel de Auditoría SLA</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={handleCerrar}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
          >
            Entendido, ir al CRM
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
