import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Users2,
  Search,
  Mail,
  Phone,
  Building2,
  Calendar,
} from "lucide-react";
import { formatearFecha } from "@/lib/constants";
import { Prisma } from "@prisma/client";

export default async function ContactosPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  await requireAuth();
  const query = searchParams.q?.trim() || "";

  const whereClause: Prisma.PersonaWhereInput = {};

  if (query) {
    whereClause.OR = [
      { nombre: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
      { cargo: { contains: query, mode: "insensitive" } },
      { telefono: { contains: query, mode: "insensitive" } },
      {
        afiliaciones: {
          some: {
            cuenta: {
              razonSocial: { contains: query, mode: "insensitive" },
            },
          },
        },
      },
    ];
  }

  const contactos = await prisma.persona.findMany({
    where: whereClause,
    orderBy: { nombre: "asc" },
    include: {
      afiliaciones: {
        include: { cuenta: true },
        orderBy: [{ activa: "desc" }, { createdAt: "desc" }],
      },
      _count: {
        select: {
          actividades: true,
          contactosOportunidad: true,
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
            <Users2 className="w-5 h-5 text-blue-500" />
            <h1 className="text-xl font-bold text-white tracking-tight">Directorio de Contactos</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Fichero unificado de personas y su historial de afiliaciones con empresas.
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <form method="GET" className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            name="q"
            defaultValue={query}
            placeholder="Buscar por nombre, cargo, correo o empresa..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </form>
      </div>

      {/* Contacts List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-medium">
              <tr>
                <th className="py-3.5 px-4">Contacto</th>
                <th className="py-3.5 px-4">Datos de Contacto</th>
                <th className="py-3.5 px-4">Empresas / Afiliaciones</th>
                <th className="py-3.5 px-4">Interacciones</th>
                <th className="py-3.5 px-4">Fecha Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {contactos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Users2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-sm font-medium text-slate-300">No se encontraron contactos</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {query ? "Intenta con otro término de búsqueda." : "Los contactos se van creando dentro de cada empresa."}
                    </p>
                  </td>
                </tr>
              ) : (
                contactos.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {p.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{p.nombre}</p>
                            <p className="text-[11px] text-slate-400">{p.cargo || "Sin cargo principal"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {p.email && (
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <a href={`mailto:${p.email}`} className="hover:underline text-blue-400">
                                {p.email}
                              </a>
                            </div>
                          )}
                          {p.telefono && (
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{p.telefono}</span>
                            </div>
                          )}
                          {!p.email && !p.telefono && <span className="text-slate-500 italic">—</span>}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {p.afiliaciones.length === 0 ? (
                          <span className="text-slate-500 italic">Sin empresa vinculada</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {p.afiliaciones.map((af) => (
                              <Link
                                key={af.id}
                                href={`/cuentas/${af.cuentaId}`}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border transition ${
                                  af.activa
                                    ? "bg-slate-950 text-slate-200 border-slate-700 hover:border-blue-500"
                                    : "bg-slate-950/40 text-slate-500 border-slate-800 line-through"
                                }`}
                              >
                                <Building2 className="w-3 h-3 text-slate-500" />
                                <span>{af.cuenta.razonSocial}</span>
                                {af.cargo && <span className="text-slate-400 text-[10px]">({af.cargo})</span>}
                              </Link>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-400">
                        <span>{p._count.actividades} actividades</span> ·{" "}
                        <span>{p._count.contactosOportunidad} negocios</span>
                      </td>

                      <td className="py-4 px-4 text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatearFecha(p.createdAt)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
