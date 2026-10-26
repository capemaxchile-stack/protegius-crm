"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  TrendingUp,
  Building2,
  Users2,
  PhoneCall,
  Calendar,
  FileSpreadsheet,
  FileCheck2,
  UserCheck,
  Settings,
  BookOpen,
  BarChart3,
  ShieldAlert,
} from "lucide-react";
import { UserRole, PERMISOS_DEFAULT_POR_ROL } from "@/lib/constants";
import { IndicadoresEconomicos } from "./IndicadoresEconomicos";

interface SidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  allowedMenuIds?: string[];
}

interface NavigationItem {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  isActive?: (path: string) => boolean;
}

interface NavigationGroup {
  titulo: string;
  items: NavigationItem[];
}

export function Sidebar({ user, allowedMenuIds }: SidebarProps) {
  const pathname = usePathname();

  const grupos: NavigationGroup[] = [
    {
      titulo: "Comercial & Ventas",
      items: [
        {
          id: "prospeccion",
          name: "🎯 Prospección & Llamados",
          href: "/prospeccion",
          icon: PhoneCall,
          isActive: (path: string) => path === "/prospeccion" || path.startsWith("/prospeccion/"),
        },
        {
          id: "pipeline",
          name: "Pipeline Comercial",
          href: "/oportunidades/pipeline",
          icon: TrendingUp,
          isActive: (path: string) =>
            path === "/oportunidades/pipeline" ||
            path === "/oportunidades" ||
            path.startsWith("/oportunidades/dashboard") ||
            path.startsWith("/oportunidades/alta-rapida") ||
            (path.startsWith("/oportunidades/") && !path.startsWith("/oportunidades/gestiones")),
        },
        {
          id: "reuniones",
          name: "Reuniones & Agenda",
          href: "/reuniones",
          icon: Calendar,
          isActive: (path: string) => path === "/reuniones" || path.startsWith("/reuniones/"),
        },
        {
          id: "propuestas",
          name: "Propuestas en UF",
          href: "/propuestas",
          icon: FileSpreadsheet,
          isActive: (path: string) => path === "/propuestas" || path.startsWith("/propuestas/"),
        },
      ],
    },
    {
      titulo: "Cartera & Clientes",
      items: [
        {
          id: "cuentas",
          name: "Empresas & Cuentas",
          href: "/cuentas",
          icon: Building2,
          isActive: (path: string) => path === "/cuentas" || path.startsWith("/cuentas/"),
        },
        {
          id: "contactos",
          name: "Directorio Contactos",
          href: "/contactos",
          icon: Users2,
          isActive: (path: string) => path === "/contactos" || path.startsWith("/contactos/"),
        },
      ],
    },
    {
      titulo: "Operaciones & Control",
      items: [
        {
          id: "auditoria",
          name: "Auditoría SLA & Alertas",
          href: "/auditoria",
          icon: ShieldAlert,
          isActive: (path: string) => path === "/auditoria" || path.startsWith("/auditoria/"),
        },
        {
          id: "reportes",
          name: "Reportes de Gestión",
          href: "/reportes",
          icon: BarChart3,
          isActive: (path: string) => path === "/reportes" || path.startsWith("/reportes/"),
        },
        {
          id: "contratos",
          name: "Contratos",
          href: "/contratos",
          icon: FileCheck2,
          isActive: (path: string) => path === "/contratos" || path.startsWith("/contratos/"),
        },
        {
          id: "onboarding",
          name: "Onboarding",
          href: "/onboarding",
          icon: UserCheck,
          isActive: (path: string) => path === "/onboarding" || path.startsWith("/onboarding/"),
        },
      ],
    },
    {
      titulo: "Sistema & Configuración",
      items: [
        {
          id: "configuracion",
          name: "Configuración & Accesos",
          href: "/configuracion",
          icon: Settings,
          isActive: (path: string) =>
            path.startsWith("/configuracion") || path.startsWith("/usuarios"),
        },
        {
          id: "ayuda",
          name: "Centro de Ayuda",
          href: "/ayuda",
          icon: BookOpen,
          isActive: (path: string) => path === "/ayuda" || path.startsWith("/ayuda/"),
        },
      ],
    },
  ];

  // Resolver permisos permitidos para este usuario
  const permisos = allowedMenuIds || PERMISOS_DEFAULT_POR_ROL[user.role] || [];
  const puedeVer = (itemId: string) => {
    if (itemId === "configuracion") {
      return permisos.includes("configuracion") || permisos.includes("usuarios");
    }
    return permisos.includes(itemId);
  };

  const gruposFiltrados = grupos
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => puedeVer(item.id)),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 text-slate-700 dark:text-slate-300 print:hidden transition-colors duration-150">
      <div className="overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Brand header */}
        <div className="p-4 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800/80 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-800/90 border border-blue-100 dark:border-slate-700/60 p-1.5 flex items-center justify-center shrink-0 shadow-sm">
            <Image
              src="/logo_protegius.svg"
              alt="Logo Protegius"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="font-black text-slate-900 dark:text-white tracking-wider text-base leading-tight">
              PROTEGIUS
            </h1>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold tracking-tight">
              CRM Corporativo
            </p>
          </div>
        </div>

        {/* Navigation links agrupados por estructura y afinidad */}
        <nav className="p-3 space-y-3 overflow-y-auto flex-1 min-h-0">
          {gruposFiltrados.map((grupo, idx) => (
            <div
              key={grupo.titulo}
              className={idx > 0 ? "pt-2.5 border-t border-slate-100 dark:border-slate-800/70" : ""}
            >
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {grupo.titulo}
              </div>
              <div className="space-y-0.5">
                {grupo.items.map((item) => {
                  const isActive = item.isActive
                    ? item.isActive(pathname)
                    : item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition duration-150 ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-white" : "text-slate-400 dark:text-slate-400"
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Widgets Inferiores: Indicadores Económicos con opción de mostrar u ocultar */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 shrink-0 transition-colors">
        <IndicadoresEconomicos />
      </div>
    </aside>
  );
}
