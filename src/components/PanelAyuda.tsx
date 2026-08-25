"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Lightbulb, BookOpen } from "lucide-react";
import Link from "next/link";

interface PanelAyudaProps {
  titulo: string;
  descripcion: string;
  pasos?: { titulo: string; detalle: string }[];
  consejoPro?: string;
  enlaceGuia?: string;
  defaultOpen?: boolean;
}

export function PanelAyuda({
  titulo,
  descripcion,
  pasos = [],
  consejoPro,
  enlaceGuia = "/ayuda",
  defaultOpen = false,
}: PanelAyudaProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-slate-900/90 border border-blue-500/20 rounded-2xl overflow-hidden shadow-lg transition-all duration-200">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-800/40 transition"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <span>{titulo}</span>
              <span className="text-[10px] text-blue-400 font-normal bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                Guía rápida
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{descripcion}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium shrink-0">
          <span>{isOpen ? "Ocultar" : "Cómo funciona"}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 space-y-4 text-xs animate-in fade-in duration-150">
          <p className="text-slate-300 leading-relaxed">{descripcion}</p>

          {pasos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {pasos.map((paso, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-1"
                >
                  <div className="flex items-center gap-1.5 font-semibold text-blue-400 text-xs">
                    <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{paso.titulo}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed pl-5.5">{paso.detalle}</p>
                </div>
              ))}
            </div>
          )}

          {consejoPro && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 text-amber-300">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Consejo comercial:</strong> {consejoPro}
              </p>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Link
              href={enlaceGuia}
              className="inline-flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 font-medium transition hover:underline"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Ver Manual y Playbook Completo de Protegius CRM &rarr;</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
