"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

export interface ContratoActionState {
  error?: string;
  success?: boolean;
  contratoId?: string;
}

export async function crearContratoAction(
  prevState: ContratoActionState | null,
  formData: FormData
): Promise<ContratoActionState> {
  const currentUser = await requireAuth();

  const cuentaId = formData.get("cuentaId")?.toString().trim();
  const propuestaId = formData.get("propuestaId")?.toString().trim() || null;
  const oportunidadId = formData.get("oportunidadId")?.toString().trim() || null;
  const nombre = formData.get("nombre")?.toString().trim();
  const tipo = formData.get("tipo")?.toString() || "prestacion_servicios";
  const rawValor = formData.get("valor")?.toString().trim() || "0";
  const valor = parseFloat(rawValor.replace(",", ".")) || 0;
  const observaciones = formData.get("observaciones")?.toString().trim() || null;

  const rawFirmantes = formData.get("firmantes")?.toString();

  if (!cuentaId || !nombre) {
    return { error: "La cuenta y el nombre del contrato son obligatorios." };
  }

  let firmantes: {
    nombre: string;
    email: string | null;
    cargo: string | null;
    rol: string | null;
  }[] = [];

  try {
    if (rawFirmantes) firmantes = JSON.parse(rawFirmantes);
  } catch {
    return { error: "Error al procesar los firmantes del contrato." };
  }

  let contratoCreadoId = "";

  try {
    const year = new Date().getFullYear();
    const totalContratosYear = await prisma.contrato.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
        },
      },
    });

    const numeroCorrelativo = `${year}-${String(totalContratosYear + 1).padStart(3, "0")}`;

    const contrato = await prisma.contrato.create({
      data: {
        numero: numeroCorrelativo,
        nombre,
        tipo,
        estado: "borrador",
        cuentaId,
        oportunidadId,
        propuestaId,
        responsableId: currentUser.id,
        valor,
        moneda: "UF",
        observaciones,
        firmantes: {
          create: firmantes.map((f) => ({
            nombre: f.nombre,
            email: f.email,
            cargo: f.cargo,
            rol: f.rol || "Representante Legal",
            estadoFirma: "pendiente",
          })),
        },
      },
    });

    contratoCreadoId = contrato.id;

    revalidatePath("/contratos");
    revalidatePath(`/cuentas/${cuentaId}`);
  } catch (err) {
    console.error("Error al crear contrato:", err);
    return { error: "No se pudo registrar el contrato." };
  }

  redirect(`/contratos/${contratoCreadoId}`);
}

export async function cambiarEstadoContratoAction(
  contratoId: string,
  nuevoEstado: "borrador" | "enviado" | "en_revision" | "firmado" | "rechazado"
) {
  const currentUser = await requireAuth();

  const contrato = await prisma.contrato.findUnique({
    where: { id: contratoId },
    include: {
      cuenta: true,
      propuesta: {
        include: {
          planes: true,
          servicios: true,
        },
      },
    },
  });

  if (!contrato) return;

  const dataToUpdate: Prisma.ContratoUpdateInput = { estado: nuevoEstado };
  if (nuevoEstado === "firmado") {
    dataToUpdate.fechaFirma = new Date();
  }

  await prisma.$transaction(async (tx) => {
    await tx.contrato.update({
      where: { id: contratoId },
      data: dataToUpdate,
    });

    // Si el contrato se firma, inicializar automáticamente el flujo de Onboarding
    if (nuevoEstado === "firmado") {
      const existeOnboarding = await tx.onboardingCliente.findFirst({
        where: { contratoId },
      });

      if (!existeOnboarding) {
        const onboarding = await tx.onboardingCliente.create({
          data: {
            cuentaId: contrato.cuentaId,
            contratoId: contrato.id,
            oportunidadId: contrato.oportunidadId,
            responsableId: currentUser.id,
            estado: "en_proceso",
            fechaInicio: new Date(),
            observaciones: `Onboarding generado automáticamente al firmar contrato CONT-${contrato.numero}`,
            pasos: {
              create: [
                {
                  titulo: "1. Recepción de Antecedentes Legales y Tributarios",
                  descripcion: "Copia de e-RUT, escritura de constitución y poder de representación.",
                  orden: 1,
                  estado: "pendiente",
                },
                {
                  titulo: "2. Creación y Configuración de Credenciales Protegius",
                  descripcion: "Alta de usuarios autorizados y claves de consulta en la plataforma.",
                  orden: 2,
                  estado: "pendiente",
                },
                {
                  titulo: "3. Capacitación de Usuarios Clave",
                  descripcion: "Sesión remota de inducción a la plataforma para el equipo del cliente.",
                  orden: 3,
                  estado: "pendiente",
                },
                {
                  titulo: "4. Pase a Producción y Emisión de Primer Informe",
                  descripcion: "Confirmación de primer informe de prueba exitoso y habilitación final.",
                  orden: 4,
                  estado: "pendiente",
                },
              ],
            },
          },
        });

        // Crear servicios recurrentes a partir de la propuesta si existía
        if (contrato.propuesta && contrato.propuesta.planes.length > 0) {
          for (const plan of contrato.propuesta.planes) {
            await tx.servicioCliente.create({
              data: {
                cuentaId: contrato.cuentaId,
                contratoId: contrato.id,
                propuestaId: contrato.propuestaId,
                onboardingId: onboarding.id,
                responsableId: currentUser.id,
                estado: "en_revision",
                montoRecurrente: plan.valorFinal,
                moneda: "UF",
                observaciones: `Plan contratado: ${plan.planNombre} (${plan.grupoNombre})`,
              },
            });
          }
        }
      }
    }
  });

  revalidatePath(`/contratos/${contratoId}`);
  revalidatePath("/contratos");
  revalidatePath("/onboarding");
}

export async function toggleFirmaFirmanteAction(firmanteId: string, contratoId: string, estadoActual: string) {
  await requireAuth();

  const nuevoEstado = estadoActual === "firmado" ? "pendiente" : "firmado";

  await prisma.firmanteContrato.update({
    where: { id: firmanteId },
    data: { estadoFirma: nuevoEstado },
  });

  revalidatePath(`/contratos/${contratoId}`);
}
