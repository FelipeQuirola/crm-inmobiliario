import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProjectedRevenueReport } from '@/types';

interface Props {
  data: ProjectedRevenueReport | undefined;
  isLoading: boolean;
}

export function ProjectedRevenueChart({ data, isLoading }: Props) {
  const formatMoney = (v: number) =>
    new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(v);

  const maxPipeline = data
    ? Math.max(...data.stages.map((s) => s.pipeline), 1)
    : 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Revenue proyectado por etapa</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !data || data.stages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin datos</p>
        ) : (
          <>
            <div className="space-y-4">
              {data.stages.map((stage) => (
                <div key={stage.stageId}>
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="text-sm text-slate-700 truncate">{stage.stageName}</span>
                      <span className="text-xs text-slate-400 flex-shrink-0">{stage.probability}%</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-500">{formatMoney(stage.pipeline)}</p>
                      <p className="text-xs font-medium text-emerald-600">~{formatMoney(stage.projected)}</p>
                    </div>
                  </div>
                  <div className="relative h-3 rounded-full bg-slate-100">
                    {/* Pipeline bar */}
                    <div
                      className="absolute h-3 rounded-full opacity-30"
                      style={{
                        width: `${(stage.pipeline / maxPipeline) * 100}%`,
                        backgroundColor: stage.color,
                      }}
                    />
                    {/* Projected bar */}
                    <div
                      className="absolute h-3 rounded-full"
                      style={{
                        width: `${(stage.projected / maxPipeline) * 100}%`,
                        backgroundColor: stage.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">Pipeline total</p>
                <p className="text-lg font-bold text-slate-900">{formatMoney(data.totalPipeline)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">Proyectado</p>
                <p className="text-lg font-bold text-emerald-600">{formatMoney(data.totalProjected)}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
