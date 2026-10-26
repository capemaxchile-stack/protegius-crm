#!/bin/sh
set -e

echo "=== Protegius CRM: Inicializando Base de Datos ==="

# Auto-migración segura de PostgreSQL
echo "Aplicando auto-migración de esquema..."
node prisma/auto-migrate.js || true

# Sincronizar esquema de base de datos con Prisma
echo "Sincronizando esquema con Prisma..."
if [ -f "./node_modules/.bin/prisma" ]; then
  ./node_modules/.bin/prisma db push --skip-generate --accept-data-loss || true
else
  npx prisma db push --skip-generate --accept-data-loss || true
fi

echo "Ejecutando seed de usuarios y catálogo..."
node prisma/seed.js || true

echo "=== Iniciando Servidor Next.js ==="
exec node server.js
