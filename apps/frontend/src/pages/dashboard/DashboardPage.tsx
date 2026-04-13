import { useNavigate } from 'react-router-dom';
import {
  Users, TrendingUp, CheckCircle, XCircle,
  Phone, Calendar, ListTodo, ArrowRight,
  DollarSign, Target, Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { useOverviewReport } from '@/hooks/useReports';
import { useTodayEvents } from '@/hooks/useCalendar';
import { useProjectedRevenue } from '@/hooks/useFunnel';
import { ScoringWidget } from '@/components/dashboard/ScoringWidget';
import type { CalendarEventType } from '@/types';

// ─── Metric card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  title:     string;
  value:     number | string | undefined;
  icon:      React.ElementType;
  iconColor: string;
  bgColor:   string;
  isLoading: boolean;
  subtitle?: string;
}

function MetricCard({ title, value, icon: Icon, iconColor, bgColor, isLoading, subtitle }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`rounded-lg p-2 ${bgColor}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-9 w-24" />
        ) : (
          <>
            <p className="text-3xl font-bold text-foreground">{value ?? 0}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Funnel widget (SVG) ──────────────────────────────────────────────────────

function FunnelWidget() {
  const navigate = useNavigate();
  const { data, isLoading } = useProjectedRevenue();

  const formatMoney = (v: number) =>
    new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Embudo de ventas</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground"
          onClick={() => navigate('/pipeline')}
        >
          Ver pipeline
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded" style={{ width: `${100 - i * 10}%` }} />
            ))}
          </div>
        ) : !data || data.stages.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Sin datos</p>
        ) : (
          <div className="space-y-2">
            {data.stages.map((stage) => {
              const maxLeads = Math.max(...data.stages.map((s) => s.leadCount), 1);
              const widthPct = Math.max(30, (stage.leadCount / maxLeads) * 100);
              const indent = (100 - widthPct) / 2;

              return (
                <div key={stage.stageId} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-right text-slate-500 flex-shrink-0 truncate">
                    {stage.stageName}
                  </span>
                  <div className="flex-1 relative h-8">
                    <div
                      className="absolute h-8 rounded flex items-center justify-center transition-all"
                      style={{
                        left: `${indent}%`,
                        width: `${widthPct}%`,
                        backgroundColor: stage.color + '33',
                        border: `2px solid ${stage.color}`,
                      }}
                    >
                      <span className="text-xs font-semibold" style={{ color: stage.color }}>
                        {stage.leadCount} leads
                      </span>
                    </div>
                  </div>
                  <span className="w-20 text-xs text-slate-500 flex-shrink-0">
                    {stage.probability}%
                  </span>
                </div>
              );
            })}

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-xs text-slate-500">Pipeline total</p>
                <p className="text-sm font-bold text-slate-900">{formatMoney(data.totalPipeline)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Ingreso proyectado</p>
                <p className="text-sm font-bold text-emerald-600">{formatMoney(data.totalProjected)}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Today agenda ─────────────────────────────────────────────────────────────

const EVENT_ICON: Record<CalendarEventType, React.ElementType> = {
  MEETING: Calendar,
  CALL:    Phone,
  TASK:    ListTodo,
};

const EVENT_COLOR: Record<CalendarEventType, string> = {
  MEETING: 'text-violet-600 bg-violet-50',
  CALL:    'text-green-600 bg-green-50',
  TASK:    'text-blue-600 bg-blue-50',
};

function TodayAgenda() {
  const navigate = useNavigate();
  const { data: events, isLoading } = useTodayEvents();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Agenda de hoy</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground"
          onClick={() => navigate('/calendario')}
        >
          Ver calendario
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : !events || events.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No tienes eventos programados para hoy
          </p>
        ) : (
          <ul className="divide-y">
            {events.map((ev) => {
              const Icon = EVENT_ICON[ev.type];
              const color = EVENT_COLOR[ev.type];
              return (
                <li key={ev.id} className="flex items-start gap-3 py-3">
                  <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{ev.title}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{format(new Date(ev.startAt), 'HH:mm', { locale: es })}</span>
                      {ev.lead && (
                        <>
                          <span>·</span>
                          <button
                            className="truncate text-indigo-600 hover:underline"
                            onClick={() => navigate(`/leads/${ev.lead!.id}`)}
                          >
                            {ev.lead.firstName} {ev.lead.lastName}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    ev.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    ev.status === 'CANCELLED' ? 'bg-gray-100 text-gray-500 line-through' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {ev.status === 'COMPLETED' ? 'Hecho' :
                     ev.status === 'CANCELLED' ? 'Cancelado' : 'Pendiente'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: overview, isLoading } = useOverviewReport();
  const { data: projRevenue, isLoading: projLoading } = useProjectedRevenue();

  const formatMoney = (v: number) =>
    new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

  const metrics: MetricCardProps[] = [
    {
      title:     'Total leads',
      value:     overview?.leads.total,
      icon:      Users,
      iconColor: 'text-blue-600',
      bgColor:   'bg-blue-50',
      isLoading,
    },
    {
      title:     'Leads activos',
      value:     overview?.leads.active,
      icon:      TrendingUp,
      iconColor: 'text-emerald-600',
      bgColor:   'bg-emerald-50',
      isLoading,
    },
    {
      title:     'Ventas cerradas',
      value:     overview?.leads.won,
      icon:      CheckCircle,
      iconColor: 'text-violet-600',
      bgColor:   'bg-violet-50',
      isLoading,
    },
    {
      title:     'Leads perdidos',
      value:     overview?.leads.lost,
      icon:      XCircle,
      iconColor: 'text-red-500',
      bgColor:   'bg-red-50',
      isLoading,
    },
  ];

  const revenueMetrics: MetricCardProps[] = [
    {
      title:     'Revenue cerrado',
      value:     projLoading ? undefined : formatMoney(overview?.revenue.totalWon ?? 0),
      icon:      DollarSign,
      iconColor: 'text-emerald-600',
      bgColor:   'bg-emerald-50',
      isLoading: projLoading || isLoading,
      subtitle:  `Promedio ${formatMoney(overview?.revenue.averageDeal ?? 0)} por deal`,
    },
    {
      title:     'Pipeline activo',
      value:     projLoading ? undefined : formatMoney(overview?.revenue.pipeline ?? 0),
      icon:      Target,
      iconColor: 'text-blue-600',
      bgColor:   'bg-blue-50',
      isLoading: projLoading || isLoading,
    },
    {
      title:     'Ingreso proyectado',
      value:     projLoading ? undefined : formatMoney(projRevenue?.totalProjected ?? 0),
      icon:      TrendingUp,
      iconColor: 'text-amber-600',
      bgColor:   'bg-amber-50',
      isLoading: projLoading,
      subtitle:  'Basado en probabilidades',
    },
    {
      title:     'Tiempo prom. cierre',
      value:     isLoading ? undefined : `${overview?.avgTimeToClose ?? 0} días`,
      icon:      Clock,
      iconColor: 'text-slate-600',
      bgColor:   'bg-slate-100',
      isLoading,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user?.name ?? ''}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Aquí está el resumen de tu CRM inmobiliario
        </p>
      </div>

      {/* Lead metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Revenue metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {revenueMetrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Funnel + agenda */}
      <div className="grid gap-6 lg:grid-cols-2">
        <FunnelWidget />
        <TodayAgenda />
      </div>

      {/* Scoring + ... */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ScoringWidget />
      </div>
    </div>
  );
}
