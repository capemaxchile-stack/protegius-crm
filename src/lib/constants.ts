// Roles del sistema
export const USER_ROLES = {
  ADMIN: "ADMIN",
  GERENTE_GENERAL: "GERENTE_GENERAL",
  GERENTE_COMERCIAL: "GERENTE_COMERCIAL",
  COMERCIAL: "COMERCIAL",
  CONSULTA: "CONSULTA",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador de Plataforma",
  GERENTE_GENERAL: "Gerente General",
  GERENTE_COMERCIAL: "Gerente Comercial",
  COMERCIAL: "Ejecutivo Comercial",
  CONSULTA: "Solo Lectura / Consulta",
};

export interface MenuItemConfig {
  id: string;
  name: string;
  href: string;
  iconName: string;
  descripcion: string;
}

export const MENUS_SISTEMA: MenuItemConfig[] = [
  { id: "prospeccion", name: "🎯 Prospección & Llamados", href: "/prospeccion", iconName: "PhoneCall", descripcion: "Llamados diarios y gestión rápida de leads" },
  { id: "pipeline", name: "Pipeline Comercial", href: "/oportunidades/pipeline", iconName: "TrendingUp", descripcion: "Embudo de oportunidades y etapas de venta" },
  { id: "reuniones", name: "Reuniones & Agenda", href: "/reuniones", iconName: "Calendar", descripcion: "Reuniones agendadas y compromisos" },
  { id: "auditoria", name: "Auditoría SLA & Alertas", href: "/auditoria", iconName: "ShieldAlert", descripcion: "Monitoreo de compromisos por vencer y atrasados" },
  { id: "cuentas", name: "Empresas & Cuentas", href: "/cuentas", iconName: "Building2", descripcion: "Fichas de clientes y prospectos corporativos" },
  { id: "contactos", name: "Directorio Contactos", href: "/contactos", iconName: "Users2", descripcion: "Base de contactos comerciales" },
  { id: "propuestas", name: "Propuestas en UF", href: "/propuestas", iconName: "FileSpreadsheet", descripcion: "Generación y cotización de planes" },
  { id: "reportes", name: "Reportes de Gestión", href: "/reportes", iconName: "BarChart3", descripcion: "Métricas y rendimiento comercial" },
  { id: "contratos", name: "Contratos", href: "/contratos", iconName: "FileCheck2", descripcion: "Gestión legal y firma de contratos" },
  { id: "onboarding", name: "Onboarding", href: "/onboarding", iconName: "UserCheck", descripcion: "Puesta en marcha de servicios a clientes" },
  { id: "usuarios", name: "Usuarios y Accesos", href: "/usuarios", iconName: "UserCog", descripcion: "Administración de usuarios, roles y permisos" },
  { id: "ayuda", name: "Centro de Ayuda", href: "/ayuda", iconName: "BookOpen", descripcion: "Manual y guías del sistema" },
];

export const PERMISOS_DEFAULT_POR_ROL: Record<UserRole, string[]> = {
  ADMIN: [
    "prospeccion", "pipeline", "reuniones", "auditoria", "cuentas",
    "contactos", "propuestas", "reportes", "contratos", "onboarding",
    "usuarios", "ayuda"
  ],
  GERENTE_GENERAL: [
    "prospeccion", "pipeline", "reuniones", "auditoria", "cuentas",
    "contactos", "propuestas", "reportes", "contratos", "onboarding", "ayuda"
  ],
  GERENTE_COMERCIAL: [
    "prospeccion", "pipeline", "reuniones", "auditoria", "cuentas",
    "contactos", "propuestas", "reportes", "contratos", "onboarding", "ayuda"
  ],
  COMERCIAL: [
    "prospeccion", "pipeline", "reuniones", "auditoria", "cuentas",
    "contactos", "propuestas", "ayuda"
  ],
  CONSULTA: [
    "pipeline", "cuentas", "contactos", "reportes", "ayuda"
  ],
};

// Etapas de Oportunidad comercial simplificadas (4 etapas clave de prospección)
export const ETAPAS_OPORTUNIDAD = [
  { id: "por_contactar", label: "Por Contactar", orden: 1, color: "slate" },
  { id: "en_gestion", label: "En Gestión / Llamado", orden: 2, color: "blue" },
  { id: "reunion_agendada", label: "Reunión Agendada", orden: 3, color: "purple" },
  { id: "propuesta_enviada", label: "Propuesta Enviada", orden: 4, color: "amber" },
] as const;

// Helper para compatibilidad con datos históricos
export function normalizarEtapaOportunidad(etapa: string): string {
  switch (etapa) {
    case "contacto_inicial":
      return "por_contactar";
    case "prospecto_calificado":
    case "necesidad_levantada":
      return "en_gestion";
    case "propuesta_enviada":
    case "negociacion":
    case "aprobacion_comercial":
      return "propuesta_enviada";
    default:
      return etapa;
  }
}

export const ESTADOS_OPORTUNIDAD = {
  ABIERTA: "abierta",
  GANADA: "ganada",
  PERDIDA: "perdida",
  PAUSADA: "pausada",
} as const;

// Resultados de Prospección / Llamada
export const RESULTADOS_LLAMADA = [
  {
    id: "no_contesta",
    label: "No Contesta / Buzón",
    descripcion: "Registra intento y agenda nuevo intento",
    color: "rose",
  },
  {
    id: "rellamar",
    label: "Rellamar / En Seguimiento",
    descripcion: "Pidió llamar en otra fecha/hora",
    color: "amber",
  },
  {
    id: "reunion_agendada",
    label: "Reunión Agendada 🎉",
    descripcion: "Se coordinó reunión formal comercial",
    color: "purple",
  },
  {
    id: "propuesta_solicitada",
    label: "Enviar Propuesta / Información",
    descripcion: "Interesado, solicitó propuesta económica",
    color: "blue",
  },
  {
    id: "no_interesado",
    label: "No Interesado / Descartado",
    descripcion: "Tiene proveedor, sin presupuesto, etc.",
    color: "slate",
  },
  {
    id: "numero_invalido",
    label: "Número Inválido / No Existe",
    descripcion: "Teléfono cortado o persona ya no trabaja allí",
    color: "slate",
  },
] as const;

// Etapas de Cuenta / Prospecto
export const ETAPAS_CUENTA = [
  { id: "nuevo", label: "Nuevo / Sin Contactar" },
  { id: "contactado", label: "En Gestión de Llamadas" },
  { id: "diagnostico", label: "Reunión Agendada" },
  { id: "propuesta", label: "Propuesta Enviada" },
  { id: "cliente", label: "Cliente Activo / Ganado" },
  { id: "perdido", label: "Descartado / No Interesado" },
] as const;

// Tipos de Actividades
export const TIPOS_ACTIVIDAD = [
  { id: "llamada", label: "Llamada Telefónica" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "email", label: "Correo Electrónico" },
  { id: "reunion", label: "Reunión Comercial" },
  { id: "cotizacion", label: "Envío / Gestión de Cotización" },
  { id: "contrato", label: "Envío / Revisión de Contrato" },
  { id: "nota", label: "Nota Interna" },
  { id: "otro", label: "Otra Acción" },
] as const;

// Hitos de Flujo Comercial con SLA sugerido (en horas)
export const HITOS_FLUJO_SLA = [
  {
    id: "cotizacion",
    label: "📄 Enviar Cotización / Propuesta",
    slaHorasDefault: 24,
    prioridad: "alta",
    descripcion: "El encargado comercial debe preparar y enviar la propuesta en UF",
  },
  {
    id: "contrato",
    label: "✒️ Enviar / Gestionar Contrato",
    slaHorasDefault: 48,
    prioridad: "critica",
    descripcion: "Preparación y envío de borrador de contrato para firma",
  },
  {
    id: "reunion",
    label: "📅 Realizar Reunión / Diagnóstico",
    slaHorasDefault: 48,
    prioridad: "alta",
    descripcion: "Reunión comercial o levantamiento técnico agendado",
  },
  {
    id: "llamada",
    label: "📞 Rellamar / Seguimiento Telefónico",
    slaHorasDefault: 24,
    prioridad: "media",
    descripcion: "Contacto de seguimiento con el prospecto o cliente",
  },
  {
    id: "correo",
    label: "✉️ Enviar Información / Presentación",
    slaHorasDefault: 12,
    prioridad: "media",
    descripcion: "Envío de brochure, credenciales o antecedentes por correo/WhatsApp",
  },
] as const;

// Tareas
export const TIPOS_TAREA = [
  { id: "llamada", label: "Llamada / Rellamada" },
  { id: "reunion", label: "Reunión" },
  { id: "correo", label: "Enviar Propuesta / Correo" },
  { id: "seguimiento", label: "Seguimiento" },
  { id: "documento", label: "Documento" },
  { id: "contrato", label: "Contrato" },
  { id: "otro", label: "Otro" },
] as const;

export const ESTADOS_TAREA = [
  { id: "pendiente", label: "Pendiente" },
  { id: "en_proceso", label: "En Proceso" },
  { id: "completada", label: "Completada" },
  { id: "cancelada", label: "Cancelada" },
] as const;

export const PRIORIDADES_TAREA = [
  { id: "baja", label: "Baja", color: "bg-slate-100 text-slate-700" },
  { id: "media", label: "Media", color: "bg-blue-50 text-blue-700" },
  { id: "alta", label: "Alta", color: "bg-amber-50 text-amber-700" },
  { id: "critica", label: "Crítica / Urgente", color: "bg-rose-50 text-rose-700" },
] as const;

// Formateadores
export function formatearUF(monto: number | null | undefined): string {
  if (monto === null || monto === undefined) return "Sin definir";
  return `${monto.toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} UF`;
}

export function formatearFecha(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return d.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatearFechaHora(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return d.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
