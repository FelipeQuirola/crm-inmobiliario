import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LeadStatusBadge, LeadSourceBadge } from './LeadStatusBadge';
import { ScoreBadge } from '@/components/scoring/ScoreBadge';
import type { Lead } from '@/types';

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 9 }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function LeadsTable({
  leads,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
}: LeadsTableProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Origen</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead>Asignado a</TableHead>
            <TableHead>Creado</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton />
          ) : leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                No se encontraron leads. Crea el primero.
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id}>
                {/* Nombre */}
                <TableCell className="font-medium">
                  {lead.firstName} {lead.lastName}
                </TableCell>

                {/* Teléfono */}
                <TableCell className="text-sm text-gray-600">{lead.phone}</TableCell>

                {/* Origen */}
                <TableCell>
                  <LeadSourceBadge source={lead.source} />
                </TableCell>

                {/* Estado */}
                <TableCell>
                  <LeadStatusBadge status={lead.status} />
                </TableCell>

                {/* Score */}
                <TableCell>
                  {lead.score ? (
                    <ScoreBadge score={lead.score.score} temperature={lead.score.temperature} size="sm" />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Etapa */}
                <TableCell className="text-sm">
                  {lead.stage ? (
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: lead.stage.color }}
                      />
                      {lead.stage.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Sin etapa</span>
                  )}
                </TableCell>

                {/* Asignado a */}
                <TableCell className="text-sm">
                  {lead.assignedTo ? (
                    lead.assignedTo.name
                  ) : (
                    <span className="text-muted-foreground">Sin asignar</span>
                  )}
                </TableCell>

                {/* Fecha */}
                <TableCell className="text-sm text-gray-500">
                  {format(new Date(lead.createdAt), 'd MMM yyyy', { locale: es })}
                </TableCell>

                {/* Acciones */}
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Ver detalle"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Load more */}
      {hasNextPage && (
        <div className="flex justify-center border-t p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando…
              </>
            ) : (
              'Cargar más'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
