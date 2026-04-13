/** Converts a relative upload path to a full URL */
export function buildImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads')) {
    const base = import.meta.env.VITE_API_BASE_URL
      ? String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, '')
      : 'http://localhost:3000';
    return `${base}${url}`;
  }
  return url;
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export const TYPE_LABEL: Record<string, string> = {
  CASA:        'Casa',
  APARTAMENTO: 'Departamento',
  TERRENO:     'Terreno',
  OFICINA:     'Oficina',
  LOCAL:       'Local Comercial',
  BODEGA:      'Bodega',
};

/** Deterministic avatar background color from name string */
const AVATAR_COLORS = [
  'bg-primary',
  'bg-secondary',
  'bg-[#2563eb]',
  'bg-[#d97706]',
  'bg-[#dc2626]',
  'bg-[#0891b2]',
  'bg-[#7c3aed]',
  'bg-[#059669]',
];

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
