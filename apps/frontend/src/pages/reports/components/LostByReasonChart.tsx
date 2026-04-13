import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LostByReasonItem } from '@/types';

interface Props {
  data: LostByReasonItem[] | undefined;
  isLoading: boolean;
}

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#06b6d4',
  '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b',
];

export function LostByReasonChart({ data, isLoading }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Leads perdidos por motivo</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay datos de pérdidas aún
          </p>
        ) : (
          <div className="space-y-3">
            {data.map((item, idx) => (
              <div key={item.lossReasonId ?? 'none'}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700 truncate max-w-[200px]" title={item.lossReasonName}>
                    {item.lossReasonName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">{item.count}</span>
                    <span className="text-xs text-slate-400 w-10 text-right">{item.percentage}%</span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: COLORS[idx % COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
