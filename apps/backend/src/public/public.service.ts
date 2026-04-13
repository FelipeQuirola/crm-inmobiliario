import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, PropertyStatus, LeadSource, PropertyType } from '@prisma/client';
import { ListPublicPropertiesDto } from './dto/list-public-properties.dto';
import { ContactFormDto } from './dto/contact-form.dto';
import { normalizePhone, computeDuplicateHash } from '../leads/helpers/lead.helpers';

const PUBLIC_PROPERTY_SELECT = {
  id: true,
  title: true,
  description: true,
  type: true,
  status: true,
  price: true,
  currency: true,
  area: true,
  bedrooms: true,
  bathrooms: true,
  parking: true,
  address: true,
  city: true,
  sector: true,
  lat: true,
  lng: true,
  features: true,
  images: true,
  createdAt: true,
} satisfies Prisma.PropertySelect;

// ── Text normalization ────────────────────────────────────────────────────────
function normText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Stopwords ─────────────────────────────────────────────────────────────────
const STOPWORDS = new Set([
  // Articles
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  // Prepositions
  'de', 'del', 'en', 'a', 'al', 'por', 'para', 'con',
  'sin', 'sobre', 'entre', 'hacia', 'hasta', 'desde',
  'ante', 'bajo', 'tras', 'durante', 'mediante',
  // Conjunctions
  'y', 'e', 'o', 'u', 'pero', 'sino', 'que', 'si',
  'aunque', 'porque', 'cuando', 'donde', 'como',
  // Pronouns / determiners
  'me', 'te', 'se', 'nos', 'mi', 'tu', 'su', 'mis',
  'tus', 'sus', 'este', 'esta', 'estos', 'estas',
  'ese', 'esa', 'esos', 'esas', 'aquel', 'aquella',
  // Irrelevant verbs
  'busco', 'busca', 'quiero', 'quiere', 'necesito',
  'necesita', 'tengo', 'tiene', 'hay', 'existe',
  'ver', 'veo', 'miro', 'mirar', 'mostrar',
  // Irrelevant adverbs
  'muy', 'mas', 'menos', 'bien', 'aqui', 'ahi',
  'alla', 'cerca', 'lejos', 'nuevo', 'nueva',
  // Generic real-estate words without discriminatory value
  'propiedad', 'propiedades', 'inmueble', 'inmuebles',
  'venta', 'vendo', 'alquiler', 'arriendo',
  'precio', 'costo', 'valor', 'presupuesto',
  'disponible', 'disponibles',
]);

// ── Type dictionary (strict) ──────────────────────────────────────────────────
const TYPE_DICT: Record<string, PropertyType> = {
  // CASA
  casa: PropertyType.CASA, casas: PropertyType.CASA,
  chalet: PropertyType.CASA, villa: PropertyType.CASA, residencia: PropertyType.CASA,
  // APARTAMENTO
  apartamento: PropertyType.APARTAMENTO, apartamentos: PropertyType.APARTAMENTO,
  apto: PropertyType.APARTAMENTO, aptos: PropertyType.APARTAMENTO,
  departamento: PropertyType.APARTAMENTO, departamentos: PropertyType.APARTAMENTO,
  depto: PropertyType.APARTAMENTO, piso: PropertyType.APARTAMENTO,
  flat: PropertyType.APARTAMENTO, suite: PropertyType.APARTAMENTO,
  loft: PropertyType.APARTAMENTO, estudio: PropertyType.APARTAMENTO,
  // TERRENO
  terreno: PropertyType.TERRENO, terrenos: PropertyType.TERRENO,
  lote: PropertyType.TERRENO, lotes: PropertyType.TERRENO,
  solar: PropertyType.TERRENO, parcela: PropertyType.TERRENO, predio: PropertyType.TERRENO,
  // OFICINA
  oficina: PropertyType.OFICINA, oficinas: PropertyType.OFICINA,
  despacho: PropertyType.OFICINA, consultorio: PropertyType.OFICINA,
  // LOCAL
  local: PropertyType.LOCAL, locales: PropertyType.LOCAL,
  comercial: PropertyType.LOCAL, tienda: PropertyType.LOCAL, negocio: PropertyType.LOCAL,
  // BODEGA
  bodega: PropertyType.BODEGA, bodegas: PropertyType.BODEGA,
  deposito: PropertyType.BODEGA, depositos: PropertyType.BODEGA,
  almacen: PropertyType.BODEGA, almacenes: PropertyType.BODEGA,
  galpon: PropertyType.BODEGA, galpones: PropertyType.BODEGA,
};

// ── City dictionary ───────────────────────────────────────────────────────────
const CITY_DICT: Record<string, string> = {
  quito: 'Quito', dmd: 'Quito',
  guayaquil: 'Guayaquil', guaya: 'Guayaquil',
  cuenca: 'Cuenca',
  ambato: 'Ambato',
  manta: 'Manta',
  loja: 'Loja',
};

// ── Sector dictionaries ───────────────────────────────────────────────────────
// token → canonical zone name
const SECTOR_TOKENS_MAP: Record<string, string> = {
  norte: 'norte', carolina: 'norte', inaquito: 'norte', republica: 'norte',
  cotocollao: 'norte', condado: 'norte', carcelen: 'norte',
  sur: 'sur', quitumbe: 'sur', solanda: 'sur', chillogallo: 'sur',
  turubamba: 'sur', guamani: 'sur',
  valle: 'valle', cumbaya: 'valle', tumbaco: 'valle', chillos: 'valle',
  sangolqui: 'valle', conocoto: 'valle', guangopolo: 'valle',
  centro: 'centro', historico: 'centro',
  gonzalez: 'gonzalez suarez',
  floresta: 'floresta',
  mariscal: 'mariscal',
  bellavista: 'bellavista',
};

// zone → search terms to look for in property fields
const SECTOR_SEARCH_TERMS: Record<string, string[]> = {
  norte: ['norte', 'carolina', 'inaquito', 'republica', 'cotocollao', 'condado', 'carcelen'],
  sur: ['sur', 'quitumbe', 'solanda', 'chillogallo', 'turubamba', 'guamani'],
  valle: ['valle', 'cumbaya', 'tumbaco', 'chillos', 'sangolqui', 'conocoto', 'guangopolo'],
  centro: ['centro', 'historico', 'ronda'],
  'gonzalez suarez': ['gonzalez', 'suarez'],
  floresta: ['floresta'],
  mariscal: ['mariscal'],
  bellavista: ['bellavista'],
};

// Human-readable labels for message building
const TYPE_LABEL_PLURAL: Record<string, string> = {
  CASA: 'casas', APARTAMENTO: 'departamentos', TERRENO: 'terrenos',
  OFICINA: 'oficinas', LOCAL: 'locales comerciales', BODEGA: 'bodegas',
};
const TYPE_LABEL_SINGULAR: Record<string, string> = {
  CASA: 'Casa', APARTAMENTO: 'Departamento', TERRENO: 'Terreno',
  OFICINA: 'Oficina', LOCAL: 'Local Comercial', BODEGA: 'Bodega',
};

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Resolve tenant by slug ─────────────────────────────────────────────────

  private async resolveTenant(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new NotFoundException(`Tenant "${slug}" no encontrado`);
    return tenant;
  }

  // ── Properties list ────────────────────────────────────────────────────────

  async listProperties(dto: ListPublicPropertiesDto) {
    const tenant = await this.resolveTenant(dto.slug);

    const take = dto.take ?? 12;
    const skip = dto.skip ?? 0;

    const where: Prisma.PropertyWhereInput = {
      tenantId: tenant.id,
      deletedAt: null,
      status: PropertyStatus.DISPONIBLE,
      ...(dto.type && { type: dto.type }),
      ...(dto.city && { city: { contains: dto.city, mode: 'insensitive' } }),
      ...(dto.search && {
        OR: [
          { title:       { contains: dto.search, mode: 'insensitive' } },
          { address:     { contains: dto.search, mode: 'insensitive' } },
          { sector:      { contains: dto.search, mode: 'insensitive' } },
          { city:        { contains: dto.search, mode: 'insensitive' } },
          { description: { contains: dto.search, mode: 'insensitive' } },
        ],
      }),
      ...(dto.priceMin != null || dto.priceMax != null
        ? {
            price: {
              ...(dto.priceMin != null && { gte: dto.priceMin }),
              ...(dto.priceMax != null && { lte: dto.priceMax }),
            },
          }
        : {}),
      ...(dto.bedroomsMin != null && { bedrooms: { gte: dto.bedroomsMin } }),
    };

    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        select: PUBLIC_PROPERTY_SELECT,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.property.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  async getProperty(slug: string, id: string) {
    const tenant = await this.resolveTenant(slug);

    const property = await this.prisma.property.findFirst({
      where: { id, tenantId: tenant.id, deletedAt: null, status: PropertyStatus.DISPONIBLE },
      select: PUBLIC_PROPERTY_SELECT,
    });

    if (!property) throw new NotFoundException('Propiedad no encontrada');
    return property;
  }

  // ── RI Search with full NLP pipeline ──────────────────────────────────────

  async searchProperties(slug: string, query: string) {
    const tenant = await this.resolveTenant(slug);
    const baseWhere = { tenantId: tenant.id, deletedAt: null, status: PropertyStatus.DISPONIBLE };

    // Empty query → return all
    if (!query?.trim() || normText(query).length < 2) {
      const [items, total] = await Promise.all([
        this.prisma.property.findMany({
          where: baseWhere, select: PUBLIC_PROPERTY_SELECT,
          orderBy: { createdAt: 'desc' }, take: 12,
        }),
        this.prisma.property.count({ where: baseWhere }),
      ]);
      return {
        items, total,
        resultType: 'exact' as const,
        interpreted: { tipos: [], ciudades: [], sectores: [] },
        message: null,
      };
    }

    // Step 1 — normalize
    const normalized = normText(query);

    // Step 2 — tokenize + remove stopwords
    const rawTokens = normalized.split(' ').filter(t => t.length > 0 && !STOPWORDS.has(t));

    // Step 3 — classify tokens
    const tipos: PropertyType[] = [];
    const ciudades: string[] = [];
    const sectores: string[] = [];
    const textosLibres: string[] = [];

    for (const token of rawTokens) {
      if (TYPE_DICT[token]) {
        const t = TYPE_DICT[token];
        if (!tipos.includes(t)) tipos.push(t);
      } else if (CITY_DICT[token]) {
        const c = CITY_DICT[token];
        if (!ciudades.includes(c)) ciudades.push(c);
      } else if (SECTOR_TOKENS_MAP[token]) {
        const s = SECTOR_TOKENS_MAP[token];
        if (!sectores.includes(s)) sectores.push(s);
      } else if (token.length > 2) {
        textosLibres.push(token);
      }
    }

    // Step 4 — fetch all and score
    const allProps = await this.prisma.property.findMany({
      where: baseWhere, select: PUBLIC_PROPERTY_SELECT,
      orderBy: { createdAt: 'desc' }, take: 200,
    });

    type PropItem = (typeof allProps)[number];

    const scoreProperty = (p: PropItem): number => {
      let score = 0;

      // 1. Type — strict exclusion
      if (tipos.length > 0) {
        if (!tipos.includes(p.type as PropertyType)) return -1;
        score += 50;
      }

      // 2. City — strict exclusion
      if (ciudades.length > 0) {
        const cityNorm = normText(p.city ?? '');
        const matches = ciudades.some(c => cityNorm.includes(normText(c)));
        if (!matches) return -1;
        score += 20;
      }

      // 3. Sector — non-strict (-5 / +20)
      if (sectores.length > 0) {
        const propText = normText([p.sector, p.address, p.description, p.title]
          .filter(Boolean).join(' '));
        const hit = sectores.some(zone => {
          const terms = SECTOR_SEARCH_TERMS[zone] ?? [zone];
          return terms.some(t => propText.includes(t));
        });
        if (hit) score += 20;
        else score -= 5;
      }

      // 4. Free text tokens (+5 each)
      for (const text of textosLibres) {
        const propText = normText([p.title, p.description, p.address, p.sector]
          .filter(Boolean).join(' '));
        if (propText.includes(text)) score += 5;
      }

      return score;
    };

    const withScores = allProps.map(p => ({ prop: p, score: scoreProperty(p) }));
    const passed = withScores.filter(x => x.score > 0).sort((a, b) => b.score - a.score);

    // Step 5 — DB ILIKE for significant tokens not yet covered
    const sigTokens = rawTokens.filter(t => t.length > 3);
    const passedIds = new Set(passed.map(x => x.prop.id));
    let dbExtras: PropItem[] = [];

    if (sigTokens.length > 0) {
      const dbWhere: Prisma.PropertyWhereInput = {
        ...baseWhere,
        id: { notIn: Array.from(passedIds) },
        OR: sigTokens.flatMap(t => [
          { title:       { contains: t, mode: 'insensitive' as const } },
          { description: { contains: t, mode: 'insensitive' as const } },
          { sector:      { contains: t, mode: 'insensitive' as const } },
          { address:     { contains: t, mode: 'insensitive' as const } },
        ]),
      };
      const raw = await this.prisma.property.findMany({
        where: dbWhere, select: PUBLIC_PROPERTY_SELECT, take: 50,
      });
      // Re-score and only keep positives
      dbExtras = raw.filter(p => scoreProperty(p) > 0);
    }

    // Combine
    const allResults: PropItem[] = [
      ...passed.map(x => x.prop),
      ...dbExtras,
    ];

    // Step 6 — build response
    const interpreted = {
      tipos: tipos.map(t => TYPE_LABEL_SINGULAR[t] ?? t),
      ciudades,
      sectores,
    };

    let resultType: 'exact' | 'partial' | 'empty';
    let message: string | null = null;

    if (allResults.length === 0) {
      resultType = 'empty';
      // Build human-readable message
      const typeLabel = tipos.length > 0
        ? tipos.map(t => TYPE_LABEL_PLURAL[t]).join('/')
        : 'propiedades';
      const zones = [...ciudades, ...sectores.map(s => s.charAt(0).toUpperCase() + s.slice(1))];
      message = `No encontramos ${typeLabel}${zones.length > 0 ? ` en ${zones.join(', ')}` : ''
        }. Tenemos otras propiedades disponibles.`;
    } else {
      const topScore = passed[0]?.score ?? 5;
      resultType = topScore >= 50 ? 'exact' : 'partial';
    }

    return {
      items: allResults.slice(0, 12),
      total: allResults.length,
      resultType,
      interpreted,
      message,
    };
  }

  // ── Agents ─────────────────────────────────────────────────────────────────

  async listAgents(slug: string) {
    const tenant = await this.resolveTenant(slug);

    const users = await this.prisma.user.findMany({
      where: { tenantId: tenant.id, isActive: true },
      select: { id: true, name: true, avatarUrl: true },
      orderBy: { name: 'asc' },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      avatarUrl: u.avatarUrl,
      initials: u.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join(''),
      role: 'Asesor Inmobiliario',
    }));
  }

  // ── Contact / Lead creation ────────────────────────────────────────────────

  async contact(dto: ContactFormDto) {
    const tenant = await this.resolveTenant(dto.slug);

    const phoneNormalized = normalizePhone(dto.phone);
    const duplicateHash = computeDuplicateHash(phoneNormalized, dto.email);

    const existing = await this.prisma.lead.findFirst({
      where: { tenantId: tenant.id, duplicateHash, deletedAt: null },
      select: { id: true },
    });

    if (existing) {
      return { leadId: existing.id, isNew: false };
    }

    const vendedores = await this.prisma.user.findMany({
      where: { tenantId: tenant.id, role: 'VENDEDOR', isActive: true },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    let assignedToId: string | null = null;
    if (vendedores.length > 0) {
      const counts = await this.prisma.lead.groupBy({
        by: ['assignedToId'],
        where: { tenantId: tenant.id, deletedAt: null, assignedToId: { not: null } },
        _count: { assignedToId: true },
      });
      const countMap = new Map(counts.map((c) => [c.assignedToId!, c._count.assignedToId]));
      const sorted = vendedores
        .map((v) => ({ id: v.id, count: countMap.get(v.id) ?? 0 }))
        .sort((a, b) => a.count - b.count);
      assignedToId = sorted[0].id;
    }

    const notes = dto.message ?? undefined;
    const propertyInterest = dto.propertyId
      ? `Interesado en propiedad ${dto.propertyId}`
      : dto.propertyInterest ?? undefined;

    const lead = await this.prisma.$transaction(async (tx) => {
      const newLead = await tx.lead.create({
        data: {
          tenantId: tenant.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          phoneNormalized,
          duplicateHash,
          email: dto.email,
          source: LeadSource.WEBSITE,
          notes,
          propertyInterest,
          assignedToId,
        },
        select: { id: true },
      });

      if (assignedToId) {
        await tx.activity.create({
          data: {
            tenantId: tenant.id,
            leadId: newLead.id,
            userId: assignedToId,
            type: 'LEAD_CREATED',
            description: 'Lead creado desde el sitio web público',
          },
        });
      }

      return newLead;
    });

    return { leadId: lead.id, isNew: true };
  }
}
