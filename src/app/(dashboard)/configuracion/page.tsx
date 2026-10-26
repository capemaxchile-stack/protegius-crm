import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { USER_ROLE_LABELS, UserRole } from "@/lib/constants";
import { obtenerConfigAlertasAsync } from "@/lib/alertas-externas";
import { obtenerMatrizPermisosAsync } from "@/lib/permisos-roles";
import { ConfiguracionView } from "./ConfiguracionView";
import { CrearUsuarioModal } from "../usuarios/CrearUsuarioModal";
import { EditarUsuarioModal } from "../usuarios/EditarUsuarioModal";
import { MatrizPermisosRoles } from "../usuarios/MatrizPermisosRoles";
import { toggleEstadoUsuarioAction } from "../usuarios/actions";
import {
  Settings,
  Users,
  Sliders,
  BellRing,
  Shield,
  CheckCircle,
  XCircle,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function getRoleBadgeStyle(role: UserRole) {
  switch (role) {
    case "ADMIN":
      return "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20";
    case "GERENTE_GENERAL":
      return "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
    case "GERENTE_COMERCIAL":
      return "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20";
    case "COMERCIAL":
      return "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20";
    case "CONSULTA":
    default:
      return "bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-500/20";
  }
}

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  let currentAdmin;
  try {
    currentAdmin = await requireAdmin();
  } catch {
    redirect("/");
  }

  const activeTab =
    searchParams?.tab === "permisos"
      ? "permisos"
      : searchParams?.tab === "canales"
      ? "canales"
      : "usuarios";

  const [usuarios, matrizPermisos, configAlertas] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            oportunidadesResponsable: true,
            cuentasResponsable: true,
            actividades: true,
          },
        },
      },
    }),
    obtenerMatrizPermisosAsync(),
    obtenerConfigAlertasAsync(),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header General de Configuración */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Configuración del Sistema & Accesos
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Panel integral para administrar usuarios, matriz de roles y canales automáticos de notificación.
              </p>
            </div>
          </div>
        </div>

        {activeTab === "usuarios" && <CrearUsuarioModal />}
      </div>

      {/* Navegación por Pestañas */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <Link
          href="/configuracion?tab=usuarios"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "usuarios"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuarios del Equipo ({usuarios.length})</span>
        </Link>

        <Link
          href="/configuracion?tab=permisos"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "permisos"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Matriz de Permisos por Rol</span>
        </Link>

        <Link
          href="/configuracion?tab=canales"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "canales"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>Canales de Alerta & SLA</span>
        </Link>
      </div>

      {/* Contenido según Pestaña */}
      {activeTab === "canales" ? (
        <ConfiguracionView config={configAlertas} />
      ) : activeTab === "permisos" ? (
        <MatrizPermisosRoles matrizInicial={matrizPermisos} />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Usuario</th>
                  <th className="py-3.5 px-4">Rol en Sistema</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Actividad Registrada</th>
                  <th className="py-3.5 px-4">Fecha Creación</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {usuarios.map((u) => {
                  const isSelf = u.id === currentAdmin.id;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-slate-800 dark:text-white text-xs shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${getRoleBadgeStyle(
                            u.role as UserRole
                          )}`}
                        >
                          <Shield className="w-3 h-3" />
                          {USER_ROLE_LABELS[u.role as UserRole] || u.role}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        {u.active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Activo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Inactivo</span>
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400">
                        <span>{u._count.cuentasResponsable} cuentas</span> ·{" "}
                        <span>{u._count.oportunidadesResponsable} oportunidades</span>
                      </td>

                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(u.createdAt).toLocaleDateString("es-CL", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <EditarUsuarioModal
                            user={{
                              id: u.id,
                              name: u.name,
                              email: u.email,
                              role: u.role,
                              active: u.active,
                            }}
                            isSelf={isSelf}
                          />

                          {!isSelf && (
                            <form
                              action={async () => {
                                "use server";
                                await toggleEstadoUsuarioAction(u.id, u.active);
                              }}
                            >
                              <button
                                type="submit"
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                                  u.active
                                    ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20"
                                    : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                                }`}
                              >
                                {u.active ? "Desactivar" : "Activar"}
                              </button>
                            </form>
                          )}
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
