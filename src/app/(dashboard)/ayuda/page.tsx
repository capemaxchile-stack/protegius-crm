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
  ShieldAlert,
  Users2,
  Mail,
  Settings,
} from "lucide-react";
import Link from "next/link";

export default async function AyudaPage() {
  await requireAuth();

  const modulos = [
    {
      id: "prospeccion",
      titulo: "1. Prospección & Cola de Llamados",
      icono: PhoneCall,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
      ruta: "/prospeccion",
      descripcion:
        "Centro de llamadas salientes y barrido comercial para ejecutivas. Permite registrar llamados con 1 clic y mantener la trazabilidad de cada interacción.",
      puntosClave: [
        "Filtros operativos: Todos, Asignados a mí, Rellamar Hoy, Sin Contactar y Reunión Agendada.",
        "Acceso directo con un clic a discado telefónico (tel:) y WhatsApp web.",
        "Modal de gestión rápida: diferenciación clara entre envío de Cotización y Contrato, agendamiento de reuniones y asignación a ejecutivos.",
      ],
    },
    {
      id: "importar",
      titulo: "2. Importador de Cuentas & Bases Excel",
      icono: FileSpreadsheet,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
      ruta: "/cuentas/importar",
      descripcion:
        "Carga masiva de prospectos desde archivos Excel (.xlsx, .xls) o CSV con detección inteligente de columnas.",
      puntosClave: [
        "Mapeo visual automático de Razón Social, RUT, Contacto, Teléfono, Email, Cargo y Rubro.",
        "Asignación directa de la base cargada a ejecutivos comerciales (excluye al Administrador de plataforma).",
        "Validación y sanitización algorítmica de RUT chileno con Módulo 11.",
      ],
    },
    {
      id: "reuniones",
      titulo: "3. Agenda de Reuniones",
      icono: UserCheck,
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
      ruta: "/reuniones",
      descripcion:
        "Calendario y panel de reuniones comerciales agendadas, ordenadas cronológicamente para no perder ningún compromiso con clientes.",
      puntosClave: [
        "Sección dedicada a reuniones agendadas para Hoy, Próximos 7 Días e Histórico.",
        "Enlace directo a la ficha del cliente y notas de la reunión.",
        "Sincronización automática desde la gestión rápida de llamados.",
      ],
    },
    {
      id: "pipeline",
      titulo: "4. Pipeline Comercial Simplificado (4 Etapas)",
      icono: TrendingUp,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20",
      ruta: "/oportunidades/pipeline",
      descripcion:
        "Tablero Kanban ágil y enfocado en la conversión real: Por Contactar -> En Gestión / Llamado -> Reunión Agendada -> Propuesta Enviada.",
      puntosClave: [
        "4 etapas simples sin burocracia comercial para acelerar el ciclo de ventas.",
        "Monto cotizado expresado estrictamente en Unidades de Fomento (UF).",
        "Trazabilidad de motivos obligatorios al marcar oportunidades perdidas.",
      ],
    },
    {
      id: "propuestas",
      titulo: "5. Cotizador & Congelamiento de Tarifas",
      icono: FileText,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
      ruta: "/propuestas",
      descripcion:
        "Emisión de cotizaciones formales con catálogo de servicios y membresías en UF.",
      puntosClave: [
        "Congelamiento de tarifas en la cotización emitida.",
        "Generación automática de correlativo oficial anual (ej: PROP-2026-001).",
        "Eliminación protegida de propuestas erróneas o duplicadas disponible exclusivamente para Administradores.",
      ],
    },
    {
      id: "correos-clientes",
      titulo: "6. Envíos de Correo a Clientes & Firma Ejecutiva",
      icono: Mail,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20",
      ruta: "/cuentas",
      descripcion:
        "Envío de correos directos desde la ficha del cliente con plantillas comerciales y pie de firma dinámico según el ejecutivo conectado.",
      puntosClave: [
        "4 Plantillas listas: Presentación Comercial, Envío de Cotización UF, Seguimiento y Envío de Contrato.",
        "Firma automática con Nombre, Cargo, Teléfono, Email y membrete oficial de Protegius.",
        "Entrega de alta entregabilidad mediante Brevo API v3 (o webhook transaccional n8n).",
      ],
    },
    {
      id: "auditoria-sla",
      titulo: "7. Auditoría SLA & Alertas al Ingresar",
      icono: ShieldAlert,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20",
      ruta: "/auditoria",
      descripcion:
        "Supervisión estricta de compromisos comerciales, plazos de respuesta y recordatorios automáticos al abrir la plataforma.",
      puntosClave: [
        "Ventana de alerta preventiva configurable antes de que expire un compromiso comercial.",
        "Popup emergente al iniciar sesión avisando de inmediato sobre tareas vencidas o compromisos de hoy.",
        "Disparo manual o programado de alertas consolidadas hacia Telegram y Correo de supervisión.",
      ],
    },
    {
      id: "roles-permisos",
      titulo: "8. Roles, Permisos & Matriz de Menú",
      icono: Users2,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20",
      ruta: "/usuarios",
      descripcion:
        "Estructura de seguridad con 5 roles corporativos y control visual de accesos al menú del sistema.",
      puntosClave: [
        "5 Roles: Administrador de Plataforma, Gerente General, Gerente Comercial, Ejecutivo Comercial y Solo Lectura.",
        "Pestaña 'Matriz de Permisos': el Administrador activa o desactiva qué secciones ve cada rol en el menú lateral.",
        "El Administrador queda excluido de tareas operativas para enfocarse netamente en la gestión del sistema.",
      ],
    },
    {
      id: "configuracion-canales",
      titulo: "9. Configuración de Canales (Telegram & Webhooks)",
      icono: Settings,
      color: "text-slate-600 dark:text-slate-400",
      bg: "bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20",
      ruta: "/configuracion",
      descripcion:
        "Panel exclusivo para el Administrador para conectar canales externos de mensajería y alertas.",
      puntosClave: [
        "Bot de Telegram: conexión de token @BotFather y auto-detección del ID del grupo de supervisores.",
        "Integración de Webhook n8n / Brevo para correos de alerta de SLA.",
        "Pruebas de conectividad en tiempo real sin salir de la plataforma.",
      ],
    },
    {
      id: "contratos",
      titulo: "10. Contratos & Onboarding Operativo",
      icono: Building2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
      ruta: "/contratos",
      descripcion:
        "Formalización legal y pase a operaciones una vez aprobada la propuesta comercial.",
      puntosClave: [
        "Control de estados de firma y asignación de firmantes legales.",
        "Checklist de activación técnica y pase a producción.",
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
            Esta plataforma está construida siguiendo la metodología comercial B2B de Protegius: cotizaciones siempre en <strong>UF</strong>, separación estricta de cuentas y personas, control estricto de SLA, trazabilidad de llamadas y envío de correos con firma corporativa.
          </p>
        </div>
      </div>

      {/* Flujo Comercial Completo */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Módulos y Procesos del Sistema</span>
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

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs text-slate-700 dark:text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
            <p className="font-bold text-amber-700 dark:text-amber-300">1. Todo en UF</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Oportunidades, planes y propuestas se cotizan en UF para resguardar la rentabilidad ante la inflación.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
            <p className="font-bold text-amber-700 dark:text-amber-300">2. Cierre con Bitácora</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Una tarea nunca se completa en blanco: siempre se registra qué ocurrió en la llamada o reunión.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
            <p className="font-bold text-amber-700 dark:text-amber-300">3. Sin Duplicidad</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Si un contacto cambia de empresa, se desactiva su vínculo previo y se afilia a la nueva manteniendo su historial.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
            <p className="font-bold text-amber-700 dark:text-amber-300">4. Alertas al Ingresar</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              El sistema te avisa inmediatamente al entrar si tienes tareas vencidas o reuniones programadas para hoy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
