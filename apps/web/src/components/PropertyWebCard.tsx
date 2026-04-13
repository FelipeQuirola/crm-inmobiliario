import { Link } from 'react-router-dom';
import type { PublicProperty } from '@/types';
import { formatUSD, TYPE_LABEL, buildImageUrl } from '@/lib/utils';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80';

interface PropertyWebCardProps {
  property: PublicProperty;
}

export function PropertyWebCard({ property }: PropertyWebCardProps) {
  const img = buildImageUrl(property.images[0]) || PLACEHOLDER;

  return (
    <Link
      to={`/propiedades/${property.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-primary/30"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-gray-100">
        <img
          src={img}
          alt={property.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }}
        />
        {/* Type badge */}
        <span className="absolute left-3 top-3 rounded-full bg-secondary/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {TYPE_LABEL[property.type] ?? property.type}
        </span>
        {/* Price gradient overlay */}
        {property.price != null && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-secondary/70 to-transparent p-3">
            <span className="text-lg font-bold text-white">
              {formatUSD(property.price)}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-secondary transition-colors group-hover:text-primary">
          {property.title}
        </h3>

        {(property.sector || property.city) && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-gray-500">
            <svg className="h-3.5 w-3.5 flex-shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {[property.sector, property.city].filter(Boolean).join(', ')}
          </p>
        )}

        {/* Specs */}
        <div className="mt-auto border-t border-gray-50 pt-3 flex flex-wrap gap-3 text-xs font-medium text-gray-600">
          {property.area != null && (
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
              {property.area} m²
            </span>
          )}
          {property.bedrooms != null && (
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              {property.bedrooms} hab.
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              {property.bathrooms} baños
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
