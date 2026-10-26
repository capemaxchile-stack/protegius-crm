"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { eliminarCuentaAction } from "@/lib/actions-cuentas";
import { useRouter } from "next/navigation";

interface BotonEliminarCuentaProps {
  cuentaId: string;
  razonSocial: string;
}

export function BotonEliminarCuenta({
  cuentaId,
  razonSocial,
}: BotonEliminarCuentaProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleEliminar = () => {
    startTransition(async () => {
      setError(null);
      const res = await eliminarCuentaAction(cuentaId);
      if (res.success) {
        setOpen(false);
        router.push("/cuentas");
      } else {
        setError(res.error || "No se pudo eliminar la cuenta.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 font-semibold text-xs border border-rose-200 dark:border-rose-500/20 shadow-sm transition"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Eliminar Cuenta</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-5 h-5" />
            </div>

            <h3 className="font-bold text-slate-900 dark:text-white text-base text-center">
              ¿Eliminar {razonSocial}?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">
              Se eliminarán las actividades, tareas y oportunidades asociadas a esta empresa. Esta acción no se puede deshacer.
            </p>

            {error && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold text-center">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleEliminar}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                {isPending ? "Eliminando..." : "Sí, Eliminar Cuenta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
