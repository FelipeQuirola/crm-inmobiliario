import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { formatUSD } from '@/lib/utils';
import type { BySellerItem } from '@/types';

interface SellerTableProps {
  data?:     BySellerItem[];
  isLoading: boolean;
}

type SortKey = keyof Pick<BySellerItem, 'name' | 'conversionRate' | 'avgTimeToClose' | 'revenue'> | 'assigned' | 'active' | 'won' | 'lost';
type SortDir = 'asc' | 'desc';

function ConversionBadge({ rate }: { rate: number }) {
  const cls =
    rate >= 30 ? 'bg-emerald-100 text-emerald-700' :
    rate >= 10 ? 'bg-amber-100 text-amber-700' :
                 'bg-red-100 text-red-600';
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {rate.toFixed(1)}%
    </span>
  );
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="ml-1 inline h-3 w-3 text-gray-400" />;
  return sortDir === 'asc'
    ? <ChevronUp className="ml-1 inline h-3 w-3 text-gray-700" />
    : <ChevronDown className="ml-1 inline h-3 w-3 text-gray-700" />;
}

function getVal(row: BySellerItem, key: SortKey): number | string {
  switch (key) {
    case 'name':           return row.name;
    case 'assigned':       return row.leads.assigned;
    case 'active':         return row.leads.active;
    case 'won':            return row.leads.won;
    case 'lost':           return row.leads.lost;
    case 'conversionRate': return row.conversionRate;
    case 'avgTimeToClose': return row.avgTimeToClose;
    case 'revenue':        return row.revenue;
    default:               return 0;
  }
}

export function SellerTable({ data, isLoading }: SellerTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('assigned');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...(data ?? [])].sort((a, b) => {
    const va = getVal(a, sortKey);
    const vb = getVal(b, sortKey);
    const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const cols: { label: string; key: SortKey; align: 'left' | 'right' }[] = [
    { label: 'Vendedor',             key: 'name',           align: 'left' },
    { label: 'Asignados',            key: 'assigned',       align: 'right' },
    { label: 'Activos',              key: 'active',         align: 'right' },
    { label: 'Ganados',              key: 'won',            align: 'right' },
    { label: 'Perdidos',             key: 'lost',           align: 'right' },
    { label: 'Conversión',           key: 'conversionRate', align: 'right' },
    { label: 'T. prom. cierre',      key: 'avgTimeToClose', align: 'right' },
    { label: 'Revenue',              key: 'revenue',        align: 'right' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rendimiento por vendedor</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Sin vendedores activos</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  {cols.map((col) => (
                    <th
                      key={col.key}
                      className={`cursor-pointer select-none whitespace-nowrap px-4 py-3 text-xs font-semibold text-muted-foreground hover:text-gray-900 ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                      <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, i) => (
                  <tr key={row.userId} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <UserAvatar name={row.name} avatarUrl={row.avatarUrl} size="sm" />
                        <span className="font-medium text-gray-900">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.leads.assigned}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.leads.active}</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-700">{row.leads.won}</td>
                    <td className="px-4 py-3 text-right text-red-600">{row.leads.lost}</td>
                    <td className="px-4 py-3 text-right">
                      <ConversionBadge rate={row.conversionRate} />
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {row.avgTimeToClose > 0 ? `${row.avgTimeToClose}d` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatUSD(row.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
