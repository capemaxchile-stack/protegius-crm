const { PrismaClient, UserRole } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed automático de datos para Protegius CRM...");

  // 1. Crear Usuario Administrador inicial
  const adminEmail = "admin@protegius.cl";
  let admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!admin) {
    const passwordHash = await bcrypt.hash("Protegius2026!", 10);
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Administrador Protegius",
        passwordHash,
        role: "ADMIN",
        active: true,
      },
    });
    console.log(`✓ Administrador creado: ${admin.email}`);
  } else {
    console.log(`- Administrador ya existe: ${admin.email}`);
  }

  // 2. Crear Ejecutivo Comercial inicial
  const comercialEmail = "comercial@protegius.cl";
  let comercial = await prisma.user.findUnique({
    where: { email: comercialEmail },
  });

  if (!comercial) {
    const passwordHash = await bcrypt.hash("Protegius2026!", 10);
    comercial = await prisma.user.create({
      data: {
        email: comercialEmail,
        name: "Claudio Palacios",
        passwordHash,
        role: "COMERCIAL",
        active: true,
      },
    });
    console.log(`✓ Ejecutivo comercial creado: ${comercial.email}`);
  }

  // 3. Crear Catálogo Base de Servicios y Planes para Propuestas
  const existingGrupos = await prisma.grupoPlan.count();
  if (existingGrupos === 0) {
    await prisma.grupoPlan.create({
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

    await prisma.grupoPlan.create({
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

    console.log("✓ Catálogo de planes creado.");
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

  // 4. Crear Negocios, Cuentas y Casos Demostrativos si está vacío
  const totalCuentas = await prisma.cuenta.count();
  if (totalCuentas === 0) {
    console.log("Creando datos de demostración para empresas y negocios en UF...");

    // Cuenta 1: Minera del Norte
    const c1 = await prisma.cuenta.create({
      data: {
        razonSocial: "Inversiones y Servicios Mineros del Norte SpA",
        rut: "76.994.512-1",
        rubro: "Minería y Maquinaria",
        etapa: "cliente",
        responsableId: comercial.id,
        afiliaciones: {
          create: {
            persona: {
              create: {
                nombre: "Rodrigo Sepúlveda",
                email: "rsepulveda@mineranorte.cl",
                telefono: "+56987654321",
                cargo: "Director de Operaciones",
              },
            },
            cargo: "Director de Operaciones",
            esPrincipal: true,
            activa: true,
          },
        },
      },
    });

    // Oportunidad Ganada para Cuenta 1
    const op1 = await prisma.oportunidad.create({
      data: {
        cuentaId: c1.id,
        nombre: "Suscripción Anual Protegius Corporativo + Due Diligence",
        etapa: "aprobacion_comercial",
        estado: "ganada",
        valorEstimado: 216.0,
        probabilidad: 100,
        responsableId: comercial.id,
        fechaCierreReal: new Date(),
      },
    });

    // Propuesta Formal Aceptada
    const prop1 = await prisma.propuesta.create({
      data: {
        numero: "2026-001",
        cuentaId: c1.id,
        oportunidadId: op1.id,
        clienteRazonSocial: c1.razonSocial,
        clienteRut: c1.rut,
        clienteGiro: c1.rubro,
        clienteContacto: "Rodrigo Sepúlveda",
        clienteEmail: "rsepulveda@mineranorte.cl",
        clienteTelefono: "+56987654321",
        vigenciaDias: 30,
        estado: "aceptada",
        setupValorUF: 10.0,
        setupDescuentoPct: 50.0,
        planes: {
          create: [
            {
              grupoNombre: "Informes con Clave Tributaria (SII)",
              planNombre: "Plan Corporativo",
              detalle: "Informes ilimitados · Usuarios ilimitados",
              valorOriginal: 18.0,
              descuentoPct: 0,
              valorFinal: 18.0,
            },
          ],
        },
        servicios: {
          create: [
            {
              nombre: "Informe Comercial Completo (Persona Jurídica)",
              descripcion: "Análisis patrimonial, litigios y riesgo comercial.",
              tipo: "con_clave",
            },
            {
              nombre: "Informe de Cumplimiento y Due Diligence",
              descripcion: "Verificación en listas sancionatorias y PEPs.",
              tipo: "con_clave",
            },
          ],
        },
      },
    });

    // Contrato Firmado
    const cont1 = await prisma.contrato.create({
      data: {
        numero: "2026-001",
        nombre: "Contrato de Prestación de Servicios de Inteligencia Comercial",
        tipo: "prestacion_servicios",
        estado: "firmado",
        cuentaId: c1.id,
        oportunidadId: op1.id,
        propuestaId: prop1.id,
        responsableId: comercial.id,
        valor: 18.0,
        moneda: "UF",
        fechaFirma: new Date(),
        firmantes: {
          create: [
            {
              nombre: "Rodrigo Sepúlveda",
              email: "rsepulveda@mineranorte.cl",
              cargo: "Director de Operaciones",
              rol: "Representante Legal",
              estadoFirma: "firmado",
            },
          ],
        },
      },
    });

    // Onboarding en Proceso (Hitos 1, 2 y 3 completados)
    await prisma.onboardingCliente.create({
      data: {
        cuentaId: c1.id,
        contratoId: cont1.id,
        oportunidadId: op1.id,
        responsableId: comercial.id,
        estado: "en_proceso",
        fechaInicio: new Date(),
        observaciones: "Onboarding generado automáticamente al firmar contrato CONT-2026-001",
        pasos: {
          create: [
            {
              titulo: "1. Recepción de Antecedentes Legales y Tributarios",
              descripcion: "Copia de e-RUT, escritura de constitución y poder de representación.",
              orden: 1,
              estado: "completado",
              completadoEn: new Date(),
            },
            {
              titulo: "2. Creación y Configuración de Credenciales Protegius",
              descripcion: "Alta de usuarios autorizados y claves de consulta en la plataforma.",
              orden: 2,
              estado: "completado",
              completadoEn: new Date(),
            },
            {
              titulo: "3. Capacitación de Usuarios Clave",
              descripcion: "Sesión remota de inducción a la plataforma para el equipo del cliente.",
              orden: 3,
              estado: "completado",
              completadoEn: new Date(),
            },
            {
              titulo: "4. Pase a Producción y Emisión de Primer Informe",
              descripcion: "Confirmación de primer informe de prueba exitoso y habilitación final.",
              orden: 4,
              estado: "pendiente",
            },
          ],
        },
        servicios: {
          create: [
            {
              cuentaId: c1.id,
              contratoId: cont1.id,
              propuestaId: prop1.id,
              responsableId: comercial.id,
              estado: "activo",
              montoRecurrente: 18.0,
              moneda: "UF",
              observaciones: "Plan contratado: Plan Corporativo (Informes con Clave SII)",
            },
          ],
        },
      },
    });

    // Cuenta 2: Logística TransAndina
    const c2 = await prisma.cuenta.create({
      data: {
        razonSocial: "Logística y Transportes TransAndina S.A.",
        rut: "77.109.845-K",
        rubro: "Transporte y Comercio Exterior",
        etapa: "oportunidad",
        responsableId: comercial.id,
        afiliaciones: {
          create: {
            persona: {
              create: {
                nombre: "Camila Valenzuela",
                email: "cvalenzuela@transandina.cl",
                telefono: "+56912345678",
                cargo: "Jefa de Riesgo y Crédito",
              },
            },
            cargo: "Jefa de Riesgo y Crédito",
            esPrincipal: true,
            activa: true,
          },
        },
      },
    });

    // Oportunidad en Negociación
    await prisma.oportunidad.create({
      data: {
        cuentaId: c2.id,
        nombre: "Evaluación Masiva de Transportistas Subcontratados",
        etapa: "negociacion",
        estado: "abierta",
        valorEstimado: 96.0,
        probabilidad: 70,
        responsableId: comercial.id,
      },
    });

    // Registrar actividades comerciales recientes
    await prisma.actividad.createMany({
      data: [
        {
          cuentaId: c1.id,
          usuarioId: comercial.id,
          tipo: "reunion",
          descripcion: "Reunión de cierre de propuesta y revisión de cláusulas del contrato.",
          responsable: comercial.name,
        },
        {
          cuentaId: c2.id,
          usuarioId: comercial.id,
          tipo: "llamada",
          descripcion: "Llamada con Camila Valenzuela para afinar el alcance de informes tributarios SII.",
          proximoPaso: "Enviar propuesta formal con descuento del 10%",
          fechaProximoPaso: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          estadoPaso: "pendiente",
          responsable: comercial.name,
        },
      ],
    });

    console.log("✓ Datos de demostración creados exitosamente.");
  }

  console.log("Seed completado exitosamente.");
}

main()
  .catch((e) => {
    console.error("Error durante seed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
