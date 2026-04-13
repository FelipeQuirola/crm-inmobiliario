import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { TimelinePoint } from '@/types';

interface TimelineChartProps {
  data?:      TimelinePoint[];
  isLoading:  boolean;
  groupBy?:   'day' | 'week' | 'month';
  onGroupBy?: (g: 'day' | 'week' | 'month') => void;
}

const GROUP_LABELS: Record<string, string> = {
  day:   'Día',
  week:  'Semana',
  month: 'Mes',
};

function formatDate(dateStr: string, groupBy?: string): string {
  // dateStr is YYYY-MM or YYYY-MM-DD
  const parts = dateStr.split('-');
  if (groupBy === 'month') return `${parts[1]}/${parts[0].slice(2)}`;
  if (parts.length === 2)  return `${parts[1]}/${parts[0].slice(2)}`;
  return `${parts[2]}/${parts[1]}`;
}

export function TimelineChart({ data, isLoading, groupBy = 'day', onGroupBy }: TimelineChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Leads en el tiempo</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-56 w-full" /></CardContent>
      </Card>
    );
  }

  const chartData = (data ?? []).map((p) => ({
    ...p,
    label: formatDate(p.date, groupBy),
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Leads en el tiempo</CardTitle>
        {onGroupBy && (
          <div className="flex gap-1">
            {(['day', 'week', 'month'] as const).map((g) => (
              <button
                key={g}
                onClick={() => onGroupBy(g)}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  groupBy === g
                    ? 'bg-gray-900 text-white'
                    : 'text-muted-foreground hover:bg-gray-100'
                }`}
              >
                {GROUP_LABELS[g]}
              </button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Sin datos para el rango seleccionado</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: -8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#6B7280' }}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#6B7280' }}
              />
              <Tooltip contentStyle={{ fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="count"
                name="Nuevos"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="won"
                name="Ganados"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="lost"
                name="Perdidos"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
