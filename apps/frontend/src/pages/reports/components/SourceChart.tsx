import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { BySourceItem, LeadSource } from '@/types';

interface SourceChartProps {
  data?:     BySourceItem[];
  isLoading: boolean;
}

const SOURCE_LABELS: Record<LeadSource, string> = {
  MANUAL:   'Manual',
  WEBSITE:  'Sitio web',
  FACEBOOK: 'Facebook',
  GOOGLE:   'Google',
  WHATSAPP: 'WhatsApp',
  REFERRAL: 'Referido',
  OTHER:    'Otro',
};

const SOURCE_COLORS: Record<LeadSource, string> = {
  MANUAL:   '#6B7280',
  WEBSITE:  '#3b82f6',
  FACEBOOK: '#1877F2',
  GOOGLE:   '#EA4335',
  WHATSAPP: '#25D366',
  REFERRAL: '#8b5cf6',
  OTHER:    '#f59e0b',
};

interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: CustomLabelProps) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function SourceChart({ data, isLoading }: SourceChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Origen de leads</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-56 w-full" /></CardContent>
      </Card>
    );
  }

  const chartData = (data ?? []).filter((d) => d.count > 0).map((d) => ({
    name:       SOURCE_LABELS[d.source] ?? d.source,
    value:      d.count,
    percentage: d.percentage,
    color:      SOURCE_COLORS[d.source] ?? '#6B7280',
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Origen de leads</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Sin datos para mostrar</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                dataKey="value"
                labelLine={false}
                label={(props) => <CustomLabel {...(props as unknown as CustomLabelProps)} />}
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [
                  `${Number(value)} leads`,
                  name,
                ]}
                contentStyle={{ fontSize: 13 }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => {
                  const item = chartData.find((d) => d.name === value);
                  return `${value} (${item?.percentage ?? 0}%)`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
