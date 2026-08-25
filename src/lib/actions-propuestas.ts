"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface PropuestaActionState {
  error?: string;
  success?: boolean;
  propuestaId?: string;
}

export async function crearPropuestaAction(
  prevState: PropuestaActionState | null,
  formData: FormData
): Promise<PropuestaActionState> {
  await requireAuth();

  const cuentaId = formData.get("cuentaId")?.toString().trim();
  const oportunidadId = formData.get("oportunidadId")?.toString().trim() || null;
  const clienteRazonSocial = formData.get("clienteRazonSocial")?.toString().trim();
  const clienteRut = formData.get("clienteRut")?.toString().trim() || null;
  const clienteGiro = formData.get("clienteGiro")?.toString().trim() || null;
  const clienteContacto = formData.get("clienteContacto")?.toString().trim() || null;
  const clienteEmail = formData.get("clienteEmail")?.toString().trim() || null;
  const clienteTelefono = formData.get("clienteTelefono")?.toString().trim() || null;

  const rawVigencia = formData.get("vigenciaDias")?.toString().trim() || "15";
  const vigenciaDias = parseInt(rawVigencia, 10) || 15;

  const rawSetupValor = formData.get("setupValorUF")?.toString().trim() || "0";
  const rawSetupDesc = formData.get("setupDescuentoPct")?.toString().trim() || "0";
  const setupValorUF = parseFloat(rawSetupValor.replace(",", ".")) || 0;
  const setupDescuentoPct = parseFloat(rawSetupDesc.replace(",", ".")) || 0;

  const rawPlanes = formData.get("planesSeleccionados")?.toString();
  const rawServicios = formData.get("serviciosSeleccionados")?.toString();

  if (!cuentaId || !clienteRazonSocial) {
    return { error: "La cuenta y la razón social son obligatorias." };
  }

  let planes: {
    grupoNombre: string;
    planNombre: string;
    detalle: string | null;
    valorOriginal: number;
    descuentoPct: number;
    valorFinal: number;
  }[] = [];

  let servicios: {
    nombre: string;
    descripcion: string | null;
    tipo: string;
  }[] = [];

  try {
    if (rawPlanes) planes = JSON.parse(rawPlanes);
    if (rawServicios) servicios = JSON.parse(rawServicios);
  } catch {
    return { error: "Error al procesar los planes o servicios seleccionados." };
  }

  if (planes.length === 0 && servicios.length === 0) {
    return { error: "Debes incluir al menos un plan o servicio en la cotización." };
  }

  let propuestaCreadaId = "";

  try {
    // Generar correlativo anual
    const year = new Date().getFullYear();
    const totalPropuestasYear = await prisma.propuesta.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
        },
      },
    });

    const numeroCorrelativo = `${year}-${String(totalPropuestasYear + 1).padStart(3, "0")}`;

    const propuesta = await prisma.propuesta.create({
      data: {
        numero: numeroCorrelativo,
        cuentaId,
        oportunidadId,
        clienteRazonSocial,
        clienteRut,
        clienteGiro,
        clienteContacto,
        clienteEmail,
        clienteTelefono,
        vigenciaDias,
        estado: "borrador",
        setupValorUF,
        setupDescuentoPct,
        mostrarPlanes: planes.length > 0,
        mostrarServicios: servicios.length > 0,
        planes: {
          create: planes.map((p) => ({
            grupoNombre: p.grupoNombre,
            planNombre: p.planNombre,
            detalle: p.detalle,
            valorOriginal: p.valorOriginal,
            descuentoPct: p.descuentoPct || 0,
            valorFinal: p.valorFinal,
          })),
        },
        servicios: {
          create: servicios.map((s) => ({
            nombre: s.nombre,
            descripcion: s.descripcion,
            tipo: s.tipo || "con_clave",
          })),
        },
      },
    });

    propuestaCreadaId = propuesta.id;

    // Si tiene oportunidad asociada, actualizar el valor estimado con el total de la propuesta
    if (oportunidadId) {
      const totalPlanesUF = planes.reduce((acc, p) => acc + p.valorFinal, 0);
      const totalSetupFinalUF = setupValorUF * (1 - setupDescuentoPct / 100);
      const totalEstimado = Math.round((totalPlanesUF + totalSetupFinalUF) * 100) / 100;

      await prisma.oportunidad.update({
        where: { id: oportunidadId },
        data: {
          valorEstimado: totalEstimado,
          etapa: "propuesta_enviada",
        },
      });

      revalidatePath(`/oportunidades/${oportunidadId}`);
    }

    revalidatePath("/propuestas");
    revalidatePath(`/cuentas/${cuentaId}`);
  } catch (err) {
    console.error("Error al crear propuesta:", err);
    return { error: "No se pudo emitir la propuesta comercial." };
  }

  redirect(`/propuestas/${propuestaCreadaId}`);
}

export async function cambiarEstadoPropuestaAction(
  propuestaId: string,
  nuevoEstado: "borrador" | "enviada" | "aceptada" | "rechazada"
) {
  await requireAuth();

  const propuesta = await prisma.propuesta.update({
    where: { id: propuestaId },
    data: { estado: nuevoEstado },
    include: { oportunidad: true },
  });

  // Si se acepta y tiene oportunidad, marcarla como Aprobación Comercial / Ganada
  if (nuevoEstado === "aceptada" && propuesta.oportunidadId) {
    await prisma.oportunidad.update({
      where: { id: propuesta.oportunidadId },
      data: {
        etapa: "aprobacion_comercial",
      },
    });
    revalidatePath(`/oportunidades/${propuesta.oportunidadId}`);
  }

  revalidatePath(`/propuestas/${propuestaId}`);
  revalidatePath("/propuestas");
}

// ----------------------------------------------------
// ADMINISTRACIÓN DE CATÁLOGO
// ----------------------------------------------------

export async function crearPlanAction(formData: FormData) {
  await requireAuth();

  const grupoId = formData.get("grupoId")?.toString().trim();
  const nombre = formData.get("nombre")?.toString().trim();
  const detalle = formData.get("detalle")?.toString().trim() || null;
  const rawEmpresa = formData.get("valorEmpresaUF")?.toString().trim();
  const rawNatural = formData.get("valorNaturalUF")?.toString().trim();

  if (!grupoId || !nombre || !rawEmpresa) return;

  const valorEmpresaUF = parseFloat(rawEmpresa.replace(",", "."));
  const valorNaturalUF = rawNatural ? parseFloat(rawNatural.replace(",", ".")) : null;

  await prisma.plan.create({
    data: {
      grupoId,
      nombre,
      detalle,
      valorEmpresaUF,
      valorNaturalUF,
      activo: true,
    },
  });

  revalidatePath("/propuestas/catalogo");
  revalidatePath("/propuestas/nueva");
}

export async function crearServicioAction(formData: FormData) {
  await requireAuth();

  const nombre = formData.get("nombre")?.toString().trim();
  const descripcion = formData.get("descripcion")?.toString().trim() || null;
  const tipo = formData.get("tipo")?.toString().trim() || "con_clave";

  if (!nombre) return;

  await prisma.servicio.create({
    data: {
      nombre,
      descripcion,
      tipo,
      activo: true,
    },
  });

  revalidatePath("/propuestas/catalogo");
  revalidatePath("/propuestas/nueva");
}

export async function toggleActivoPlanAction(planId: string, estadoActual: boolean) {
  await requireAuth();

  await prisma.plan.update({
    where: { id: planId },
    data: { activo: !estadoActual },
  });

  revalidatePath("/propuestas/catalogo");
}

export async function toggleActivoServicioAction(servicioId: string, estadoActual: boolean) {
  await requireAuth();

  await prisma.servicio.update({
    where: { id: servicioId },
    data: { activo: !estadoActual },
  });

  revalidatePath("/propuestas/catalogo");
}
