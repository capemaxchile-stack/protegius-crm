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
} from "lucide-react";
import {
  obtenerNotificacionesUsuarioAction,
  completarTareaNotificacionAction,
  NotificacionesResumen,
} from "@/lib/actions-notificaciones";

export function HeaderNotificaciones() {
  const [isOpen, setIsOpen] = useState(false);
  const [tabActiva, setTabActiva] = useState<"todas" | "hoy" | "vencidas" | "reuniones">("todas");
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

    // Auto-refrescar cada 60 segundos
    const interval = setInterval(cargarNotificaciones, 60000);
    return () => clearInterval(interval);
  }, []);

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
    // Actualización optimista
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
        title="Notificaciones y avisos comerciales"
        className={`relative p-2 rounded-xl transition duration-150 border ${
          isOpen
            ? "bg-blue-600 text-white border-blue-600 shadow-md"
            : totalBadges > 0
            ? "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm"
            : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white shadow-sm"
        }`}
      >
        <Bell className="w-4 h-4" />

        {/* Badge contador */}
        {totalBadges > 0 && (
          <span
            className={`absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none border shadow-sm ${
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
                  Avisos Comerciales
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Llamados pendientes y compromisos
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
          </div>

          {/* Lista de Notificaciones */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {itemsFiltrados.length === 0 ? (
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
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-500/20 transition shrink-0"
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
              🛡️ Auditoría SLA & Bot
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
