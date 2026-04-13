// Client-side query parser for real-time search feedback
// Mirrors the backend classification logic (without DB access)

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

const STOPWORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'de', 'del', 'en', 'a', 'al', 'por', 'para', 'con',
  'sin', 'sobre', 'entre', 'hacia', 'hasta', 'desde',
  'y', 'e', 'o', 'u', 'pero', 'que', 'si', 'como', 'donde', 'cuando',
  'me', 'te', 'se', 'nos', 'mi', 'tu', 'su',
  'busco', 'busca', 'quiero', 'necesito', 'tengo', 'hay',
  'ver', 'miro', 'mostrar', 'muy', 'mas', 'menos',
  'propiedad', 'propiedades', 'inmueble', 'venta', 'alquiler',
  'precio', 'costo', 'valor', 'presupuesto', 'disponible', 'disponibles',
]);

const TYPE_LABELS: Record<string, string> = {
  casa: 'Casa', casas: 'Casa', chalet: 'Casa', villa: 'Casa', residencia: 'Casa',
  apartamento: 'Departamento', apartamentos: 'Departamento', apto: 'Departamento',
  aptos: 'Departamento', departamento: 'Departamento', departamentos: 'Departamento',
  depto: 'Departamento', piso: 'Departamento', flat: 'Departamento',
  suite: 'Departamento', loft: 'Departamento', estudio: 'Departamento',
  terreno: 'Terreno', terrenos: 'Terreno', lote: 'Terreno', lotes: 'Terreno',
  solar: 'Terreno', parcela: 'Terreno', predio: 'Terreno',
  oficina: 'Oficina', oficinas: 'Oficina', despacho: 'Oficina', consultorio: 'Oficina',
  local: 'Local Comercial', locales: 'Local Comercial', comercial: 'Local Comercial',
  tienda: 'Local Comercial', negocio: 'Local Comercial',
  bodega: 'Bodega', bodegas: 'Bodega', deposito: 'Bodega', depositos: 'Bodega',
  almacen: 'Bodega', almacenes: 'Bodega', galpon: 'Bodega', galpones: 'Bodega',
};

const CITY_LABELS: Record<string, string> = {
  quito: 'Quito', dmd: 'Quito',
  guayaquil: 'Guayaquil', guaya: 'Guayaquil',
  cuenca: 'Cuenca', ambato: 'Ambato', manta: 'Manta', loja: 'Loja',
};

const SECTOR_LABELS: Record<string, string> = {
  norte: 'Norte', carolina: 'Norte', inaquito: 'Norte', republica: 'Norte',
  cotocollao: 'Norte', condado: 'Norte', carcelen: 'Norte',
  sur: 'Sur', quitumbe: 'Sur', solanda: 'Sur', chillogallo: 'Sur',
  turubamba: 'Sur', guamani: 'Sur',
  valle: 'Valle', cumbaya: 'Cumbayá', tumbaco: 'Tumbaco',
  chillos: 'Los Chillos', sangolqui: 'Sangolquí', conocoto: 'Conocoto',
  guangopolo: 'Guangopolo',
  centro: 'Centro Histórico', historico: 'Centro Histórico',
  gonzalez: 'González Suárez',
  floresta: 'La Floresta',
  mariscal: 'La Mariscal',
  bellavista: 'Bellavista',
};

export interface ParsedQuery {
  tipos: string[];
  ciudades: string[];
  sectores: string[];
  hasIntent: boolean;
}

export function parseSearchQuery(query: string): ParsedQuery {
  if (!query || query.trim().length < 2) {
    return { tipos: [], ciudades: [], sectores: [], hasIntent: false };
  }

  const normalized = normText(query);
  const tokens = normalized.split(' ').filter(t => t.length > 0 && !STOPWORDS.has(t));

  const tipos: string[] = [];
  const ciudades: string[] = [];
  const sectores: string[] = [];

  for (const token of tokens) {
    if (TYPE_LABELS[token] && !tipos.includes(TYPE_LABELS[token])) {
      tipos.push(TYPE_LABELS[token]);
    } else if (CITY_LABELS[token] && !ciudades.includes(CITY_LABELS[token])) {
      ciudades.push(CITY_LABELS[token]);
    } else if (SECTOR_LABELS[token] && !sectores.includes(SECTOR_LABELS[token])) {
      sectores.push(SECTOR_LABELS[token]);
    }
  }

  return {
    tipos,
    ciudades,
    sectores,
    hasIntent: tipos.length + ciudades.length + sectores.length > 0,
  };
}

export function buildSearchLabel(parsed: ParsedQuery): string | null {
  const parts: string[] = [];
  if (parsed.tipos.length > 0)   parts.push(`tipo ${parsed.tipos.join('/')}`);
  if (parsed.sectores.length > 0) parts.push(`zona ${parsed.sectores.join('/')}`);
  if (parsed.ciudades.length > 0) parts.push(`ciudad ${parsed.ciudades.join('/')}`);
  return parts.length > 0 ? `Buscando: ${parts.join(' · ')}` : null;
}

export function buildLabelFromInterpreted(interpreted: {
  tipos: string[];
  ciudades: string[];
  sectores: string[];
}): string | null {
  const parts: string[] = [];
  if (interpreted.tipos.length > 0)    parts.push(`tipo ${interpreted.tipos.join('/')}`);
  if (interpreted.sectores.length > 0) parts.push(`zona ${interpreted.sectores.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('/')}`);
  if (interpreted.ciudades.length > 0) parts.push(`ciudad ${interpreted.ciudades.join('/')}`);
  return parts.length > 0 ? `Buscando: ${parts.join(' · ')}` : null;
}
