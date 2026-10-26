const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("=== Ejecutando auto-migración segura de PostgreSQL ===");
  try {
    // 1. Agregar columnas telefono y cargo si no existen
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "telefono" TEXT;`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cargo" TEXT;`
    );
    console.log("✓ Columnas users.telefono y users.cargo verificadas");

    // 2. Agregar valores enum UserRole si no existen
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
    console.log("✓ Valores de UserRole verificados");

    // 3. Crear tabla crm_system_config si no existe
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS crm_system_config (
        id TEXT PRIMARY KEY,
        config_json TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✓ Tabla crm_system_config verificada");

  } catch (err) {
    console.error("Error durante auto-migración SQL:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
