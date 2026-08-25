// Roles del sistema
export const USER_ROLES = {
  ADMIN: "ADMIN",
  COMERCIAL: "COMERCIAL",
  CONSULTA: "CONSULTA",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  COMERCIAL: "Ejecutivo Comercial",
  CONSULTA: "Solo Lectura / Consulta",
};

// Etapas de Oportunidad comercial
export const ETAPAS_OPORTUNIDAD = [
  { id: "contacto_inicial", label: "Contacto Inicial", orden: 1 },
  { id: "prospecto_calificado", label: "Prospecto Calificado", orden: 2 },
  { id: "necesidad_levantada", label: "Necesidad Levantada", orden: 3 },
  { id: "propuesta_enviada", label: "Propuesta Enviada", orden: 4 },
  { id: "negociacion", label: "Negociación", orden: 5 },
  { id: "aprobacion_comercial", label: "Aprobación Comercial", orden: 6 },
] as const;

export const ESTADOS_OPORTUNIDAD = {
  ABIERTA: "abierta",
  GANADA: "ganada",
  PERDIDA: "perdida",
  PAUSADA: "pausada",
} as const;

// Etapas de Cuenta / Prospecto
export const ETAPAS_CUENTA = [
  { id: "nuevo", label: "Nuevo" },
  { id: "contactado", label: "Contactado" },
  { id: "diagnostico", label: "Diagnóstico" },
  { id: "propuesta", label: "Propuesta enviada" },
  { id: "negociacion", label: "Negociación" },
  { id: "aceptada", label: "Propuesta aceptada" },
  { id: "riesgo", label: "Revisión de riesgo" },
  { id: "contrato", label: "Contrato" },
  { id: "cliente", label: "Cliente activo" },
  { id: "perdido", label: "Perdido" },
] as const;

// Tipos de Actividades
export const TIPOS_ACTIVIDAD = [
  { id: "llamada", label: "Llamada" },
  { id: "reunion", label: "Reunión" },
  { id: "email", label: "Correo Electrónico" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "nota", label: "Nota Interna" },
  { id: "otro", label: "Otro" },
] as const;

// Tareas
export const TIPOS_TAREA = [
  { id: "llamada", label: "Llamada" },
  { id: "correo", label: "Correo" },
  { id: "reunion", label: "Reunión" },
  { id: "seguimiento", label: "Seguimiento" },
  { id: "documento", label: "Documento" },
  { id: "contrato", label: "Contrato" },
  { id: "onboarding", label: "Onboarding" },
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
