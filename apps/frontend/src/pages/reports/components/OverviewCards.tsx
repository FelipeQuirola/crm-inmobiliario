import { Users, TrendingUp, Trophy, XCircle, Percent, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { OverviewReport } from '@/types';

interface CardDef {
  title:     string;
  value:     string | number;
  icon:      React.ElementType;
  iconColor: string;
  bgColor:   string;
}

interface OverviewCardsProps {
  data?:      OverviewReport;
  isLoading:  boolean;
}

export function OverviewCards({ data, isLoading }: OverviewCardsProps) {
  const cards: CardDef[] = [
    {
      title:     'Total leads',
      value:     data?.leads.total ?? 0,
      icon:      Users,
      iconColor: 'text-blue-600',
      bgColor:   'bg-blue-50',
    },
    {
      title:     'Leads nuevos',
      value:     data?.leads.new ?? 0,
      icon:      TrendingUp,
      iconColor: 'text-blue-500',
      bgColor:   'bg-blue-50',
    },
    {
      title:     'Leads ganados',
      value:     data?.leads.won ?? 0,
      icon:      Trophy,
      iconColor: 'text-emerald-600',
      bgColor:   'bg-emerald-50',
    },
    {
      title:     'Leads perdidos',
      value:     data?.leads.lost ?? 0,
      icon:      XCircle,
      iconColor: 'text-red-500',
      bgColor:   'bg-red-50',
    },
    {
      title:     'Tasa de conversión',
      value:     data ? `${data.conversion.overallRate}%` : '0%',
      icon:      Percent,
      iconColor: 'text-violet-600',
      bgColor:   'bg-violet-50',
    },
    {
      title:     'Tiempo prom. cierre',
      value:     data ? `${data.avgTimeToClose}d` : '0d',
      icon:      Clock,
      iconColor: 'text-amber-600',
      bgColor:   'bg-amber-50',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">
                {card.title}
              </CardTitle>
              <div className={`rounded-lg p-1.5 ${card.bgColor} flex-shrink-0`}>
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
