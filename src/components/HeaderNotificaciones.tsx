"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  PhoneCall,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Mail,
  FileText,
  ExternalLink,
  Phone,
  MessageSquare,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  obtenerNotificacionesUsuarioAction,
  completarTareaNotificacionAction,
  NotificacionesResumen,
} from "@/lib/actions-notificaciones";

interface NovedadItem {
  id: string;
  titulo: string;
  descripcion: string;
  tag: string;
  tagColor: string;
  icono: string;
}

const NOVEDADES_VERSION_2: NovedadItem[] = [
  {
    id: "nav-grupos",
    titulo: "Nuevo Menú Agrupado por Afinidad",
    descripcion:
      "La barra lateral ahora está organizada en 4 secciones lógicas: Comercial & Ventas, Cartera de Clientes, Operaciones & Control y Sistema & Configuración.",
    tag: "Navegación",
    tagColor: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20",
    icono: "🎯",
  },
  {
    id: "perfil-header",
    titulo: "Menú de Usuario y Cambio de Clave",
    descripcion:
      "Arriba a la derecha encontrarás tu menú de perfil: cambia tu contraseña directamente, activa el modo claro/oscuro o ajusta el tamaño de la letra.",
    tag: "Perfil",
    tagColor: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/20",
    icono: "👤",
  },
  {
    id: "indicadores-toggle",
    titulo: "Indicadores Económicos Colapsables",
    descripcion:
      "Los indicadores oficiales (UF, Dólar, UTM, Euro) cuentan con botón de mostrar/ocultar para maximizar el espacio de navegación en pantallas de cualquier tamaño.",
    tag: "Finanzas",
    tagColor: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20",
    icono: "📈",
  },
  {
    id: "correos-firma",
    titulo: "Envíos de Correo con Firma Ejecutiva",
    descripcion:
      "Envía presentaciones, cotizaciones UF, seguimientos y contratos directamente al cliente con tu membrete y datos de contacto oficiales.",
    tag: "Comercial",
    tagColor: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/20",
    icono: "✉️",
  },
  {
    id: "alertas-popup",
    titulo: "Avisos Preventivos al Iniciar Sesión",
    descripcion:
      "Al ingresar a la plataforma, un recordatorio emergente te alertará de inmediato si tienes compromisos vencidos o reuniones agendadas para hoy.",
    tag: "SLA",
    tagColor: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20",
    icono: "⏰",
  },
  {
    id: "configuracion-hub",
    titulo: "Centro Unificado de Configuración",
    descripcion:
      "Administración integral para el Administrador: gestión de usuarios del equipo, matriz de permisos por rol y conexión con Bot de Telegram y Webhooks de correo.",
    tag: "Administración",
    tagColor: "bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/20",
    icono: "⚙️",
  },
];

export function HeaderNotificaciones() {
  const [isOpen, setIsOpen] = useState(false);
  const [tabActiva, setTabActiva] = useState<"todas" | "hoy" | "vencidas" | "reuniones" | "novedades">("todas");
  const [novedadesLeidas, setNovedadesLeidas] = useState(true);

  const [data, setData] = useState<NotificacionesResumen>({
    totalPendientes: 0,
    totalHoy: 0,
    totalVencidas: 0,
    reunionesHoy: 0,
    items: [],
  });
  const [cargando, setCargando] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const cargarNotificaciones = async () => {
    try {
      setCargando(true);
      const res = await obtenerNotificacionesUsuarioAction();
      setData(res);
    } catch (e) {
      console.error("Error cargando notificaciones:", e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarNotificaciones();

    // Comprobar si el usuario ya vio las novedades de la v2.0
    const vistas = localStorage.getItem("protegius_novedades_v2_vistas") === "true";
    setNovedadesLeidas(vistas);

    // Auto-refrescar cada 60 segundos
    const interval = setInterval(cargarNotificaciones, 60000);
    return () => clearInterval(interval);
  }, []);

  const marcarNovedadesVistas = () => {
    setNovedadesLeidas(true);
    localStorage.setItem("protegius_novedades_v2_vistas", "true");
  };

  // Cerrar al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleCompletar = async (tareaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setData((prev) => ({
      ...prev,
      totalPendientes: Math.max(0, prev.totalPendientes - 1),
      items: prev.items.filter((i) => i.id !== tareaId),
    }));

    await completarTareaNotificacionAction(tareaId);
    await cargarNotificaciones();
  };

  const itemsFiltrados = data.items.filter((item) => {
    if (tabActiva === "hoy") return item.esHoy;
    if (tabActiva === "vencidas") return item.esVencida;
    if (tabActiva === "reuniones") return item.tipo === "reunion";
    return true;
  });

  const totalBadges = data.totalHoy + data.totalVencidas;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón Campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Notificaciones, avisos y novedades"
        className={`relative p-2 rounded-xl transition duration-150 border ${
          isOpen
            ? "bg-blue-600 text-white border-blue-600 shadow-md"
            : totalBadges > 0
            ? "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-xs"
            : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white shadow-xs"
        }`}
      >
        <Bell className="w-4 h-4" />

        {/* Punto animado de Novedades no leídas */}
        {!novedadesLeidas && (
          <span className="absolute -top-1 -left-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600 text-[8px] text-white font-black items-center justify-center">
              ✨
            </span>
          </span>
        )}

        {/* Badge contador de tareas pendientes / vencidas */}
        {totalBadges > 0 && (
          <span
            className={`absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none border shadow-xs ${
              data.totalVencidas > 0
                ? "bg-rose-600 text-white border-white dark:border-slate-900 animate-pulse"
                : "bg-blue-600 text-white border-white dark:border-slate-900"
            }`}
          >
            {totalBadges > 99 ? "99+" : totalBadges}
          </span>
        )}
      </button>

      {/* Menú Flotante Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header del panel */}
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Avisos & Novedades
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Llamados pendientes, compromisos y versión
                </p>
              </div>
            </div>

            <button
              onClick={cargarNotificaciones}
              disabled={cargando}
              title="Refrescar notificaciones"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargando ? "animate-spin text-blue-600" : ""}`} />
            </button>
          </div>

          {/* Banner destacado de Nueva Versión (si aún no lo leyó) */}
          {!novedadesLeidas && (
            <div className="mx-3 mt-3 p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-teal-500/10 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">
                    🚀 ¡Nueva Versión 2.0 Lista!
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    Menús agrupados, cambio de clave, correos y más.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTabActiva("novedades");
                  marcarNovedadesVistas();
                }}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] shrink-0 shadow-xs transition"
              >
                Ver
              </button>
            </div>
          )}

          {/* Filtros rápidos / Tabs */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1 text-[11px] font-bold overflow-x-auto">
            <button
              onClick={() => setTabActiva("todas")}
              className={`px-2.5 py-1 rounded-lg transition shrink-0 ${
                tabActiva === "todas"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Todas ({data.totalPendientes})
            </button>
            <button
              onClick={() => setTabActiva("hoy")}
              className={`px-2.5 py-1 rounded-lg transition shrink-0 ${
                tabActiva === "hoy"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Hoy ({data.totalHoy})
            </button>
            {data.totalVencidas > 0 && (
              <button
                onClick={() => setTabActiva("vencidas")}
                className={`px-2.5 py-1 rounded-lg transition shrink-0 ${
                  tabActiva === "vencidas"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                }`}
              >
                Vencidas ({data.totalVencidas})
              </button>
            )}
            <button
              onClick={() => setTabActiva("reuniones")}
              className={`px-2.5 py-1 rounded-lg transition shrink-0 ${
                tabActiva === "reuniones"
                  ? "bg-cyan-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Reuniones ({data.reunionesHoy})
            </button>
            <button
              onClick={() => {
                setTabActiva("novedades");
                marcarNovedadesVistas();
              }}
              className={`px-2.5 py-1 rounded-lg transition shrink-0 flex items-center gap-1.5 ${
                tabActiva === "novedades"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Novedades v2.0</span>
            </button>
          </div>

          {/* Contenido según Tab */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {tabActiva === "novedades" ? (
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Novedades de la Versión 2.0</span>
                  </span>
                  <Link
                    href="/ayuda"
                    onClick={() => setIsOpen(false)}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Ver manual</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {NOVEDADES_VERSION_2.map((nov) => (
                    <div
                      key={nov.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1 hover:border-indigo-400 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm shrink-0">{nov.icono}</span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                            {nov.titulo}
                          </h4>
                        </div>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold border shrink-0 ${nov.tagColor}`}
                        >
                          {nov.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pl-5">
                        {nov.descripcion}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      marcarNovedadesVistas();
                      setTabActiva("todas");
                    }}
                    className="w-full py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
                  >
                    ¡Entendido, volver a avisos!
                  </button>
                </div>
              </div>
            ) : itemsFiltrados.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-75" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  ¡Al día! No hay avisos pendientes
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[240px] mx-auto">
                  Excelente gestión. Todo lo programado está al corriente.
                </p>
              </div>
            ) : (
              itemsFiltrados.map((item) => {
                const phone = item.persona?.telefono;
                const cleanPhone = phone ? phone.replace(/[^0-9+]/g, "") : "";

                return (
                  <div
                    key={item.id}
                    className={`p-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/50 space-y-2 ${
                      item.esVencida ? "bg-rose-50/40 dark:bg-rose-950/20" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 overflow-hidden">
                        {/* Ícono de tipo */}
                        <div
                          className={`p-1.5 rounded-lg shrink-0 mt-0.5 border ${
                            item.tipo === "llamada"
                              ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
                              : item.tipo === "reunion"
                              ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20"
                              : item.tipo === "correo"
                              ? "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20"
                              : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                          }`}
                        >
                          {item.tipo === "llamada" && <PhoneCall className="w-3.5 h-3.5" />}
                          {item.tipo === "reunion" && <Calendar className="w-3.5 h-3.5" />}
                          {item.tipo === "correo" && <Mail className="w-3.5 h-3.5" />}
                          {item.tipo === "seguimiento" && <Clock className="w-3.5 h-3.5" />}
                          {item.tipo === "otro" && <FileText className="w-3.5 h-3.5" />}
                        </div>

                        <div className="overflow-hidden space-y-0.5">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.titulo}
                          </p>

                          {item.cuenta && (
                            <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 truncate">
                              {item.cuenta.razonSocial}
                              {item.persona && ` • ${item.persona.nombre}`}
                            </p>
                          )}

                          {item.responsableName && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              Encargado: <strong className="text-slate-700 dark:text-slate-300">{item.responsableName}</strong>
                            </p>
                          )}

                          {/* Fecha / Hora */}
                          <div className="flex items-center gap-1.5 text-[10px] font-bold">
                            {item.esVencida ? (
                              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                                <AlertCircle className="w-3 h-3" />
                                <span>Vencida</span>
                              </span>
                            ) : item.esHoy ? (
                              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                <Clock className="w-3 h-3" />
                                <span>Para hoy</span>
                              </span>
                            ) : null}

                            {item.fechaVencimiento && (
                              <span className="text-slate-500 dark:text-slate-400 font-normal">
                                {new Date(item.fechaVencimiento).toLocaleDateString("es-CL", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botón Completar */}
                      <button
                        onClick={(e) => handleCompletar(item.id, e)}
                        title="Marcar como realizada"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-transparent hover:border-emerald-200 dark:border-emerald-500/20 transition shrink-0"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Acciones Rápidas (Llamar, WhatsApp, Ver) */}
                    {(cleanPhone || item.cuenta) && (
                      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5">
                          {cleanPhone && (
                            <>
                              <a
                                href={`tel:${cleanPhone}`}
                                title={`Llamar a ${phone}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 transition"
                              >
                                <Phone className="w-2.5 h-2.5" />
                                <span>Llamar</span>
                              </a>
                              <a
                                href={`https://wa.me/${cleanPhone.replace("+", "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Abrir WhatsApp"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 font-bold border border-green-200 dark:border-green-500/20 hover:bg-green-100 transition"
                              >
                                <MessageSquare className="w-2.5 h-2.5" />
                                <span>WhatsApp</span>
                              </a>
                            </>
                          )}
                        </div>

                        {item.cuenta && (
                          <Link
                            href={`/cuentas/${item.cuenta.id}`}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold hover:underline"
                          >
                            <span>Ver ficha</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer del panel */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <Link
              href="/prospeccion"
              onClick={() => setIsOpen(false)}
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline text-[11px]"
            >
              🎯 Prospección
            </Link>
            <Link
              href="/auditoria"
              onClick={() => setIsOpen(false)}
              className="font-bold text-rose-600 dark:text-rose-400 hover:underline text-[11px]"
            >
              🛡️ Auditoría SLA
            </Link>
            <Link
              href="/reuniones"
              onClick={() => setIsOpen(false)}
              className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline text-[11px]"
            >
              📅 Agenda
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
