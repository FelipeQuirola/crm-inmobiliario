import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as QRCode from 'qrcode';
import puppeteer from 'puppeteer';
import { PrismaService } from '../prisma/prisma.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function urlToBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  } catch {
    return null;
  }
}

/**
 * Base path for uploaded files.
 * Override with UPLOADS_PATH env var in production if needed.
 * __dirname is dist/src/pdf in compiled output → 3 levels up = apps/backend
 */
const UPLOADS_BASE =
  process.env.UPLOADS_PATH ?? path.join(__dirname, '..', '..', '..', 'uploads');

/** Resolves an image URL or local upload path to a base64 data URI. */
async function resolveImageBase64(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    if (url.startsWith('http')) {
      return await urlToBase64(url);
    }
    if (url.startsWith('/uploads')) {
      const relative = url.replace(/^\/uploads/, '');
      const filePath = path.join(UPLOADS_BASE, relative);
      const buffer = await fs.promises.readFile(filePath);
      const ext = path.extname(url).toLowerCase().replace('.', '') || 'jpeg';
      const mimeType = ext === 'jpg' ? 'jpeg' : ext;
      return `data:image/${mimeType};base64,${buffer.toString('base64')}`;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Puppeteer map screenshot ─────────────────────────────────────────────────

const mapLogger = new Logger('PdfService.Map');

async function fetchMapBase64(lat: number, lng: number): Promise<string | null> {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
  try {
    mapLogger.log(`Generating map screenshot for lat=${lat} lng=${lng}`);
    const isProdMap = process.env.NODE_ENV === 'production';
    browser = await puppeteer.launch({
      headless: true,
      executablePath: isProdMap ? '/usr/bin/chromium-browser' : undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 600, height: 300 });

    const mapHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
  <style>
    html, body, #map { margin: 0; padding: 0; width: 600px; height: 300px; overflow: hidden; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <script>
    var map = L.map('map', {
      center: [${lat}, ${lng}],
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: ''
    }).addTo(map);
    var svgIcon = L.divIcon({
      html: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44"><path d="M16 0 C7.163 0 0 7.163 0 16 C0 28 16 44 16 44 C16 44 32 28 32 16 C32 7.163 24.837 0 16 0Z" fill="#006031" stroke="white" stroke-width="2"/><circle cx="16" cy="16" r="7" fill="white"/><circle cx="16" cy="16" r="4" fill="#006031"/></svg>',
      iconSize: [32, 44],
      iconAnchor: [16, 44],
      className: ''
    });
    L.marker([${lat}, ${lng}], { icon: svgIcon }).addTo(map);
  </script>
</body>
</html>`;

    await page.setContent(mapHtml, { waitUntil: 'networkidle0', timeout: 30000 });
    // Extra delay to ensure tiles fully render
    await new Promise<void>((r) => setTimeout(r, 2000));

    const screenshot = await page.screenshot({ type: 'jpeg', quality: 90 });
    const base64 = Buffer.from(screenshot).toString('base64');
    mapLogger.log(`Map screenshot generated: ${base64.length} chars`);
    return `data:image/jpeg;base64,${base64}`;
  } catch (err) {
    mapLogger.error('Puppeteer map generation failed', String(err));
    return null;
  } finally {
    if (browser) await browser.close();
  }
}

function fmtPrice(price: unknown): string {
  return Number(price).toLocaleString('es-EC');
}

// ─── Type Labels ──────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  CASA: 'Casa',
  APARTAMENTO: 'Apartamento',
  TERRENO: 'Terreno',
  OFICINA: 'Oficina',
  LOCAL: 'Local',
  BODEGA: 'Bodega',
};

const STATUS_LABELS: Record<string, string> = {
  DISPONIBLE: 'Disponible',
  RESERVADA: 'Reservada',
  VENDIDA: 'Vendida',
  INACTIVA: 'Inactiva',
};

// ─── HTML Builder ─────────────────────────────────────────────────────────────

function buildHtml(opts: {
  property: Record<string, unknown>;
  agent: { name: string; email?: string } | null;
  agentAvatarBase64: string | null;
  logoBase64: string;
  qrBase64: string;
  mapDataUrl: string | null;
  hasCoords: boolean;
  imageBase64s: (string | null)[];
  year: number;
  dateStr: string;
}): string {
  const { property, agent, agentAvatarBase64, logoBase64, qrBase64, mapDataUrl, hasCoords, imageBase64s, year, dateStr } = opts;

  const features = (property.features as string[]) ?? [];
  const address = (property.address as string) ?? '';
  const sector = (property.sector as string) ?? '';
  const city = (property.city as string) ?? '';
  const title = (property.title as string) ?? '';
  const rawDescription = (property.description as string) ?? '';
  // Truncate long descriptions to keep page 2 clean
  const description = rawDescription.length > 500
    ? rawDescription.substring(0, 500) + '…'
    : rawDescription;
  const typeLabel = TYPE_LABELS[property.type as string] ?? String(property.type);
  const statusLabel = STATUS_LABELS[property.status as string] ?? String(property.status);
  const price = fmtPrice(property.price);

  const locationLine = [address, sector, city, 'Ecuador']
    .filter(Boolean)
    .join(', ');

  // Agent initials fallback
  const initials = agent
    ? agent.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'HM';

  // ── Stat boxes ────────────────────────────────────────────────────────────
  const statBoxes: string[] = [];
  if (property.area) {
    statBoxes.push(`
      <div style="flex:1;text-align:center;background:white;border:1px solid #e5e7eb;border-radius:12px;padding:16px 12px;border-top:3px solid #006031;">
        <div style="font-size:22px;margin-bottom:4px;">&#x1F4D0;</div>
        <div style="font-size:20px;font-weight:800;color:#006031;">${String(property.area)}</div>
        <div style="font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase;">m²</div>
      </div>`);
  }
  if (property.bedrooms) {
    statBoxes.push(`
      <div style="flex:1;text-align:center;background:white;border:1px solid #e5e7eb;border-radius:12px;padding:16px 12px;border-top:3px solid #23103B;">
        <div style="font-size:22px;margin-bottom:4px;">&#x1F6CF;</div>
        <div style="font-size:20px;font-weight:800;color:#23103B;">${String(property.bedrooms)}</div>
        <div style="font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase;">Dormitorios</div>
      </div>`);
  }
  if (property.bathrooms) {
    statBoxes.push(`
      <div style="flex:1;text-align:center;background:white;border:1px solid #e5e7eb;border-radius:12px;padding:16px 12px;border-top:3px solid #006031;">
        <div style="font-size:22px;margin-bottom:4px;">&#x1F6BF;</div>
        <div style="font-size:20px;font-weight:800;color:#006031;">${String(property.bathrooms)}</div>
        <div style="font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase;">Baños</div>
      </div>`);
  }
  if (property.parking) {
    statBoxes.push(`
      <div style="flex:1;text-align:center;background:white;border:1px solid #e5e7eb;border-radius:12px;padding:16px 12px;border-top:3px solid #23103B;">
        <div style="font-size:22px;margin-bottom:4px;">&#x1F697;</div>
        <div style="font-size:20px;font-weight:800;color:#23103B;">${String(property.parking)}</div>
        <div style="font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase;">Parqueos</div>
      </div>`);
  }

  // ── Hero (página 1) ───────────────────────────────────────────────────────
  const firstImageB64 = imageBase64s[0];
  const heroBlock = firstImageB64
    ? `<div style="position:relative;height:280px;overflow:hidden;">
      <img src="${firstImageB64}" style="width:100%;height:100%;object-fit:cover;object-position:center;" alt="${title}"/>
      <div style="position:absolute;bottom:0;left:0;right:0;height:180px;
        background:linear-gradient(transparent,rgba(35,16,59,0.92));
        padding:16px 32px;display:flex;flex-direction:column;justify-content:flex-end;">
        <div style="margin-bottom:6px;">
          <span style="background:#B5C032;color:#23103B;font-size:10px;font-weight:700;
            padding:3px 10px;border-radius:20px;margin-right:8px;text-transform:uppercase;">${typeLabel}</span>
          <span style="background:rgba(255,255,255,0.2);color:white;font-size:10px;font-weight:600;
            padding:3px 10px;border-radius:20px;border:1px solid rgba(255,255,255,0.4);">${statusLabel}</span>
        </div>
        <div style="font-size:22px;font-weight:800;color:white;text-shadow:0 2px 8px rgba(0,0,0,0.5);
          line-height:1.2;margin-bottom:4px;">${title}</div>
        <div style="font-size:24px;font-weight:900;color:#B5C032;text-shadow:0 2px 8px rgba(0,0,0,0.5);">
          $${price} USD</div>
      </div>
    </div>`
    : `<div style="background:linear-gradient(135deg,#006031,#23103B);padding:40px 32px;text-align:center;">
      <div style="font-size:13px;color:#B5C032;font-weight:700;letter-spacing:3px;
        text-transform:uppercase;margin-bottom:10px;">${typeLabel}</div>
      <div style="font-size:28px;font-weight:800;color:white;margin-bottom:10px;">${title}</div>
      <div style="font-size:32px;font-weight:900;color:#B5C032;">$${price} USD</div>
    </div>`;

  // ── Gallery (imágenes 2–5) ────────────────────────────────────────────────
  const galleryImages = imageBase64s.slice(1, 5).filter(Boolean) as string[];
  const galleryImgHeight = galleryImages.length === 1 ? '220px' : galleryImages.length <= 3 ? '160px' : '140px';
  const galleryBlock = galleryImages.length > 0
    ? `<div class="no-break" style="padding:16px 32px 0;">
      <div style="font-size:12px;font-weight:700;color:#23103B;text-transform:uppercase;
        letter-spacing:1px;margin-bottom:10px;">Galería de fotos</div>
      <div style="display:grid;grid-template-columns:${galleryImages.length === 1 ? '1fr' : 'repeat(2,1fr)'};gap:8px;">
        ${galleryImages
          .map((img) => `<img src="${img}" style="width:100%;height:${galleryImgHeight};object-fit:cover;object-position:center;border-radius:8px;display:block;" alt="foto propiedad"/>`)
          .join('')}
      </div>
    </div>`
    : '';

  // ── Map block — página 2 ──────────────────────────────────────────────────
  const mapBlock = mapDataUrl
    ? `<div class="no-break section" style="padding:20px 32px 0;">
      <div style="font-size:12px;font-weight:700;color:#23103B;text-transform:uppercase;
        letter-spacing:1px;margin-bottom:10px;">Ubicación</div>
      <img src="${mapDataUrl}" style="width:100%;height:220px;object-fit:cover;border-radius:12px;border:2px solid #e5e7eb;" alt="mapa"/>
      <div style="margin-top:6px;font-size:11px;color:#6B7280;text-align:center;">
        &#x1F4CD; ${locationLine}
      </div>
    </div>`
    : hasCoords
    ? `<div class="no-break section" style="padding:20px 32px 0;">
      <div style="font-size:12px;font-weight:700;color:#23103B;text-transform:uppercase;
        letter-spacing:1px;margin-bottom:10px;">Ubicación</div>
      <div style="width:100%;height:140px;background:linear-gradient(135deg,#f0f4f0,#e8f5e8);
        border-radius:12px;border:2px solid #006031;display:flex;flex-direction:column;
        align-items:center;justify-content:center;gap:6px;">
        <div style="font-size:28px;">&#x1F4CD;</div>
        ${address ? `<div style="font-size:13px;font-weight:700;color:#006031;">${address}</div>` : ''}
        <div style="font-size:11px;color:#4B5563;">${[sector, city, 'Ecuador'].filter(Boolean).join(', ')}</div>
      </div>
    </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      height: auto !important;
      min-height: unset !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      color: #1a1a2e;
      background: white;
      padding: 0 !important;
      margin: 0 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .no-break { page-break-inside: avoid; break-inside: avoid; }
    img       { page-break-inside: avoid; break-inside: avoid; }
    .agent-card { page-break-inside: avoid; break-inside: avoid; }
    .footer {
      page-break-inside: avoid;
      break-inside: avoid;
      margin-bottom: 0 !important;
    }
  </style>
</head>
<body>

<!-- ══════════════ PÁGINA 1 ══════════════ -->

<!-- HEADER -->
<div class="no-break" style="background:linear-gradient(135deg,#23103B 0%,#006031 100%);
  padding:20px 32px;display:flex;justify-content:space-between;align-items:center;">
  <img src="${logoBase64}" style="height:48px;object-fit:contain;" alt="HomeMatch"/>
  <div style="text-align:right;color:white;">
    <div style="font-size:11px;opacity:0.8;">Quito, Ecuador</div>
    <div style="font-size:11px;opacity:0.8;">info@homematchinmobiliaria.com</div>
    <div style="background:#B5C032;color:#23103B;font-size:10px;font-weight:700;
      padding:3px 10px;border-radius:20px;margin-top:5px;display:inline-block;">
      FICHA TÉCNICA
    </div>
  </div>
</div>

<!-- FOTO PRINCIPAL -->
<div class="no-break">
  ${heroBlock}
</div>

<!-- BARRA DE UBICACIÓN -->
<div class="no-break section" style="background:#f8f9fa;padding:10px 32px;display:flex;
  align-items:center;border-bottom:2px solid #B5C032;">
  <span style="color:#006031;margin-right:8px;font-size:15px;">&#x1F4CD;</span>
  <span style="font-size:12px;color:#4B5563;font-weight:500;">${locationLine}</span>
</div>

<!-- GRID DE CARACTERÍSTICAS -->
${statBoxes.length > 0 ? `
<div class="no-break section specs-grid" style="padding:16px 32px;">
  <div style="display:flex;gap:10px;justify-content:center;">
    ${statBoxes.join('')}
  </div>
</div>` : ''}

<!-- GALERÍA (si hay fotos adicionales) -->
${galleryBlock}

<!-- DESCRIPCIÓN -->
${description ? `
<div class="no-break section" style="padding:20px 32px 0;">
  <div style="border-left:4px solid #B5C032;padding-left:16px;">
    <div style="font-size:12px;font-weight:700;color:#23103B;text-transform:uppercase;
      letter-spacing:1px;margin-bottom:8px;" class="keep-with-next">Descripción</div>
    <div style="font-size:12px;color:#4B5563;line-height:1.65;">${description}</div>
  </div>
</div>` : ''}

<!-- CARACTERÍSTICAS ADICIONALES -->
${features.length > 0 ? `
<div class="no-break section" style="padding:20px 32px 0;">
  <div style="font-size:12px;font-weight:700;color:#23103B;text-transform:uppercase;
    letter-spacing:1px;margin-bottom:10px;" class="keep-with-next">Características adicionales</div>
  <div style="display:flex;flex-wrap:wrap;gap:6px;">
    ${features
      .map((f) => `<span style="background:#f0fdf4;color:#006031;border:1px solid #bbf7d0;
        font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;">${f}</span>`)
      .join('')}
  </div>
</div>` : ''}

<!-- MAPA -->
${mapBlock}

<!-- ASESOR + QR -->
<div class="no-break agent-card" style="margin:20px 32px 0;background:linear-gradient(135deg,#23103B,#006031);
  border-radius:14px;padding:20px;display:flex;justify-content:space-between;align-items:center;">
  <div style="display:flex;align-items:center;gap:14px;">
    ${agentAvatarBase64 ? `
    <img src="${agentAvatarBase64}" style="width:60px;height:60px;border-radius:50%;
      object-fit:cover;border:3px solid #B5C032;flex-shrink:0;" alt="${agent ? agent.name : ''}"/>
    ` : `
    <div style="width:60px;height:60px;background:#B5C032;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:22px;font-weight:800;color:#23103B;flex-shrink:0;">
      ${initials}
    </div>
    `}
    <div>
      <div style="font-size:10px;color:#B5C032;font-weight:700;text-transform:uppercase;
        letter-spacing:1px;margin-bottom:3px;">Asesor inmobiliario</div>
      <div style="font-size:17px;font-weight:800;color:white;margin-bottom:3px;">
        ${agent ? agent.name : 'HomeMatch Inmobiliaria'}
      </div>
      ${agent?.email ? `<div style="font-size:11px;color:rgba(255,255,255,0.75);">${agent.email}</div>` : ''}
    </div>
  </div>
  <div style="text-align:center;flex-shrink:0;">
    <img src="${qrBase64}" style="width:90px;height:90px;background:white;
      padding:6px;border-radius:8px;" alt="QR"/>
    <div style="font-size:10px;color:rgba(255,255,255,0.7);margin-top:5px;">Ver en web</div>
  </div>
</div>

<!-- FOOTER -->
<div class="no-break footer" style="background:#23103B;padding:16px 32px;display:flex;
  justify-content:space-between;align-items:center;margin-top:24px;">
  <div>
    <img src="${logoBase64}" style="height:28px;" alt="HomeMatch"/>
    <div style="font-size:10px;color:rgba(255,255,255,0.6);margin-top:3px;">
      Construyendo hogares, construyendo sueños.
    </div>
  </div>
  <div style="text-align:right;">
    <div style="font-size:10px;color:rgba(255,255,255,0.7);">homematchinmobiliaria.com</div>
    <div style="font-size:10px;color:rgba(255,255,255,0.6);">Quito, Ecuador — © ${year} HomeMatch</div>
    <div style="font-size:9px;color:#B5C032;margin-top:3px;">Documento generado el ${dateStr}</div>
  </div>
</div>

</body>
</html>`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generatePropertyPdf(
    propertyId: string,
    tenantId: string,
    agentId?: string,
  ): Promise<{ pdf: Buffer; filename: string }> {
    // 1. Fetch property
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, tenantId },
    });
    if (!property) throw new NotFoundException('Property not found');

    // 2. Fetch agent (optional)
    let agent: { name: string; email: string; avatarUrl: string | null } | null = null;
    if (agentId) {
      const user = await this.prisma.user.findFirst({
        where: { id: agentId, tenantId },
        select: { name: true, email: true, avatarUrl: true },
      });
      if (user) agent = user;
    }

    // 3. QR code
    const qrUrl = `https://homematchinmobiliaria.com/propiedades/${propertyId}`;
    const qrBase64 = await QRCode.toDataURL(qrUrl, {
      width: 150,
      margin: 1,
      color: { dark: '#23103B', light: '#ffffff' },
    });

    // 4. Static map (optional — timeout-safe)
    let mapDataUrl: string | null = null;
    const lat = property.lat ? Number(property.lat) : null;
    const lng = property.lng ? Number(property.lng) : null;
    if (lat !== null && lng !== null) {
      this.logger.log(`Fetching map for property ${propertyId} at ${lat},${lng}`);
      mapDataUrl = await fetchMapBase64(lat, lng);
      this.logger.log(`Map result: ${mapDataUrl ? 'OK' : 'null'}`);
    } else {
      this.logger.log(`Property ${propertyId} has no coordinates — skipping map`);
    }

    // 5. Logo — try multiple paths so it works in dev and production
    // __dirname in compiled = apps/backend/dist/src/pdf
    const logoCandidates = [
      path.join(__dirname, '..', '..', '..', '..', 'web', 'public', 'logo.png'),           // apps/web/public
      path.join(__dirname, '..', '..', '..', '..', '..', 'apps', 'web', 'public', 'logo.png'), // project-root/apps/web/public
      path.join(__dirname, '..', '..', '..', 'web', 'public', 'logo.png'),                  // fallback
      '/root/crm/apps/web/public/logo.png',                                                  // absolute last resort
    ];
    let logoBase64 = '';
    for (const p of logoCandidates) {
      try {
        const logoBuffer = fs.readFileSync(p);
        const ext = path.extname(p).replace('.', '') || 'png';
        logoBase64 = `data:image/${ext};base64,${logoBuffer.toString('base64')}`;
        break;
      } catch {
        continue;
      }
    }

    // 6. Convert property images to base64 (up to 5 images)
    // resolveImageBase64 handles both external URLs and local /uploads/... paths
    const images = (property.images as string[]) ?? [];
    const imageBase64s = await Promise.all(
      images.slice(0, 5).map((url) => resolveImageBase64(url)),
    );

    // 6b. Agent avatar (if avatarUrl is a local path, read from disk; else fetch)
    let agentAvatarBase64: string | null = null;
    if (agent?.avatarUrl) {
      const avatarPath = agent.avatarUrl;
      if (!avatarPath.startsWith('http')) {
        // Local file: avatarUrl is like /uploads/avatars/xxx.jpg
        const relative = avatarPath.replace(/^\/uploads/, '');
        const localPath = path.join(UPLOADS_BASE, relative);
        try {
          const buf = fs.readFileSync(localPath);
          const ext = path.extname(avatarPath).slice(1) || 'jpeg';
          agentAvatarBase64 = `data:image/${ext};base64,${buf.toString('base64')}`;
        } catch {
          agentAvatarBase64 = null;
        }
      } else {
        agentAvatarBase64 = await urlToBase64(avatarPath);
      }
    }

    // 7. Build HTML
    const now = new Date();
    const html = buildHtml({
      property: property as unknown as Record<string, unknown>,
      agent,
      agentAvatarBase64,
      logoBase64,
      qrBase64,
      mapDataUrl,
      hasCoords: lat !== null && lng !== null,
      imageBase64s,
      year: now.getFullYear(),
      dateStr: now.toLocaleDateString('es-EC'),
    });

    // 8. Puppeteer → PDF
    const isProd = process.env.NODE_ENV === 'production';
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: isProd ? '/usr/bin/chromium-browser' : undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
      // Small delay to let any remaining async rendering settle
      await new Promise<void>((r) => setTimeout(r, 500));
      const pdfBuffer = await page.pdf({
        format: 'Letter',
        printBackground: true,
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
        preferCSSPageSize: false,
        timeout: 60000,
      });
      const safeTitle = (property.title as string)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .toLowerCase();
      return { pdf: Buffer.from(pdfBuffer), filename: `ficha-${safeTitle}.pdf` };
    } finally {
      await browser.close();
    }
  }
}
