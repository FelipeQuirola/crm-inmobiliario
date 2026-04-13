import { DollarSign, TrendingUp, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatUSD } from '@/lib/utils';
import type { OverviewReport } from '@/types';

interface RevenueCardsProps {
  data?:     OverviewReport;
  isLoading: boolean;
}

export function RevenueCards({ data, isLoading }: RevenueCardsProps) {
  const cards = [
    {
      title:     'Revenue generado',
      value:     formatUSD(data?.revenue.totalWon ?? 0),
      subtitle:  'Leads cerrados (WON)',
      icon:      DollarSign,
      iconColor: 'text-emerald-600',
      bgColor:   'bg-emerald-50',
    },
    {
      title:     'Pipeline actual',
      value:     formatUSD(data?.revenue.pipeline ?? 0),
      subtitle:  'Leads activos',
      icon:      TrendingUp,
      iconColor: 'text-blue-600',
      bgColor:   'bg-blue-50',
    },
    {
      title:     'Deal promedio',
      value:     formatUSD(data?.revenue.averageDeal ?? 0),
      subtitle:  'Por lead ganado',
      icon:      BarChart2,
      iconColor: 'text-violet-600',
      bgColor:   'bg-violet-50',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${card.bgColor}`}>
                <Icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-9 w-32" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.subtitle}</p>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
