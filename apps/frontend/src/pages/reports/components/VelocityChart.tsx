import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { VelocityStage } from '@/types';

interface Props {
  data: VelocityStage[] | undefined;
  isLoading: boolean;
}

export function VelocityChart({ data, isLoading }: Props) {
  const maxDays = data ? Math.max(...data.map((s) => s.avgDays), 1) : 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Velocidad por etapa (días promedio)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin datos de historial aún</p>
        ) : (
          <div className="space-y-4">
            {data.map((stage) => (
              <div key={stage.stageId}>
                <div className="flex items-center justify-between mb-1 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="text-sm text-slate-700 truncate">{stage.stageName}</span>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="text-sm font-semibold text-slate-900">{stage.avgDays}d</span>
                    {stage.sampleSize > 0 && (
                      <span className="ml-1.5 text-xs text-slate-400">
                        n={stage.sampleSize}
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: stage.avgDays > 0 ? `${(stage.avgDays / maxDays) * 100}%` : '0%',
                      backgroundColor: stage.color,
                    }}
                  />
                </div>
                {stage.sampleSize === 0 && (
                  <p className="text-xs text-slate-400 mt-0.5">Sin datos suficientes</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
