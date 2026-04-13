import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Maximize2, Bed, Bath, Car, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatUSD, buildImageUrl } from '@/lib/utils';
import type { Property, PropertyType, PropertyStatus } from '@/types';

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<PropertyType, string> = {
  CASA:       'Casa',
  APARTAMENTO:'Apto',
  TERRENO:    'Terreno',
  OFICINA:    'Oficina',
  LOCAL:      'Local',
  BODEGA:     'Bodega',
};

const STATUS_CONFIG: Record<PropertyStatus, { label: string; cls: string }> = {
  DISPONIBLE: { label: 'Disponible', cls: 'bg-green-100 text-green-700' },
  RESERVADA:  { label: 'Reservada',  cls: 'bg-amber-100 text-amber-700' },
  VENDIDA:    { label: 'Vendida',    cls: 'bg-gray-100 text-gray-600' },
  INACTIVA:   { label: 'Inactiva',   cls: 'bg-red-100 text-red-600' },
};

function showsBedrooms(type: PropertyType) {
  return type === 'CASA' || type === 'APARTAMENTO';
}

// ─── Cover image ─────────────────────────────────────────────────────────────

function CoverImage({ images }: { images: string[] }) {
  const [errored, setErrored] = useState(false);
  const src = buildImageUrl(images[0]);

  if (src && !errored) {
    return (
      <img
        src={src}
        alt=""
        className="h-40 w-full rounded-t-xl object-cover"
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <div className="flex h-40 items-center justify-center rounded-t-xl bg-gradient-to-br from-indigo-50 to-blue-100">
      <Building2 className="h-12 w-12 text-indigo-300" />
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const navigate = useNavigate();
  const status = STATUS_CONFIG[property.status];

  return (
    <div
      className="group cursor-pointer rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
      onClick={() => navigate(`/propiedades/${property.id}`)}
    >
      <CoverImage images={property.images} />

      <div className="p-4">
        {/* Badges */}
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {TYPE_LABELS[property.type]}
          </Badge>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.cls}`}>
            {status.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-indigo-600">
          {property.title}
        </h3>

        {/* Location */}
        {(property.sector || property.city) && (
          <p className="mt-1 truncate text-xs text-gray-500">
            {[property.sector, property.city].filter(Boolean).join(', ')}
          </p>
        )}

        {/* Price */}
        <p className="mt-2 text-base font-bold text-indigo-600">
          {formatUSD(property.price)}
        </p>

        {/* Specs */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
          {property.area != null && (
            <span className="flex items-center gap-1">
              <Maximize2 className="h-3.5 w-3.5" />
              {property.area} m²
            </span>
          )}
          {showsBedrooms(property.type) && property.bedrooms != null && (
            <span className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" />
              {property.bedrooms}
            </span>
          )}
          {property.type !== 'TERRENO' && property.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" />
              {property.bathrooms}
            </span>
          )}
          {property.type !== 'TERRENO' && property.parking != null && (
            <span className="flex items-center gap-1">
              <Car className="h-3.5 w-3.5" />
              {property.parking}
            </span>
          )}
          {property._count.interestedLeads > 0 && (
            <span className="ml-auto flex items-center gap-1 text-indigo-500">
              <Users className="h-3.5 w-3.5" />
              {property._count.interestedLeads} lead{property._count.interestedLeads !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
