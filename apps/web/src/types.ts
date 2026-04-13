export type PropertyType = 'CASA' | 'APARTAMENTO' | 'TERRENO' | 'OFICINA' | 'LOCAL' | 'BODEGA';
export type PropertyStatus = 'DISPONIBLE' | 'RESERVADA' | 'VENDIDA' | 'INACTIVA';

export interface PublicProperty {
  id: string;
  title: string;
  description: string | null;
  type: PropertyType;
  status: PropertyStatus;
  price: number | null;
  currency: string;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  address: string | null;
  city: string | null;
  sector: string | null;
  lat: number | null;
  lng: number | null;
  features: string[];
  images: string[];
  createdAt: string;
}

export interface ListPropertiesResult {
  items: PublicProperty[];
  total: number;
  skip: number;
  take: number;
}

export interface SearchInterpretation {
  tipos: string[];
  ciudades: string[];
  sectores: string[];
}

export interface SearchResult {
  items: PublicProperty[];
  total: number;
  resultType: 'exact' | 'partial' | 'empty';
  interpreted: SearchInterpretation;
  message: string | null;
}

export interface Agent {
  id: string;
  name: string;
  initials: string;
  role: string;
  avatarUrl?: string | null;
}
