import { prisma } from "./prisma";

let schemaEnsured = false;
let ensuringPromise: Promise<void> | null = null;

export async function ensureDatabaseSchema(): Promise<void> {
  if (schemaEnsured) return;

  if (ensuringPromise) {
    return ensuringPromise;
  }

  ensuringPromise = (async () => {
    try {
      // 1. Asegurar columnas de User
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "telefono" TEXT;`
      );
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cargo" TEXT;`
      );

      // 2. Asegurar nuevos valores del enum UserRole
      try {
        await prisma.$executeRawUnsafe(
          `ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'GERENTE_GENERAL';`
        );
      } catch (e) {
        // Ignorar si ya existe
      }

      try {
        await prisma.$executeRawUnsafe(
          `ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'GERENTE_COMERCIAL';`
        );
      } catch (e) {
        // Ignorar si ya existe
      }

      // 3. Asegurar tabla crm_system_config
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS crm_system_config (
          id TEXT PRIMARY KEY,
          config_json TEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      schemaEnsured = true;
    } catch (err) {
      console.error("Error asegurando esquema en base de datos:", err);
    } finally {
      ensuringPromise = null;
    }
  })();

  return ensuringPromise;
}
