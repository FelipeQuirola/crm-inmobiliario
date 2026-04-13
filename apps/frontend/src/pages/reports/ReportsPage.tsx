import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth.store';
import {
  useOverviewReport,
  useByStageReport,
  useBySourceReport,
  useBySellerReport,
  useTimelineReport,
} from '@/hooks/useReports';
import { OverviewCards }          from './components/OverviewCards';
import { RevenueCards }           from './components/RevenueCards';
import { FunnelChart }            from './components/FunnelChart';
import { TimelineChart }          from './components/TimelineChart';
import { SourceChart }            from './components/SourceChart';
import { SellerTable }            from './components/SellerTable';
import { LostByReasonChart }      from './components/LostByReasonChart';
import { ProjectedRevenueChart }  from './components/ProjectedRevenueChart';
import { VelocityChart }          from './components/VelocityChart';
import { useLostByReason, useProjectedRevenue, useVelocity } from '@/hooks/useFunnel';

// ─── Date helpers ────────────────────────────────────────────────────────────

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek(): Date {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
}

function startOfYear(): Date {
  return new Date(new Date().getFullYear(), 0, 1, 0, 0, 0);
}

type QuickRange = 'today' | 'week' | 'month' | 'year';

const QUICK_RANGES: { label: string; key: QuickRange }[] = [
  { label: 'Hoy',       key: 'today' },
  { label: 'Semana',    key: 'week' },
  { label: 'Este mes',  key: 'month' },
  { label: 'Este año',  key: 'year' },
];

function rangeForQuick(key: QuickRange): { start: Date; end: Date } {
  const end = endOfToday();
  switch (key) {
    case 'today': return { start: startOfToday(), end };
    case 'week':  return { start: startOfWeek(), end };
    case 'year':  return { start: startOfYear(), end };
    default:      return { start: startOfMonth(), end };
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');

  // Default: this month
  const defaultStart = startOfMonth();
  const defaultEnd   = endOfToday();

  const [startDate, setStartDate] = useState(toDateInput(defaultStart));
  const [endDate,   setEndDate]   = useState(toDateInput(defaultEnd));
  const [activeQuick, setActiveQuick] = useState<QuickRange>('month');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  const startIso = new Date(startDate).toISOString();
  const endIso   = new Date(endDate + 'T23:59:59').toISOString();

  const handleQuick = (key: QuickRange) => {
    const { start, end } = rangeForQuick(key);
    setStartDate(toDateInput(start));
    setEndDate(toDateInput(end));
    setActiveQuick(key);
    // Adjust groupBy automatically
    if (key === 'today' || key === 'week') setGroupBy('day');
    else if (key === 'month')              setGroupBy('day');
    else                                   setGroupBy('month');
  };

  const { data: overview,  isLoading: loadingOverview  } = useOverviewReport(startIso, endIso);
  const { data: stages,    isLoading: loadingStages    } = useByStageReport();
  const { data: sources,   isLoading: loadingSources   } = useBySourceReport();
  const { data: sellers,   isLoading: loadingSellers   } = useBySellerReport(startIso, endIso);
  const { data: timeline,  isLoading: loadingTimeline  } = useTimelineReport(startIso, endIso, groupBy);
  const { data: projRevenue,  isLoading: loadingProj   } = useProjectedRevenue();
  const { data: lostReasons,  isLoading: loadingLost   } = useLostByReason();
  const { data: velocity,     isLoading: loadingVel    } = useVelocity();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>

        {/* Date range controls */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {/* Quick range buttons */}
          <div className="flex rounded-lg border p-0.5 bg-white gap-0.5">
            {QUICK_RANGES.map(({ label, key }) => (
              <button
                key={key}
                onClick={() => handleQuick(key)}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeQuick === key
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Manual date inputs */}
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setActiveQuick('' as QuickRange); }}
              className="h-8 w-36 text-sm"
            />
            <span className="text-sm text-muted-foreground">—</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setActiveQuick('' as QuickRange); }}
              className="h-8 w-36 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Overview metric cards */}
      <section>
        <OverviewCards data={overview} isLoading={loadingOverview} />
      </section>

      {/* Revenue cards */}
      <section>
        <RevenueCards data={overview} isLoading={loadingOverview} />
      </section>

      {/* Timeline + Source side by side */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TimelineChart
            data={timeline}
            isLoading={loadingTimeline}
            groupBy={groupBy}
            onGroupBy={setGroupBy}
          />
        </div>
        <div>
          <SourceChart data={sources} isLoading={loadingSources} />
        </div>
      </section>

      {/* Funnel */}
      <section>
        <FunnelChart
          stages={stages}
          overview={overview}
          isLoading={loadingStages || loadingOverview}
        />
      </section>

      {/* Projected revenue + Velocity side by side */}
      <section className="grid gap-6 lg:grid-cols-2">
        <ProjectedRevenueChart data={projRevenue} isLoading={loadingProj} />
        <VelocityChart data={velocity} isLoading={loadingVel} />
      </section>

      {/* Lost by reason */}
      <section>
        <LostByReasonChart data={lostReasons} isLoading={loadingLost} />
      </section>

      {/* Seller table — ADMIN only */}
      {isAdmin && (
        <section>
          <SellerTable data={sellers} isLoading={loadingSellers} />
        </section>
      )}
    </div>
  );
}
