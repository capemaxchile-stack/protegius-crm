import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { CrearUsuarioModal } from "./CrearUsuarioModal";
import { Users, Shield, CheckCircle, XCircle, Calendar } from "lucide-react";
import { toggleEstadoUsuarioAction } from "./actions";

export default async function UsuariosPage() {
  const currentAdmin = await requireAdmin();

  const usuarios = await prisma.user.findMany({
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
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <h1 className="text-xl font-bold text-white tracking-tight">Gestión de Usuarios y Accesos</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Administra los miembros del equipo, sus roles comerciales y permisos en el CRM.
          </p>
        </div>

        <CrearUsuarioModal />
      </div>

      {/* Users table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-medium">
              <tr>
                <th className="py-3.5 px-4">Usuario</th>
                <th className="py-3.5 px-4">Rol en Sistema</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Actividad Registrada</th>
                <th className="py-3.5 px-4">Fecha Creación</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {usuarios.map((u) => {
                const isSelf = u.id === currentAdmin.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{u.name}</p>
                          <p className="text-slate-400 text-[11px]">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${
                          u.role === "ADMIN"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : u.role === "COMERCIAL"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        {USER_ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      {u.active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Activo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Inactivo</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-slate-400">
                      <span>{u._count.cuentasResponsable} cuentas</span> ·{" "}
                      <span>{u._count.oportunidadesResponsable} oportunidades</span>
                    </td>

                    <td className="py-4 px-4 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
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
                      {!isSelf ? (
                        <form
                          action={async () => {
                            "use server";
                            await toggleEstadoUsuarioAction(u.id, u.active);
                          }}
                        >
                          <button
                            type="submit"
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                              u.active
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            }`}
                          >
                            {u.active ? "Desactivar" : "Activar"}
                          </button>
                        </form>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">Sesión actual</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
