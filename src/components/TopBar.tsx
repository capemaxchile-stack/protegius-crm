"use client";

import Link from "next/link";
import { UserRole } from "@/lib/constants";
import { HeaderNotificaciones } from "./HeaderNotificaciones";
import { ModalRecordatorioAlertas } from "./ModalRecordatorioAlertas";
import { HeaderMenuUsuario } from "./HeaderMenuUsuario";
import { PhoneCall, Plus } from "lucide-react";

interface TopBarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

export function TopBar({ user }: TopBarProps) {
  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-8 flex items-center justify-between shrink-0 sticky top-0 z-40 print:hidden transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Hola, <strong className="text-slate-900 dark:text-white font-bold">{user.name.split(" ")[0]}</strong> 👋
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Acceso rápido a prospección */}
        <Link
          href="/prospeccion"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 transition shadow-xs"
        >
          <PhoneCall className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Cola de Llamados</span>
        </Link>

        {/* Acceso rápido a importar */}
        <Link
          href="/cuentas/importar"
          className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Importar Excel</span>
        </Link>

        {/* Campana de Notificaciones */}
        <HeaderNotificaciones />

        {/* Modal de Recordatorio Automático al Ingresar */}
        <ModalRecordatorioAlertas />

        {/* Menú de Usuario: Perfil, Cambiar Clave, Visualización y Salir */}
        <HeaderMenuUsuario user={user} />
      </div>
    </header>
  );
}
