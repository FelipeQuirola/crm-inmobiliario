import { useNavigate } from 'react-router-dom';
import { Flame, TrendingUp, Minus, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ScoreBadge } from '@/components/scoring/ScoreBadge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useScoringInsights } from '@/hooks/useLeadScore';

const TEMP_CONFIG = {
  HOT:  { label: 'HOT',  icon: Flame,      color: 'text-red-500',    bg: 'bg-red-50',    bar: 'bg-red-400' },
  WARM: { label: 'WARM', icon: TrendingUp,  color: 'text-amber-500',  bg: 'bg-amber-50',  bar: 'bg-amber-400' },
  COLD: { label: 'COLD', icon: Minus,       color: 'text-blue-500',   bg: 'bg-blue-50',   bar: 'bg-blue-400' },
} as const;

export function ScoringWidget() {
  const navigate = useNavigate();
  const { data, isLoading } = useScoringInsights();

  const total = data
    ? data.distribution.HOT + data.distribution.WARM + data.distribution.COLD
    : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Leads por temperatura
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground"
          onClick={() => navigate('/leads')}
        >
          Ver leads
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : !data || total === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Sin datos de scoring aún
          </p>
        ) : (
          <>
            {/* Distribution bars */}
            <div className="space-y-2">
              {(['HOT', 'WARM', 'COLD'] as const).map((temp) => {
                const cfg = TEMP_CONFIG[temp];
                const count = data.distribution[temp];
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const Icon = cfg.icon;
                return (
                  <div key={temp} className="flex items-center gap-3">
                    <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-xs text-slate-500">{count} leads ({pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className={`h-1.5 rounded-full transition-all ${cfg.bar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top leads */}
            {data.topLeads.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Top leads
                </p>
                <ul className="space-y-1.5">
                  {data.topLeads.slice(0, 5).map((lead, idx) => (
                    <li
                      key={lead.leadId}
                      className={`cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50 transition-colors ${idx >= 3 ? 'hidden sm:flex' : 'flex'}`}
                      onClick={() => navigate(`/leads/${lead.leadId}`)}
                    >
                      <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 mr-2">
                        {lead.assignedTo && (
                          <UserAvatar
                            name={lead.assignedTo.name}
                            avatarUrl={lead.assignedTo.avatarUrl}
                            size="xs"
                            className="flex-shrink-0"
                          />
                        )}
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {lead.firstName} {lead.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {lead.stage && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: lead.stage.color }}
                            />
                            {lead.stage.name}
                          </span>
                        )}
                        <ScoreBadge score={lead.score} temperature={lead.temperature} size="sm" />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
