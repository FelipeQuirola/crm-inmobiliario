import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Filter, SlidersHorizontal, Eye, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LeadsTable } from './LeadsTable';
import { LeadFormSheet } from './LeadFormSheet';
import { ImportLeadsSheet } from './ImportLeadsSheet';
import { LeadStatusBadge, LeadSourceBadge } from './LeadStatusBadge';
import { ScoreBadge } from '@/components/scoring/ScoreBadge';
import { useLeadsInfinite } from '@/hooks/useLeads';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import type { Lead, LeadStatus, ListLeadsParams } from '@/types';

const STATUS_OPTIONS: { value: LeadStatus | 'ALL'; label: string }[] = [
  { value: 'ALL',    label: 'Todos los estados' },
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'PAUSED', label: 'Pausado' },
  { value: 'WON',    label: 'Ganado' },
  { value: 'LOST',   label: 'Perdido' },
];

// Simple debounce hook
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ─── Mobile lead card ──────────────────────────────────────────────────────────

function LeadMobileCard({ lead }: { lead: Lead }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {lead.firstName} {lead.lastName}
          </p>
          <p className="text-sm text-gray-500">{lead.phone}</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <LeadStatusBadge status={lead.status} />
          {lead.score && (
            <ScoreBadge score={lead.score.score} temperature={lead.score.temperature} size="sm" />
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <LeadSourceBadge source={lead.source} />
          {lead.stage && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <span
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: lead.stage.color }}
              />
              {lead.stage.name}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate(`/leads/${lead.id}`)}>
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          Ver
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function LeadsPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'ADMIN';
  const debouncedSearch = useDebounced(search, 400);

  // Build query params
  const params: Omit<ListLeadsParams, 'cursor'> = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
    limit: 20,
  };

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useLeadsInfinite(params);

  const leads = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  // Reset scroll to top when filters change
  const tableRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    tableRef.current?.scrollTo({ top: 0 });
  }, [debouncedSearch, statusFilter]);

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          {!isLoading && (
            <p className="mt-0.5 text-sm text-gray-500">
              {total} {total === 1 ? 'resultado' : 'resultados'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Filter toggle — mobile only */}
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={() => setFiltersOpen((v) => !v)}
            title="Filtros"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          {isAdmin && (
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Importar</span>
            </Button>
          )}
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Nuevo lead</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Filters — always visible on md+, collapsible on mobile */}
      <div className={`${filtersOpen ? 'flex' : 'hidden'} md:flex flex-col gap-3 sm:flex-row`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o teléfono…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 sm:w-52">
          <Filter className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as LeadStatus | 'ALL')}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop table */}
      <div ref={tableRef} className="hidden md:block">
        <LeadsTable
          leads={leads}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={!!hasNextPage}
          onLoadMore={() => void fetchNextPage()}
        />
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-white p-4 animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))
        ) : leads.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed">
            <p className="text-sm text-muted-foreground">No se encontraron leads.</p>
          </div>
        ) : (
          leads.map((lead) => <LeadMobileCard key={lead.id} lead={lead} />)
        )}
        {hasNextPage && !isLoading && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Cargando…' : 'Cargar más'}
            </Button>
          </div>
        )}
      </div>

      {/* New lead sheet */}
      <LeadFormSheet open={sheetOpen} onOpenChange={setSheetOpen} />

      {/* Import sheet — ADMIN only */}
      <ImportLeadsSheet open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
