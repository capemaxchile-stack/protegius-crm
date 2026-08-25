import { requireAuth } from "@/lib/auth";
import {
  BookOpen,
  PhoneCall,
  Building2,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  UserCheck,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

export default async function AyudaPage() {
  await requireAuth();

  const modulos = [
    {
      id: "prospeccion",
      titulo: "1. Prospección & Gestiones Tempranas",
      icono: PhoneCall,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
      ruta: "/oportunidades/gestiones",
      descripcion:
        "Diseñado para registrar llamadas en frío, envíos de WhatsApp o primeros contactos sin forzar la apertura prematura de una oportunidad.",
      puntosClave: [
        "Permite seleccionar una empresa existente o escribir una nueva al vuelo.",
        "Genera una actividad comercial en la bitácora de la cuenta.",
        "Opcionalmente agenda un compromiso fechado (ej: 'Volver a llamar el jueves').",
      ],
    },
    {
      id: "cuentas",
      titulo: "2. Directorio de Cuentas & Contactos",
      icono: Building2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
      ruta: "/cuentas",
      descripcion:
        "Fichero central de empresas y personas. Desacopla a las personas de las empresas para mantener el historial si cambian de trabajo.",
      puntosClave: [
        "Validación algorítmica de RUT chileno con Módulo 11.",
        "Múltiples contactos por empresa con designación de Contacto Principal.",
        "Historial de contactos inactivos para conservar la trazabilidad de negociaciones pasadas.",
      ],
    },
    {
      id: "pipeline",
      titulo: "3. Pipeline Comercial & Oportunidades en UF",
      icono: TrendingUp,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20",
      ruta: "/oportunidades/pipeline",
      descripcion:
        "Tablero Kanban estructurado en 6 etapas comerciales estrictamente en Unidades de Fomento (UF) para proteger el valor de las cotizaciones.",
      puntosClave: [
        "Las 6 etapas: Contacto Inicial -> Prospecto Calificado -> Necesidad Levantada -> Propuesta Enviada -> Negociación -> Aprobación Comercial.",
        "Al marcar una oportunidad como perdida, el motivo es 100% obligatorio.",
        "Al completar una tarea, el sistema exige registrar el resultado comercial como actividad.",
      ],
    },
    {
      id: "propuestas",
      titulo: "4. Cotizador & Congelamiento de Tarifas",
      icono: FileSpreadsheet,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
      ruta: "/propuestas",
      descripcion:
        "Emisión de cotizaciones formales con membresía de planes y alcance de servicios en UF.",
      puntosClave: [
        "Congelamiento de precios: los valores de los ítems se congelan en la cotización para que futuros cambios de catálogo no alteren propuestas emitidas.",
        "Generación de correlativo oficial anual (ej: PROP-2026-001).",
        "Vista formal optimizada para impresión o exportación directa a PDF.",
      ],
    },
    {
      id: "contratos",
      titulo: "5. Formalización & Contratos",
      icono: FileText,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20",
      ruta: "/contratos",
      descripcion:
        "Generación del contrato de prestación de servicios a partir de una propuesta aceptada.",
      puntosClave: [
        "Asignación de firmantes legales y contrapartes técnicas.",
        "Control del ciclo de firma: Borrador -> Enviado -> En Revisión -> Firmado.",
        "Al marcar el contrato como Firmado, se inicia automáticamente el flujo de Onboarding.",
      ],
    },
    {
      id: "onboarding",
      titulo: "6. Onboarding & Activación Técnica",
      icono: UserCheck,
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
      ruta: "/onboarding",
      descripcion:
        "Garantiza el pase exitoso de ventas a operaciones y la entrega de accesos al cliente.",
      puntosClave: [
        "Checklist de 4 hitos: Antecedentes Legales, Credenciales de Plataforma, Capacitación y Salida a Producción.",
        "Al finalizar el onboarding, los servicios quedan en estado Activo para control de facturación.",
      ],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Hero Header */}
      <div className="bg-white dark:bg-gradient-to-r dark:from-blue-950/40 dark:via-slate-900 dark:to-indigo-950/40 border border-slate-200 dark:border-blue-500/20 rounded-3xl p-8 shadow-sm relative overflow-hidden transition-colors">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-bold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Centro de Ayuda & Metodología Comercial</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Guía de Funcionamiento de Protegius CRM
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
            Esta plataforma está construida siguiendo la metodología comercial B2B de Protegius: cotizaciones siempre en <strong>UF</strong>, separación estricta de cuentas y personas, congelamiento de tarifas y pase directo a onboarding técnico.
          </p>
        </div>
      </div>

      {/* Flujo Comercial Completo */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>El Ciclo de Vida del Negocio Paso a Paso</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modulos.map((mod) => {
            const Icon = mod.icono;
            return (
              <div
                key={mod.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3.5 hover:border-blue-500 dark:hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl border ${mod.bg}`}>
                        <Icon className={`w-4 h-4 ${mod.color}`} />
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{mod.titulo}</h3>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{mod.descripcion}</p>

                  <ul className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    {mod.puntosClave.map((punto, i) => (
                      <li key={i} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{punto}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <Link
                    href={mod.ruta}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition group"
                  >
                    <span>Ir al módulo</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reglas de Oro del Sistema */}
      <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <Lightbulb className="w-5 h-5" />
          <h2 className="font-bold text-slate-900 dark:text-white text-sm">Reglas de Oro en Protegius CRM</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-700 dark:text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
            <p className="font-bold text-amber-700 dark:text-amber-300">1. Todo en UF</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Oportunidades, planes y propuestas se cotizan en UF para resguardar la rentabilidad ante la inflación.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
            <p className="font-bold text-amber-700 dark:text-amber-300">2. Cierre de Tareas con Bitácora</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Una tarea nunca se completa en blanco: siempre se registra qué pasó en la llamada o reunión.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
            <p className="font-bold text-amber-700 dark:text-amber-300">3. Sin Duplicidad de Contactos</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Si un contacto cambia de empresa, se desactiva su vínculo anterior y se afilia a la nueva manteniendo todo su historial.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
