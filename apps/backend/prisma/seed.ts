import { PrismaClient, Role, PropertyType, PropertyStatus, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

const DEFAULT_PIPELINE_STAGES = [
  { name: 'Lead', order: 1, color: '#6366f1', isDefault: true, probability: 10, description: 'Primer contacto con el prospecto' },
  { name: 'Oportunidad', order: 2, color: '#f59e0b', isDefault: false, probability: 30, description: 'Interés confirmado, mostrando propiedades' },
  { name: 'Calificación', order: 3, color: '#3b82f6', isDefault: false, probability: 60, description: 'Negociación activa, revisando condiciones' },
  { name: 'Cierre', order: 4, color: '#10b981', isDefault: false, probability: 90, description: 'Proceso de cierre y firma de contrato' },
];

async function main(): Promise<void> {
  console.log('🌱 Iniciando seed...');

  const tenantSlug = 'homematch';
  const adminEmail = 'admin@homematchinmobiliaria.com';
  const adminPassword = 'Homematch2024!';

  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  });

  if (existingTenant) {
    console.log(`✓ Tenant '${tenantSlug}' ya existe. Omitiendo seed.`);
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);

  const vendedorPassword = 'Vendedor2024!';
  const vendedorHash = await bcrypt.hash(vendedorPassword, BCRYPT_ROUNDS);

  const tenant = await prisma.tenant.create({
    data: {
      name: 'Inmobiliaria Homematch',
      slug: tenantSlug,
      users: {
        createMany: {
          data: [
            {
              name: 'Administrador',
              email: adminEmail,
              password: passwordHash,
              role: Role.ADMIN,
            },
            {
              name: 'Carlos Vendedor',
              email: 'vendedor1@homematchinmobiliaria.com',
              password: vendedorHash,
              role: Role.VENDEDOR,
            },
            {
              name: 'María Vendedora',
              email: 'vendedor2@homematchinmobiliaria.com',
              password: vendedorHash,
              role: Role.VENDEDOR,
            },
          ],
        },
      },
      pipelineStages: {
        createMany: { data: DEFAULT_PIPELINE_STAGES },
      },
    },
    include: {
      users: { select: { id: true, email: true, role: true } },
      pipelineStages: { select: { id: true, name: true, order: true } },
    },
  });

  const admin = tenant.users.find((u) => u.role === Role.ADMIN)!;

  await prisma.property.createMany({
    data: [
      {
        tenantId: tenant.id,
        createdById: admin.id,
        title: 'Casa en Cumbayá con jardín',
        description: 'Hermosa casa de dos plantas con jardín amplio y piscina en conjunto privado.',
        type: PropertyType.CASA,
        status: PropertyStatus.DISPONIBLE,
        price: 285000,
        currency: 'USD',
        area: 180,
        bedrooms: 3,
        bathrooms: 3,
        parking: 2,
        address: 'Urb. San Francisco, Calle Principal',
        city: 'Quito',
        sector: 'Cumbayá',
        lat: -0.1865,
        lng: -78.4357,
        features: ['Piscina', 'Jardín', 'Conjunto privado', 'Guardianía 24h', 'BBQ'],
        images: [],
      },
      {
        tenantId: tenant.id,
        createdById: admin.id,
        title: 'Apartamento moderno en La Carolina',
        description: 'Apartamento de 2 dormitorios frente al Parque La Carolina, acabados de lujo.',
        type: PropertyType.APARTAMENTO,
        status: PropertyStatus.DISPONIBLE,
        price: 145000,
        currency: 'USD',
        area: 85,
        bedrooms: 2,
        bathrooms: 2,
        parking: 1,
        address: 'Av. República del Salvador',
        city: 'Quito',
        sector: 'La Carolina',
        lat: -0.1807,
        lng: -78.4850,
        features: ['Vista al parque', 'Gimnasio', 'Sala comunal', 'Ascensor'],
        images: [],
      },
      {
        tenantId: tenant.id,
        createdById: admin.id,
        title: 'Terreno en Tumbaco para construcción',
        description: 'Terreno plano de 500m² con todos los servicios, ideal para construir casa o duplex.',
        type: PropertyType.TERRENO,
        status: PropertyStatus.DISPONIBLE,
        price: 95000,
        currency: 'USD',
        area: 500,
        bedrooms: null,
        bathrooms: null,
        parking: null,
        address: 'Calle Guápulo y Av. Interoceánica',
        city: 'Quito',
        sector: 'Tumbaco',
        lat: -0.2089,
        lng: -78.3982,
        features: ['Escritura lista', 'Todos los servicios', 'Terreno plano', 'Acceso vehicular'],
        images: [],
      },
    ],
  });

  // ── Loss reasons ────────────────────────────────────────────────────────────
  const stages = tenant.pipelineStages as Array<{ id: string; name: string; order: number }>;

  await prisma.lossReason.createMany({
    data: [
      { tenantId: tenant.id, name: 'Precio fuera de presupuesto' },
      { tenantId: tenant.id, name: 'Compró con otra agencia' },
      { tenantId: tenant.id, name: 'No encontró la propiedad ideal' },
      { tenantId: tenant.id, name: 'Cambio de plans personales' },
      { tenantId: tenant.id, name: 'Sin respuesta del cliente' },
    ],
  });

  // ── Stage checklists ────────────────────────────────────────────────────────
  const stageMap = new Map(stages.map((s) => [s.name, s.id]));

  const leadStageId = stageMap.get('Lead');
  const oportunidadStageId = stageMap.get('Oportunidad');
  const calificacionStageId = stageMap.get('Calificación');
  const cierreStageId = stageMap.get('Cierre');

  const checklistData: { stageId: string; text: string; order: number }[] = [];

  if (leadStageId) {
    checklistData.push(
      { stageId: leadStageId, text: 'Verificar número de teléfono', order: 1 },
      { stageId: leadStageId, text: 'Registrar fuente del lead', order: 2 },
      { stageId: leadStageId, text: 'Primer contacto realizado', order: 3 },
    );
  }
  if (oportunidadStageId) {
    checklistData.push(
      { stageId: oportunidadStageId, text: 'Identificar tipo de propiedad buscada', order: 1 },
      { stageId: oportunidadStageId, text: 'Definir presupuesto del cliente', order: 2 },
      { stageId: oportunidadStageId, text: 'Agendar visita a propiedades', order: 3 },
      { stageId: oportunidadStageId, text: 'Enviar lista de propiedades sugeridas', order: 4 },
    );
  }
  if (calificacionStageId) {
    checklistData.push(
      { stageId: calificacionStageId, text: 'Visita a propiedad completada', order: 1 },
      { stageId: calificacionStageId, text: 'Propuesta económica enviada', order: 2 },
      { stageId: calificacionStageId, text: 'Verificar capacidad de financiamiento', order: 3 },
    );
  }
  if (cierreStageId) {
    checklistData.push(
      { stageId: cierreStageId, text: 'Promesa de compraventa firmada', order: 1 },
      { stageId: cierreStageId, text: 'Documentos legales en orden', order: 2 },
      { stageId: cierreStageId, text: 'Escritura notariada', order: 3 },
      { stageId: cierreStageId, text: 'Pago final recibido', order: 4 },
    );
  }

  if (checklistData.length > 0) {
    await prisma.stageChecklist.createMany({
      data: checklistData.map((c) => ({ ...c, tenantId: tenant.id })),
    });
  }

  // ── Sample notifications ────────────────────────────────────────────────────
  const vendedor1 = tenant.users.find((u) => u.email === 'vendedor1@homematchinmobiliaria.com')!;
  const vendedor2 = tenant.users.find((u) => u.email === 'vendedor2@homematchinmobiliaria.com')!;

  await prisma.notification.createMany({
    data: [
      {
        tenantId: tenant.id,
        userId: vendedor1.id,
        type: NotificationType.LEAD_INACTIVE,
        title: 'Lead inactivo',
        message: 'Juan Pérez lleva más de 3 días sin actividad.',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        tenantId: tenant.id,
        userId: vendedor1.id,
        type: NotificationType.ACTION_OVERDUE,
        title: 'Acción vencida',
        message: 'La próxima acción de María López está vencida.',
        isRead: false,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
      {
        tenantId: tenant.id,
        userId: vendedor1.id,
        type: NotificationType.MEETING_REMINDER,
        title: 'Recordatorio de reunión',
        message: '"Visita a propiedad Cumbayá" comienza en 45 minutos.',
        isRead: true,
        readAt: new Date(Date.now() - 30 * 60 * 1000),
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        tenantId: tenant.id,
        userId: vendedor2.id,
        type: NotificationType.LEAD_UNCONTACTED,
        title: 'Lead sin contactar',
        message: 'Carlos Gómez lleva más de 1 día sin ser contactado.',
        isRead: false,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        tenantId: tenant.id,
        userId: admin.id,
        type: NotificationType.LEAD_INACTIVE,
        title: 'Lead inactivo',
        message: 'Ana Torres lleva más de 3 días sin actividad.',
        isRead: false,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
    ],
  });

  console.log(`✓ Tenant creado: ${tenant.name} (slug: ${tenant.slug})`);
  console.log(`✓ Admin creado: ${admin.email}`);
  console.log(`✓ Vendedores creados: vendedor1@homematchinmobiliaria.com, vendedor2@homematchinmobiliaria.com`);
  console.log(`✓ Etapas de pipeline creadas: ${tenant.pipelineStages.map((s) => s.name).join(', ')}`);
  console.log(`✓ 3 propiedades de ejemplo creadas`);
  console.log(`✓ 5 motivos de pérdida creados`);
  console.log(`✓ Checklists de etapas creados`);
  console.log(`✓ 5 notificaciones de prueba creadas`);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Credenciales de acceso:');
  console.log(`  Email:    ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
  console.log(`  Slug:     ${tenantSlug}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
