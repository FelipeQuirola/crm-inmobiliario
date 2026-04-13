import { useState, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useProperty } from '@/hooks/useProperties';
import { ContactForm } from '@/components/ContactForm';
import { formatUSD, TYPE_LABEL, buildImageUrl } from '@/lib/utils';
import { WA_NUM } from '@/api/client';

const PropertyMap = lazy(() =>
  import('@/components/PropertyMap').then((m) => ({ default: m.PropertyMap }))
);

const PLACEHOLDER = 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80';

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: property, isLoading, isError } = useProperty(id ?? '');
  const [activeImg, setActiveImg] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="space-y-4 animate-pulse">
            <div className="h-6 w-40 rounded bg-gray-200" />
            <div className="h-10 w-80 rounded bg-gray-200" />
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <div className="h-96 rounded-2xl bg-gray-200" />
                <div className="h-48 rounded-2xl bg-gray-200" />
              </div>
              <div className="h-80 rounded-2xl bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 pt-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-secondary">Propiedad no encontrada</p>
        <Link to="/propiedades" className="text-sm font-medium text-primary hover:underline">
          ← Volver al catálogo
        </Link>
      </div>
    );
  }

  const images = (property.images.length > 0 ? property.images : [PLACEHOLDER]).map(buildImageUrl);
  const waText = `Hola, estoy interesado/a en la propiedad: ${property.title}. ¿Podrían darme más información?`;

  return (
    <>
      <Helmet>
        <title>{property.title} — HomeMatch</title>
        <meta name="description" content={property.description?.slice(0, 160) ?? `${TYPE_LABEL[property.type]} en ${property.city ?? 'Ecuador'}`} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">Inicio</Link>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <Link to="/propiedades" className="hover:text-gray-700">Propiedades</Link>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="line-clamp-1 text-secondary">{property.title}</span>
          </nav>

          {/* Title row */}
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-white">
                  {TYPE_LABEL[property.type] ?? property.type}
                </span>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Disponible
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-bold text-secondary sm:text-3xl">{property.title}</h1>
              {(property.sector || property.city || property.address) && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-500">
                  <svg className="h-4 w-4 flex-shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {[property.address, property.sector, property.city].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
            {property.price != null && (
              <div className="text-right">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Precio</p>
                <p className="text-3xl font-extrabold text-primary">{formatUSD(property.price)}</p>
              </div>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-5">
            {/* ── Left panel ─────────────────────────────────────────── */}
            <div className="space-y-6 lg:col-span-3">
              {/* Main image */}
              <div className="overflow-hidden rounded-2xl bg-gray-200 shadow-sm">
                <img
                  src={images[activeImg]}
                  alt={property.title}
                  loading="lazy"
                  className="h-72 w-full object-cover sm:h-96"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }}
                />
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                        activeImg === i
                          ? 'border-primary scale-95 shadow-md'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="h-16 w-24 object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Specs card */}
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <h2 className="mb-5 text-lg font-bold text-secondary">Características</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {property.area != null && (
                    <SpecItem label="Área" value={`${property.area} m²`} icon="area" />
                  )}
                  {property.bedrooms != null && (
                    <SpecItem label="Habitaciones" value={String(property.bedrooms)} icon="bed" />
                  )}
                  {property.bathrooms != null && (
                    <SpecItem label="Baños" value={String(property.bathrooms)} icon="bath" />
                  )}
                  {property.parking != null && (
                    <SpecItem label="Parqueos" value={String(property.parking)} icon="car" />
                  )}
                </div>

                {property.features.length > 0 && (
                  <>
                    <h3 className="mb-3 mt-6 text-sm font-semibold text-gray-700">Amenidades</h3>
                    <div className="flex flex-wrap gap-2">
                      {property.features.map((f) => (
                        <span
                          key={f}
                          className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Description */}
              {property.description && (
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                  <h2 className="mb-3 text-lg font-bold text-secondary">Descripción</h2>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                    {property.description}
                  </p>
                </div>
              )}

              {/* Map */}
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <h2 className="mb-4 text-lg font-bold text-secondary">Ubicación</h2>
                {property.lat != null && property.lng != null ? (
                  <>
                    <div style={{ borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(0,96,49,0.15)', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                      <Suspense fallback={<div style={{ height: 350, background: '#f3f4f6' }} />}>
                        <PropertyMap lat={property.lat} lng={property.lng} title={property.title} height={350} />
                      </Suspense>
                    </div>
                    {(property.address || property.sector || property.city) && (
                      <p className="mt-3 flex items-center gap-1.5 text-sm text-gray-600">
                        <svg className="h-4 w-4 flex-shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        {[property.address, property.sector, property.city].filter(Boolean).join(', ')}
                      </p>
                    )}
                    <a
                      href={`https://www.google.com/maps?q=${property.lat},${property.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-primary/30 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20.25l-6.75-6.75 6.75-6.75M20.25 12H3" />
                      </svg>
                      Abrir en Google Maps
                    </a>
                  </>
                ) : (
                  <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl bg-gray-50 text-gray-400">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                    </svg>
                    <p className="text-sm">Ubicación no disponible</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Right panel — contact ─────────────────────────────── */}
            <div className="lg:col-span-2">
              <div className="sticky top-24 space-y-4">
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                  <ContactForm
                    propertyId={property.id}
                    title="¿Te interesa esta propiedad?"
                    subtitle="Completa el formulario y te contactamos."
                  />
                </div>

                {/* WhatsApp CTA */}
                <a
                  href={`https://wa.me/${WA_NUM}?text=${encodeURIComponent(waText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#1ebe59] shadow-sm shadow-green-500/20"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Contactar por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SpecItem({ label, value, icon }: { label: string; value: string; icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    area: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
      </svg>
    ),
    bed: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
    bath: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    car: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  };

  return (
    <div className="flex flex-col items-center rounded-xl bg-gray-50 p-4 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icons[icon]}
      </div>
      <p className="mt-2 text-lg font-bold text-secondary">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
