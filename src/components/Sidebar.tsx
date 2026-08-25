"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Building2,
  Users2,
  PhoneCall,
  FileSpreadsheet,
  FileCheck2,
  UserCheck,
  UserCog,
  LogOut,
  ShieldCheck,
  BookOpen,
  BarChart3,
} from "lucide-react";
import { USER_ROLE_LABELS, UserRole } from "@/lib/constants";
import { IndicadoresEconomicos } from "./IndicadoresEconomicos";
import { ControlesAccesibilidad } from "./ControlesAccesibilidad";

interface SidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Inicio", href: "/", icon: LayoutDashboard, exact: true },
    {
      name: "Oportunidades",
      href: "/oportunidades",
      icon: TrendingUp,
      isActive: (path: string) =>
        path === "/oportunidades" ||
        path.startsWith("/oportunidades/pipeline") ||
        path.startsWith("/oportunidades/dashboard") ||
        path.startsWith("/oportunidades/seguimiento") ||
        path.startsWith("/oportunidades/alta-rapida") ||
        (path.startsWith("/oportunidades/") && !path.startsWith("/oportunidades/gestiones")),
    },
    {
      name: "Gestiones Rápidas",
      href: "/oportunidades/gestiones",
      icon: PhoneCall,
      isActive: (path: string) => path.startsWith("/oportunidades/gestiones"),
    },
    { name: "Cuentas / Empresas", href: "/cuentas", icon: Building2 },
    { name: "Contactos", href: "/contactos", icon: Users2 },
    { name: "Propuestas en UF", href: "/propuestas", icon: FileSpreadsheet },
    { name: "Contratos", href: "/contratos", icon: FileCheck2 },
    { name: "Onboarding", href: "/onboarding", icon: UserCheck },
    { name: "Reportes Gerenciales", href: "/reportes", icon: BarChart3 },
    { name: "Centro de Ayuda", href: "/ayuda", icon: BookOpen },
  ];

  // Solo administradores ven gestión de usuarios
  if (user.role === "ADMIN") {
    navigation.push({ name: "Usuarios y Accesos", href: "/usuarios", icon: UserCog });
  }

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 text-slate-700 dark:text-slate-300 print:hidden transition-colors duration-150">
      <div className="overflow-hidden flex flex-col">
        {/* Brand header */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800/80 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white tracking-wide text-base leading-tight">
              PROTEGIUS
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              CRM Corporativo
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-340px)]">
          {navigation.map((item) => {
            const isActive = item.isActive
              ? item.isActive(pathname)
              : item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition duration-150 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Widgets Inferiores: Indicadores Económicos + Controles de Accesibilidad + Usuario */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 space-y-2.5 shrink-0 transition-colors">
        {/* Indicadores Diarios (UF, Dólar, UTM, Euro) */}
        <IndicadoresEconomicos />

        {/* Controles de Tema Claro/Oscuro y Tamaño de Letra (A, A+, A++) */}
        <ControlesAccesibilidad />

        {/* User profile & Logout */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-slate-800 dark:text-white text-xs shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user.name}
              </p>
              <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                {USER_ROLE_LABELS[user.role] || user.role}
              </span>
            </div>
          </div>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              title="Cerrar sesión"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20 transition duration-150"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
