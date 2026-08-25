import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ContratoForm } from "./ContratoForm";

export default async function NuevoContratoPage({
  searchParams,
}: {
  searchParams: { propuestaId?: string; cuentaId?: string };
}) {
  await requireAuth();

  const [cuentas, propuestas] = await Promise.all([
    prisma.cuenta.findMany({
      orderBy: { razonSocial: "asc" },
      include: {
        afiliaciones: {
          where: { activa: true },
          include: { persona: true },
        },
      },
    }),
    prisma.propuesta.findMany({
      where: { estado: "aceptada" },
      orderBy: { createdAt: "desc" },
      include: {
        planes: true,
      },
    }),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/contratos"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Nuevo Contrato de Servicios</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Formalización de acuerdo comercial y asignación de firmantes legales.
          </p>
        </div>
      </div>

      <ContratoForm
        cuentas={cuentas}
        propuestas={propuestas}
        propuestaIdInicial={searchParams.propuestaId}
        cuentaIdInicial={searchParams.cuentaId}
      />
    </div>
  );
}
