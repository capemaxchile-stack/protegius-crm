"use client";

import { useState, useTransition } from "react";
import { UserRole, USER_ROLE_LABELS, MENUS_SISTEMA, PERMISOS_DEFAULT_POR_ROL } from "@/lib/constants";
import { MatrizPermisos, guardarMatrizPermisosAction } from "@/lib/permisos-roles";
import { Shield, Check, Save, RotateCcw, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

interface MatrizPermisosRolesProps {
  matrizInicial: MatrizPermisos;
}

const ROLES_ORDER: UserRole[] = [
  "ADMIN",
  "GERENTE_GENERAL",
  "GERENTE_COMERCIAL",
  "COMERCIAL",
  "CONSULTA",
];

export function MatrizPermisosRoles({ matrizInicial }: MatrizPermisosRolesProps) {
  const [matriz, setMatriz] = useState<MatrizPermisos>(matrizInicial);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const togglePermiso = (rol: UserRole, menuId: string) => {
    // ADMIN siempre debe tener acceso a usuarios
    if (rol === "ADMIN" && menuId === "usuarios") return;

    setMatriz((prev) => {
      const actuales = prev[rol] || [];
      const existe = actuales.includes(menuId);
      const nuevos = existe
        ? actuales.filter((id) => id !== menuId)
        : [...actuales, menuId];

      return {
        ...prev,
        [rol]: nuevos,
      };
    });
  };

  const handleRestablecer = () => {
    if (confirm("¿Estás seguro de restablecer todos los permisos a la configuración recomendada por defecto?")) {
      setMatriz(PERMISOS_DEFAULT_POR_ROL);
      setMensaje({ tipo: "ok", texto: "Permisos restablecidos a los valores por defecto (recuerda hacer clic en 'Guardar Cambios')." });
    }
  };

  const handleGuardar = () => {
    startTransition(async () => {
      setMensaje(null);
      const res = await guardarMatrizPermisosAction(matriz);
      if (res.success) {
        setMensaje({ tipo: "ok", texto: "¡Matriz de permisos actualizada correctamente! Los cambios ya aplican al menú lateral." });
        router.refresh();
      } else {
        setMensaje({ tipo: "error", texto: res.error || "Error al guardar la matriz de permisos." });
      }
    });
  };

  return (
    <div className="space-y-4">
      {mensaje && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            mensaje.tipo === "ok"
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
              : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
          }`}
        >
          <span>{mensaje.texto}</span>
          <button
            onClick={() => setMensaje(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Control de Acceso a Menús por Perfil
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Marca qué secciones del sistema estarán visibles y operativas para cada rol.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRestablecer}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 shadow-sm transition disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Valores Recomendados</span>
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isPending ? "Guardando..." : "Guardar Cambios"}</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-3.5 px-4 min-w-[220px]">Sección / Módulo del Sistema</th>
                {ROLES_ORDER.map((rol) => (
                  <th key={rol} className="py-3.5 px-3 text-center min-w-[130px]">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {USER_ROLE_LABELS[rol]}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {rol}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {MENUS_SISTEMA.map((menu) => (
                <tr
                  key={menu.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition"
                >
                  <td className="py-3.5 px-4">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{menu.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {menu.descripcion}
                      </p>
                    </div>
                  </td>
                  {ROLES_ORDER.map((rol) => {
                    const checked = (matriz[rol] || []).includes(menu.id);
                    const isLocked = rol === "ADMIN" && menu.id === "usuarios";

                    return (
                      <td key={`${rol}-${menu.id}`} className="py-3.5 px-3 text-center">
                        <label
                          className={`inline-flex items-center justify-center p-2 rounded-xl transition ${
                            isLocked
                              ? "cursor-not-allowed opacity-70"
                              : "cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={isLocked || isPending}
                            onChange={() => togglePermiso(rol, menu.id)}
                            className="sr-only"
                          />
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition ${
                              checked
                                ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                                : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-transparent"
                            }`}
                          >
                            {isLocked ? (
                              <Lock className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </div>
                        </label>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
