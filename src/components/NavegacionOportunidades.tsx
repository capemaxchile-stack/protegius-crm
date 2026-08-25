"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  List,
  Kanban,
  BarChart3,
  CalendarClock,
  PhoneCall,
  Zap,
} from "lucide-react";

export function NavegacionOportunidades() {
  const pathname = usePathname();

  const links = [
    { name: "Listado", href: "/oportunidades", icon: List },
    { name: "Pipeline Kanban", href: "/oportunidades/pipeline", icon: Kanban },
    { name: "Dashboard Métricas", href: "/oportunidades/dashboard", icon: BarChart3 },
    { name: "Seguimiento Diario", href: "/oportunidades/seguimiento", icon: CalendarClock },
    { name: "Gestiones Tempranas", href: "/oportunidades/gestiones", icon: PhoneCall },
    { name: "Alta Rápida", href: "/oportunidades/alta-rapida", icon: Zap },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
      {links.map((link) => {
        const isActive = pathname === link.href;
        const Icon = link.icon;

        return (
          <Link
            key={link.name}
            href={link.href}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition whitespace-nowrap ${
              isActive
                ? "bg-blue-600 text-white shadow-sm font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
            <span>{link.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
