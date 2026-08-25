import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed de datos para Protegius CRM...");

  // 1. Crear Usuario Administrador inicial
  const adminEmail = "admin@protegius.cl";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("Protegius2026!", 10);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Administrador Protegius",
        passwordHash,
        role: UserRole.ADMIN,
        active: true,
      },
    });
    console.log(`✓ Administrador creado: ${admin.email}`);
  } else {
    console.log(`- Administrador ya existe: ${existingAdmin.email}`);
  }

  // 2. Crear Ejecutivo Comercial inicial
  const comercialEmail = "comercial@protegius.cl";
  const existingComercial = await prisma.user.findUnique({
    where: { email: comercialEmail },
  });

  if (!existingComercial) {
    const passwordHash = await bcrypt.hash("Protegius2026!", 10);
    const comercial = await prisma.user.create({
      data: {
        email: comercialEmail,
        name: "Ejecutivo Comercial",
        passwordHash,
        role: UserRole.COMERCIAL,
        active: true,
      },
    });
    console.log(`✓ Ejecutivo comercial creado: ${comercial.email}`);
  }

  // 3. Crear Catálogo Base de Servicios y Planes para Propuestas
  const existingGrupos = await prisma.grupoPlan.count();
  if (existingGrupos === 0) {
    const grupoConClave = await prisma.grupoPlan.create({
      data: {
        nombre: "Informes con Clave Tributaria (SII)",
        orden: 1,
        planes: {
          create: [
            {
              nombre: "Plan Base Pyme",
              detalle: "Hasta 15 informes/mes · 2 usuarios",
              valorEmpresaUF: 3.5,
              valorNaturalUF: 2.0,
            },
            {
              nombre: "Plan Empresa Pro",
              detalle: "Hasta 50 informes/mes · 5 usuarios",
              valorEmpresaUF: 8.0,
              valorNaturalUF: 4.5,
            },
            {
              nombre: "Plan Corporativo",
              detalle: "Informes ilimitados · Usuarios ilimitados",
              valorEmpresaUF: 18.0,
              valorNaturalUF: 10.0,
            },
          ],
        },
      },
    });

    const grupoExpress = await prisma.grupoPlan.create({
      data: {
        nombre: "Informes Express (Sin Clave)",
        orden: 2,
        planes: {
          create: [
            {
              nombre: "Plan Express 10",
              detalle: "10 consultas rápidas",
              valorEmpresaUF: 1.5,
            },
            {
              nombre: "Plan Express 50",
              detalle: "50 consultas rápidas",
              valorEmpresaUF: 5.0,
            },
          ],
        },
      },
    });

    console.log("✓ Catálogo de planes creado:", [grupoConClave.nombre, grupoExpress.nombre]);
  }

  const existingServicios = await prisma.servicio.count();
  if (existingServicios === 0) {
    await prisma.servicio.createMany({
      data: [
        {
          nombre: "Informe Comercial Completo (Persona Jurídica)",
          descripcion: "Análisis patrimonial, litigios, comportamiento tributario y riesgo comercial.",
          tipo: "con_clave",
        },
        {
          nombre: "Informe de Cumplimiento y Due Diligence",
          descripcion: "Verificación en listas sancionatorias, PEPs, socios y beneficiarios finales.",
          tipo: "con_clave",
        },
        {
          nombre: "Verificación Express de Proveedores",
          descripcion: "Validación instantánea de situación judicial y alertas básicas.",
          tipo: "express",
        },
      ],
    });
    console.log("✓ Catálogo de servicios creado.");
  }

  console.log("Seed completado exitosamente.");
}

main()
  .catch((e) => {
    console.error("Error durante seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
