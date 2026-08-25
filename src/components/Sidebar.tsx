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
} from "lucide-react";
import { USER_ROLE_LABELS, UserRole } from "@/lib/constants";

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
    { name: "Inicio", href: "/", icon: LayoutDashboard },
    { name: "Oportunidades", href: "/oportunidades", icon: TrendingUp },
    { name: "Gestiones Rápidas", href: "/oportunidades/gestiones", icon: PhoneCall },
    { name: "Cuentas / Empresas", href: "/cuentas", icon: Building2 },
    { name: "Contactos", href: "/contactos", icon: Users2 },
    { name: "Propuestas en UF", href: "/propuestas", icon: FileSpreadsheet },
    { name: "Contratos", href: "/contratos", icon: FileCheck2 },
    { name: "Onboarding", href: "/onboarding", icon: UserCheck },
    { name: "Centro de Ayuda", href: "/ayuda", icon: BookOpen },
  ];

  // Solo administradores ven gestión de usuarios
  if (user.role === "ADMIN") {
    navigation.push({ name: "Usuarios y Accesos", href: "/usuarios", icon: UserCog });
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 text-slate-300">
      <div>
        {/* Brand header */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-wide text-base leading-tight">PROTEGIUS</h1>
            <p className="text-[11px] text-slate-400 font-medium">CRM Corporativo</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
          {navigation.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile & Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{user.name}</p>
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {USER_ROLE_LABELS[user.role] || user.role}
            </span>
          </div>
        </div>

        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition duration-150"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
