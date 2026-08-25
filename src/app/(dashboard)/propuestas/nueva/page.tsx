import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PropuestaEditor } from "./PropuestaEditor";

export default async function NuevaPropuestaPage({
  searchParams,
}: {
  searchParams: { cuentaId?: string; oportunidadId?: string };
}) {
  await requireAuth();

  const [cuentas, gruposPlan, servicios] = await Promise.all([
    prisma.cuenta.findMany({
      orderBy: { razonSocial: "asc" },
      include: {
        afiliaciones: {
          where: { activa: true },
          include: { persona: true },
        },
        oportunidades: {
          where: { estado: { in: ["abierta", "pausada"] } },
          select: {
            id: true,
            nombre: true,
            etapa: true,
            valorEstimado: true,
          },
        },
      },
    }),
    prisma.grupoPlan.findMany({
      orderBy: { orden: "asc" },
      include: {
        planes: {
          where: { activo: true },
          orderBy: { valorEmpresaUF: "asc" },
        },
      },
    }),
    prisma.servicio.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/propuestas"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Nueva Propuesta Comercial</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configura planes, servicios y condiciones comerciales en UF con congelamiento de precios.
          </p>
        </div>
      </div>

      <PropuestaEditor
        cuentas={cuentas}
        gruposPlan={gruposPlan}
        servicios={servicios}
        cuentaIdInicial={searchParams.cuentaId}
        oportunidadIdInicial={searchParams.oportunidadId}
      />
    </div>
  );
}
