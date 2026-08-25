#!/bin/sh
set -e

echo "=== Protegius CRM: Inicializando Base de Datos ==="

# Esperar a que la base de datos PostgreSQL esté lista
echo "Sincronizando esquema de base de datos..."
npx prisma db push --skip-generate || true

echo "Ejecutando seed de usuarios y catálogo..."
node prisma/seed.js || true

echo "=== Iniciando Servidor Next.js ==="
exec node server.js
