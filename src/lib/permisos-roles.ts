"use server";

import { prisma } from "@/lib/prisma";
import { UserRole, PERMISOS_DEFAULT_POR_ROL } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";

export type MatrizPermisos = Record<UserRole, string[]>;

async function ensureConfigTable(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS crm_system_config (
        id TEXT PRIMARY KEY,
        config_json TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
  } catch (err) {
    console.error("Error asegurando tabla crm_system_config:", err);
  }
}

export async function obtenerMatrizPermisosAsync(): Promise<MatrizPermisos> {
  try {
    await ensureConfigTable();
    const rows = await prisma.$queryRawUnsafe<Array<{ config_json: string }>>(
      `SELECT config_json FROM crm_system_config WHERE id = 'permisos_roles' LIMIT 1;`
    );
    if (rows && rows.length > 0 && rows[0].config_json) {
      const parsed = JSON.parse(rows[0].config_json) as Partial<MatrizPermisos>;
      return {
        ...PERMISOS_DEFAULT_POR_ROL,
        ...parsed,
      };
    }
  } catch (err) {
    console.error("Error consultando matriz de permisos en base de datos:", err);
  }
  return PERMISOS_DEFAULT_POR_ROL;
}

export async function guardarMatrizPermisosAction(
  matriz: MatrizPermisos
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await ensureConfigTable();

    // ADMIN siempre debe conservar acceso a la administración de usuarios
    if (!matriz.ADMIN.includes("usuarios")) {
      matriz.ADMIN.push("usuarios");
    }

    const jsonStr = JSON.stringify(matriz);

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO crm_system_config (id, config_json, updated_at)
      VALUES ('permisos_roles', $1, NOW())
      ON CONFLICT (id) DO UPDATE
      SET config_json = EXCLUDED.config_json,
          updated_at = NOW();
      `,
      jsonStr
    );

    return { success: true };
  } catch (err) {
    console.error("Error guardando matriz de permisos:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al guardar permisos",
    };
  }
}
