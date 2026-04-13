import { useState, useCallback } from 'react';
import { Plus, Loader2, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/store/auth.store';
import { useProperties } from '@/hooks/useProperties';
import { PropertyCard } from './PropertyCard';
import { PropertyFormSheet } from './PropertyFormSheet';
import type { PropertyType, PropertyStatus } from '@/types';

// ─── Filters state ────────────────────────────────────────────────────────────

interface Filters {
  search: string;
  type: PropertyType | '';
  status: PropertyStatus | '';
  priceMin: string;
  priceMax: string;
}

const INIT_FILTERS: Filters = {
  search: '',
  type: '',
  status: '',
  priceMin: '',
  priceMax: '',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PropertiesPage() {
  const currentRole = useAuthStore((s) => s.user?.role);
  const [filters, setFilters] = useState<Filters>(INIT_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const queryParams = {
    search: filters.search || undefined,
    type: (filters.type || undefined) as PropertyType | undefined,
    status: (filters.status || undefined) as PropertyStatus | undefined,
    priceMin: filters.priceMin ? Number(filters.priceMin) : undefined,
    priceMax: filters.priceMax ? Number(filters.priceMax) : undefined,
  };

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useProperties(queryParams);

  const properties = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const setFilter = useCallback(
    <K extends keyof Filters>(key: K, value: Filters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Propiedades</h1>
          {!isLoading && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {total} propiedad{total !== 1 ? 'es' : ''} en el inventario
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={() => setFiltersOpen((v) => !v)}
            title="Filtros"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          {currentRole === 'ADMIN' && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Nueva propiedad</span>
              <span className="sm:hidden">Nueva</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filters — always visible on md+, collapsible on mobile */}
      <div className={`${filtersOpen ? 'flex' : 'hidden'} md:flex flex-wrap gap-3`}>
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar propiedades..."
            className="pl-9"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
          />
        </div>

        <Select
          value={filters.type || 'all'}
          onValueChange={(v) => setFilter('type', v === 'all' ? '' : (v as PropertyType))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="CASA">Casa</SelectItem>
            <SelectItem value="APARTAMENTO">Apartamento</SelectItem>
            <SelectItem value="TERRENO">Terreno</SelectItem>
            <SelectItem value="OFICINA">Oficina</SelectItem>
            <SelectItem value="LOCAL">Local</SelectItem>
            <SelectItem value="BODEGA">Bodega</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status || 'all'}
          onValueChange={(v) => setFilter('status', v === 'all' ? '' : (v as PropertyStatus))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="DISPONIBLE">Disponible</SelectItem>
            <SelectItem value="RESERVADA">Reservada</SelectItem>
            <SelectItem value="VENDIDA">Vendida</SelectItem>
            <SelectItem value="INACTIVA">Inactiva</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <Input
            type="number"
            placeholder="Precio mín."
            className="w-28"
            value={filters.priceMin}
            onChange={(e) => setFilter('priceMin', e.target.value)}
          />
          <span className="text-gray-400">–</span>
          <Input
            type="number"
            placeholder="Precio máx."
            className="w-28"
            value={filters.priceMax}
            onChange={(e) => setFilter('priceMax', e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-xl" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed">
          <p className="text-sm text-muted-foreground">
            No se encontraron propiedades
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Cargar más
              </Button>
            </div>
          )}
        </>
      )}

      <PropertyFormSheet open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
