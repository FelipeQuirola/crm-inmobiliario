import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ByStageItem, OverviewReport } from '@/types';

interface FunnelChartProps {
  stages?:      ByStageItem[];
  overview?:    OverviewReport;
  isLoading:    boolean;
}

const FALLBACK_COLOR = '#6B7280';

export function FunnelChart({ stages, overview, isLoading }: FunnelChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Embudo de ventas</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-56 w-full" /></CardContent>
      </Card>
    );
  }

  const stagesWithData = (stages ?? []).filter((s) => s.stage !== null);

  if (stagesWithData.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Embudo de ventas</CardTitle></CardHeader>
        <CardContent>
          <p className="py-10 text-center text-sm text-muted-foreground">Sin datos para mostrar</p>
        </CardContent>
      </Card>
    );
  }

  // Conversion rates between stages
  const convRates = [
    overview?.conversion.leadToOportunidad,
    overview?.conversion.oportunidadToCalificacion,
    overview?.conversion.calificacionToCierre,
  ];

  const chartData = stagesWithData.map((item, i) => ({
    name:       item.stage!.name,
    count:      item.count,
    color:      item.stage!.color || FALLBACK_COLOR,
    convRate:   i > 0 ? convRates[i - 1] : null,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Embudo de ventas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 64, left: 8, bottom: 4 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 13, fill: '#374151' }}
            />
            <Tooltip
              formatter={(value) => [Number(value), 'Leads']}
              contentStyle={{ fontSize: 13 }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={28}>
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                style={{ fontSize: 13, fontWeight: 600, fill: '#111827' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Conversion rates between stages */}
        {overview && stagesWithData.length >= 2 && (
          <div className="mt-4 flex flex-wrap gap-3 border-t pt-3">
            {stagesWithData.slice(1).map((item, i) => {
              const rate = convRates[i];
              if (rate == null) return null;
              const prevName = stagesWithData[i].stage!.name;
              const currName = item.stage!.name;
              return (
                <span key={i} className="text-xs text-muted-foreground">
                  {prevName} → {currName}:{' '}
                  <span className="font-semibold text-gray-800">{rate}%</span>
                </span>
              );
            })}
            <span className="text-xs text-muted-foreground">
              Conversión general:{' '}
              <span className="font-semibold text-emerald-700">
                {overview.conversion.overallRate}%
              </span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
