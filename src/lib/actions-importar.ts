"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validarRUT, formatearRUT } from "@/lib/rut";
import { revalidatePath } from "next/cache";

export interface FilaImportacion {
  razonSocial: string;
  rut?: string;
  rubro?: string;
  nombreContacto?: string;
  emailContacto?: string;
  telefonoContacto?: string;
  cargoContacto?: string;
}

export interface ResultadoImportacion {
  totalProcesados: number;
  creados: number;
  actualizados: number;
  fallidos: number;
  errores: { fila: number; razon: string }[];
}

export async function importarCuentasAction(
  filas: FilaImportacion[]
): Promise<ResultadoImportacion> {
  const currentUser = await requireAuth();

  const resultado: ResultadoImportacion = {
    totalProcesados: filas.length,
    creados: 0,
    actualizados: 0,
    fallidos: 0,
    errores: [],
  };

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];
    const nroFila = i + 1;

    const razonSocial = fila.razonSocial?.trim();
    if (!razonSocial) {
      resultado.fallidos++;
      resultado.errores.push({
        fila: nroFila,
        razon: "La Razón Social es obligatoria.",
      });
      continue;
    }

    let rutLimpio: string | null = null;
    if (fila.rut && fila.rut.trim()) {
      const valid = validarRUT(fila.rut);
      if (!valid) {
        resultado.fallidos++;
        resultado.errores.push({
          fila: nroFila,
          razon: `El RUT "${fila.rut}" no es válido según Módulo 11.`,
        });
        continue;
      }
      rutLimpio = formatearRUT(fila.rut);
    }

    try {
      // Buscar si ya existe por RUT o por Razón Social exacta
      let cuentaExistente = null;
      if (rutLimpio) {
        cuentaExistente = await prisma.cuenta.findFirst({
          where: { rut: rutLimpio },
        });
      }

      if (!cuentaExistente) {
        cuentaExistente = await prisma.cuenta.findFirst({
          where: { razonSocial: { equals: razonSocial, mode: "insensitive" } },
        });
      }

      let cuentaId = "";

      if (cuentaExistente) {
        // Actualizar datos si no estaban completos
        await prisma.cuenta.update({
          where: { id: cuentaExistente.id },
          data: {
            rubro: cuentaExistente.rubro || fila.rubro?.trim() || null,
            rut: cuentaExistente.rut || rutLimpio,
          },
        });
        cuentaId = cuentaExistente.id;
        resultado.actualizados++;
      } else {
        // Crear nueva cuenta
        const nuevaCuenta = await prisma.cuenta.create({
          data: {
            razonSocial,
            rut: rutLimpio,
            rubro: fila.rubro?.trim() || null,
            etapa: "prospecto",
            responsableId: currentUser.id,
          },
        });
        cuentaId = nuevaCuenta.id;
        resultado.creados++;
      }

      // Si viene contacto, agregarlo a la persona / afiliación
      if (fila.nombreContacto && fila.nombreContacto.trim()) {
        const nombreContacto = fila.nombreContacto.trim();
        const email = fila.emailContacto?.trim().toLowerCase() || null;
        const telefono = fila.telefonoContacto?.trim() || null;
        const cargo = fila.cargoContacto?.trim() || null;

        // Buscar persona por email o nombre
        let persona = null;
        if (email) {
          persona = await prisma.persona.findFirst({ where: { email } });
        }
        if (!persona) {
          persona = await prisma.persona.create({
            data: {
              nombre: nombreContacto,
              email,
              telefono,
              cargo,
            },
          });
        }

        // Vincular a la cuenta si no estaba afiliada
        const existeAfiliacion = await prisma.afiliacion.findUnique({
          where: {
            cuentaId_personaId: {
              cuentaId,
              personaId: persona.id,
            },
          },
        });

        if (!existeAfiliacion) {
          const totalAfiliaciones = await prisma.afiliacion.count({
            where: { cuentaId },
          });

          await prisma.afiliacion.create({
            data: {
              cuentaId,
              personaId: persona.id,
              cargo,
              esPrincipal: totalAfiliaciones === 0,
              activa: true,
            },
          });
        }
      }
    } catch (err: unknown) {
      console.error(`Error en fila ${nroFila}:`, err);
      resultado.fallidos++;
      resultado.errores.push({
        fila: nroFila,
        razon: "Error al registrar en la base de datos.",
      });
    }
  }

  revalidatePath("/cuentas");
  revalidatePath("/contactos");
  return resultado;
}
