import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useProperties, usePropertySearch, type ListPropertiesParams } from '@/hooks/useProperties';
import { PropertyWebCard } from '@/components/PropertyWebCard';
import { PageHero } from '@/components/PageHero';
import { buildLabelFromInterpreted, parseSearchQuery, buildSearchLabel } from '@/lib/searchParser';
import type { PropertyType } from '@/types';

const TAKE = 12;
const CITIES = ['', 'Quito', 'Guayaquil', 'Cuenca', 'Ambato', 'Manta', 'Loja'];

const TYPE_OPTS: { value: PropertyType | ''; label: string }[] = [
  { value: '',            label: 'Todos los tipos' },
  { value: 'CASA',        label: 'Casa' },
  { value: 'APARTAMENTO', label: 'Departamento' },
  { value: 'TERRENO',     label: 'Terreno' },
  { value: 'LOCAL',       label: 'Local Comercial' },
  { value: 'OFICINA',     label: 'Oficina' },
  { value: 'BODEGA',      label: 'Bodega' },
];

export function PropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const [search,      setSearch]      = useState(searchParams.get('search') ?? '');
  const [type,        setType]        = useState<PropertyType | ''>(
    (searchParams.get('type') as PropertyType | '') ?? ''
  );
  const [city,        setCity]        = useState(searchParams.get('city') ?? '');
  const [priceMin,    setPriceMin]    = useState(searchParams.get('priceMin') ?? '');
  const [priceMax,    setPriceMax]    = useState(searchParams.get('priceMax') ?? '');
  const [bedroomsMin, setBedroomsMin] = useState(searchParams.get('bedroomsMin') ?? '');
  const [skip,        setSkip]        = useState(0);

  // 500ms debounce
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  // Use RI search when query >= 2 chars and no structural filters active
  const useRI = debouncedSearch.trim().length >= 2 && !type && !city && !priceMin && !priceMax && !bedroomsMin;

  const riQuery = usePropertySearch(useRI ? debouncedSearch : '');

  const params: ListPropertiesParams = {
    type:        type || undefined,
    search:      debouncedSearch || undefined,
    city:        city || undefined,
    priceMin:    priceMin ? Number(priceMin) : undefined,
    priceMax:    priceMax ? Number(priceMax) : undefined,
    bedroomsMin: bedroomsMin ? Number(bedroomsMin) : undefined,
    skip,
    take: TAKE,
  };

  const regularQuery = useProperties(useRI ? {} : params);

  const queryResult = useRI
    ? { data: riQuery.data, isLoading: riQuery.isLoading, isError: riQuery.isError }
    : regularQuery;

  const { data, isLoading, isError } = queryResult;

  const isEmpty      = useRI && riQuery.data?.resultType === 'empty';
  const isPartial    = useRI && riQuery.data?.resultType === 'partial';
  const apiMessage   = riQuery.data?.message ?? null;
  const interpreted  = riQuery.data?.interpreted;

  // Build search feedback label: use backend interpreted when available, else client-side parser
  const feedbackLabel = interpreted
    ? buildLabelFromInterpreted(interpreted)
    : buildSearchLabel(parseSearchQuery(search));

  const totalPages  = !useRI && data ? Math.ceil(data.total / TAKE) : 0;
  const currentPage = Math.floor(skip / TAKE) + 1;

  const clearFilters = () => {
    setSearch(''); setType(''); setCity('');
    setPriceMin(''); setPriceMax(''); setBedroomsMin('');
    setSkip(0);
    setSearchParams({});
  };

  const hasFilters = !!(type || city || priceMin || priceMax || bedroomsMin || debouncedSearch);

  return (
    <>
      <Helmet>
        <title>Propiedades — HomeMatch Inmobiliaria</title>
        <meta name="description" content="Explora nuestro catálogo de propiedades en Ecuador. Casas, departamentos, terrenos y más." />
      </Helmet>

      <PageHero
        imageUrl="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=80"
        imageAlt="Propiedades HomeMatch"
        title="Nuestras Propiedades"
        subtitle="Encuentra el inmueble ideal para ti"
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search bar */}
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Ej: casa en el norte de Quito, departamento Cumbayá..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSkip(0); }}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-9 pr-3 text-sm text-secondary outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              onClick={() => setShowFilters((p) => !p)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                showFilters || hasFilters
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              Filtros
              {hasFilters && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">!</span>}
            </button>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Collapsible filters */}
          {showFilters && (
            <div className="mt-4 grid gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2 lg:grid-cols-5">
              <select value={type} onChange={(e) => { setType(e.target.value as PropertyType | ''); setSkip(0); }} className={filterInput}>
                {TYPE_OPTS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
              <select value={city} onChange={(e) => { setCity(e.target.value); setSkip(0); }} className={filterInput}>
                <option value="">Todas las ciudades</option>
                {CITIES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" placeholder="Precio mínimo" value={priceMin}
                onChange={(e) => { setPriceMin(e.target.value); setSkip(0); }} className={filterInput} />
              <input type="number" placeholder="Precio máximo" value={priceMax}
                onChange={(e) => { setPriceMax(e.target.value); setSkip(0); }} className={filterInput} />
              <select value={bedroomsMin} onChange={(e) => { setBedroomsMin(e.target.value); setSkip(0); }} className={filterInput}>
                <option value="">Min. habitaciones</option>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+ habitaciones</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Search feedback */}
        {debouncedSearch.trim().length >= 2 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {feedbackLabel && (
              <p className="text-sm text-gray-600">{feedbackLabel}</p>
            )}
            {isPartial && (
              <span className="rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-secondary">
                Resultados aproximados
              </span>
            )}
          </div>
        )}

        {/* Count */}
        {data && !isEmpty && (
          <p className="mb-4 text-sm text-gray-500">
            <span className="font-semibold text-secondary">{data.total}</span>{' '}
            {data.total === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}
          </p>
        )}

        {/* Grid or states */}
        {isError ? (
          <div className="rounded-xl bg-red-50 p-6 text-center text-sm text-red-600">
            Error al cargar propiedades. Intenta de nuevo.
          </div>
        ) : isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: TAKE }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : isEmpty ? (
          /* Empty RI result with backend message */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <p className="mt-4 text-lg font-semibold text-secondary">Sin resultados</p>
            {apiMessage && (
              <p className="mt-2 max-w-md text-sm text-gray-500">{apiMessage}</p>
            )}
            <button
              onClick={clearFilters}
              className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Ver todas las propiedades
            </button>
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <p className="mt-4 text-lg font-semibold text-secondary">No encontramos propiedades</p>
            <p className="mt-1 text-sm text-gray-500">Prueba cambiando los filtros.</p>
            <button onClick={clearFilters} className="mt-5 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white">
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.items.map((p) => <PropertyWebCard key={p.id} property={p} />)}
          </div>
        )}

        {/* Pagination — only for regular (non-RI) queries */}
        {!useRI && totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-3">
            <button
              disabled={currentPage === 1}
              onClick={() => setSkip((p) => Math.max(0, p - TAKE))}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-40"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </button>
            <span className="rounded-xl bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setSkip((p) => p + TAKE)}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-40"
            >
              Siguiente
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
}

const filterInput = 'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-secondary outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20';
