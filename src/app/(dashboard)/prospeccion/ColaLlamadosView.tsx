"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  PhoneCall,
  Search,
  Calendar,
  Clock,
  MessageSquare,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { ModalGestionLlamada } from "./ModalGestionLlamada";
import { ModalRegistrarAccion } from "./ModalRegistrarAccion";
import { toggleEstadoInteraccionAction } from "@/lib/actions-interacciones";
import { formatearFechaHora } from "@/lib/constants";

export interface ProspectoItem {
  id: string; // cuentaId
  razonSocial: string;
  rut: string | null;
  rubro: string | null;
  etapa: string;
  responsable: {
    id: string;
    name: string;
  } | null;
  contactoPrincipal: {
    id: string;
    nombre: string;
    cargo: string | null;
    telefono: string | null;
    email: string | null;
  } | null;
  ultimaActividad: {
    id: string;
    tipo: string;
    descripcion: string;
    fechaRealizada: Date;
    responsable: string | null;
    usuario: { id: string; name: string } | null;
    proximoPaso: string | null;
    fechaProximoPaso: Date | null;
    estadoPaso?: string | null;
  } | null;
  totalLlamadas: number;
}

interface ColaLlamadosViewProps {
  prospectos: ProspectoItem[];
  currentUserId: string;
  usuarios: { id: string; name: string }[];
}

export function ColaLlamadosView({
  prospectos,
  currentUserId,
  usuarios,
}: ColaLlamadosViewProps) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroTab, setFiltroTab] = useState<"todos" | "mis_asignados" | "rellamadas_hoy" | "sin_contactar" | "reuniones">("todos");
  const [filtroResponsable, setFiltroResponsable] = useState<string>("todos");

  const hoyStr = new Date().toISOString().split("T")[0];

  const prospectosFiltrados = useMemo(() => {
    return prospectos.filter((p) => {
      // 1. Filtro por texto
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const matchEmpresa = p.razonSocial.toLowerCase().includes(q);
        const matchRut = p.rut?.toLowerCase().includes(q);
        const matchContacto = p.contactoPrincipal?.nombre.toLowerCase().includes(q);
        const matchTelefono = p.contactoPrincipal?.telefono?.includes(q);
        const matchEmail = p.contactoPrincipal?.email?.toLowerCase().includes(q);
        if (!matchEmpresa && !matchRut && !matchContacto && !matchTelefono && !matchEmail) {
          return false;
        }
      }

      // 2. Filtro por responsable
      if (filtroResponsable !== "todos") {
        if (p.responsable?.id !== filtroResponsable) return false;
      }

      // 3. Filtro por Tab
      if (filtroTab === "mis_asignados") {
        return p.responsable?.id === currentUserId;
      }
      if (filtroTab === "sin_contactar") {
        return p.totalLlamadas === 0;
      }
      if (filtroTab === "rellamadas_hoy") {
        if (!p.ultimaActividad?.fechaProximoPaso) return false;
        const fechaPasoStr = new Date(p.ultimaActividad.fechaProximoPaso).toISOString().split("T")[0];
        return fechaPasoStr <= hoyStr;
      }
      if (filtroTab === "reuniones") {
        return p.etapa === "diagnostico" || p.etapa === "reunion_agendada";
      }

      return true;
    });
  }, [prospectos, busqueda, filtroTab, filtroResponsable, currentUserId, hoyStr]);

  // Contadores para las pestañas
  const conteoSinContactar = prospectos.filter((p) => p.totalLlamadas === 0).length;
  const conteoRellamadasHoy = prospectos.filter((p) => {
    if (!p.ultimaActividad?.fechaProximoPaso) return false;
    return new Date(p.ultimaActividad.fechaProximoPaso).toISOString().split("T")[0] <= hoyStr;
  }).length;
  const conteoMisAsignados = prospectos.filter((p) => p.responsable?.id === currentUserId).length;
  const conteoReuniones = prospectos.filter((p) => p.etapa === "diagnostico" || p.etapa === "reunion_agendada").length;

  return (
    <div className="space-y-4">
      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Tabs de Filtro */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setFiltroTab("todos")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filtroTab === "todos"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Todos ({prospectos.length})
          </button>
          <button
            onClick={() => setFiltroTab("mis_asignados")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filtroTab === "mis_asignados"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Mis Asignados ({conteoMisAsignados})
          </button>
          <button
            onClick={() => setFiltroTab("rellamadas_hoy")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              filtroTab === "rellamadas_hoy"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Rellamadas Hoy ({conteoRellamadasHoy})</span>
          </button>
          <button
            onClick={() => setFiltroTab("sin_contactar")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filtroTab === "sin_contactar"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Sin Contactar ({conteoSinContactar})
          </button>
          <button
            onClick={() => setFiltroTab("reuniones")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              filtroTab === "reuniones"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Reuniones Agendadas ({conteoReuniones})</span>
          </button>
        </div>

        {/* Barra de Búsqueda y Responsable */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar empresa, contacto o tel..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
            />
          </div>

          <select
            value={filtroResponsable}
            onChange={(e) => setFiltroResponsable(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
          >
            <option value="todos">Todos los Ejecutivos</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Listado / Tabla de Prospectos */}
      {prospectosFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
          <PhoneCall className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            No hay contactos que coincidan con los filtros seleccionados
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Intenta cambiar el criterio de búsqueda o importa más contactos desde el Excel.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Empresa / Prospecto</th>
                  <th className="py-3 px-4">Contacto & Cargo</th>
                  <th className="py-3 px-4">Teléfono & Canales</th>
                  <th className="py-3 px-4">Última Gestión / Trazabilidad</th>
                  <th className="py-3 px-4">Ejecutiva Resp.</th>
                  <th className="py-3 px-4 text-right">Acción Rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {prospectosFiltrados.map((item) => {
                  const telLimpio = item.contactoPrincipal?.telefono?.replace(/[^0-9]/g, "") || "";
                  const waUrl = telLimpio
                    ? `https://wa.me/${telLimpio.startsWith("56") ? telLimpio : `56${telLimpio}`}`
                    : null;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition duration-150"
                    >
                      {/* 1. Empresa */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        <Link
                          href={`/cuentas/${item.id}`}
                          className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                        >
                          {item.razonSocial}
                        </Link>
                        <div className="flex items-center gap-1.5 mt-0.5 font-normal">
                          {item.rubro && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              {item.rubro} ·
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.rut || "Sin RUT"}
                          </span>
                        </div>
                      </td>

                      {/* 2. Contacto */}
                      <td className="py-3.5 px-4">
                        {item.contactoPrincipal ? (
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">
                              {item.contactoPrincipal.nombre}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {item.contactoPrincipal.cargo || "Sin cargo especificado"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Sin contacto asociado</span>
                        )}
                      </td>

                      {/* 3. Teléfono & Canales Directos */}
                      <td className="py-3.5 px-4">
                        {item.contactoPrincipal?.telefono ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <a
                                href={`tel:${item.contactoPrincipal.telefono}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 font-bold text-[11px] border border-emerald-200 dark:border-emerald-500/20"
                                title="Click para llamar"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{item.contactoPrincipal.telefono}</span>
                              </a>

                              {waUrl && (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
                                  title="Abrir WhatsApp Web"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                </a>
                              )}
                            </div>

                            {item.contactoPrincipal.email && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                <Mail className="w-2.5 h-2.5" />
                                <a
                                  href={`mailto:${item.contactoPrincipal.email}`}
                                  className="hover:underline truncate max-w-[150px]"
                                >
                                  {item.contactoPrincipal.email}
                                </a>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Sin teléfono</span>
                        )}
                      </td>

                      {/* 4. Última Gestión & Trazabilidad */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {item.ultimaActividad ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                <span>{formatearFechaHora(item.ultimaActividad.fechaRealizada)}</span>
                                <span>·</span>
                                <span className="text-blue-600 dark:text-blue-400 font-bold">
                                  por {item.ultimaActividad.usuario?.name || item.ultimaActividad.responsable || "Ejecutiva"}
                                </span>
                              </div>

                              {/* Estado Realizada / Pendiente */}
                              {item.ultimaActividad.estadoPaso === "hecho" || !item.ultimaActividad.proximoPaso ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Realizada</span>
                                </span>
                              ) : null}
                            </div>

                            <p className="text-slate-700 dark:text-slate-300 text-[11px] line-clamp-2 leading-relaxed">
                              {item.ultimaActividad.descripcion}
                            </p>

                            {item.ultimaActividad.proximoPaso && (
                              <div className="flex items-center justify-between gap-1.5 pt-0.5">
                                {item.ultimaActividad.estadoPaso === "hecho" ? (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold line-through opacity-80">
                                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                                    <span>{item.ultimaActividad.proximoPaso}</span>
                                  </div>
                                ) : (
                                  <>
                                    <div
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                        item.ultimaActividad.fechaProximoPaso &&
                                        new Date(item.ultimaActividad.fechaProximoPaso) < new Date()
                                          ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30"
                                          : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30"
                                      }`}
                                    >
                                      {item.ultimaActividad.fechaProximoPaso &&
                                      new Date(item.ultimaActividad.fechaProximoPaso) < new Date() ? (
                                        <AlertTriangle className="w-3 h-3 shrink-0" />
                                      ) : (
                                        <Clock className="w-3 h-3 shrink-0" />
                                      )}
                                      <span className="truncate max-w-[180px]">
                                        {item.ultimaActividad.proximoPaso}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (item.ultimaActividad) {
                                          await toggleEstadoInteraccionAction(item.ultimaActividad.id, true);
                                        }
                                      }}
                                      title="Marcar compromiso como Realizado (Tick Verde)"
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow-xs transition shrink-0"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Hecho</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                            <span>⭐ Nuevo / Sin llamado</span>
                          </div>
                        )}
                      </td>

                      {/* 5. Responsable */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.responsable?.name || "Sin asignar"}
                        </span>
                      </td>

                      {/* 6. Acción Rápida */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <ModalGestionLlamada
                            cuenta={{
                              id: item.id,
                              razonSocial: item.razonSocial,
                              rut: item.rut,
                            }}
                            contacto={item.contactoPrincipal}
                            usuarios={usuarios}
                            currentUserId={currentUserId}
                          />

                          <ModalRegistrarAccion
                            cuenta={{
                              id: item.id,
                              razonSocial: item.razonSocial,
                              rut: item.rut,
                            }}
                            contacto={item.contactoPrincipal}
                            usuarios={usuarios}
                            currentUserId={currentUserId}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
