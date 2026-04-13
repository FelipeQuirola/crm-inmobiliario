import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  UserCheck,
  Layers,
  DollarSign,
  CheckSquare,
  Clock,
  XCircle,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LeadStatusBadge, LeadSourceBadge } from './LeadStatusBadge';
import { ActivityTimeline } from './ActivityTimeline';
import { LogActivityPanel } from './LogActivityPanel';
import { LeadPropertiesSection } from './LeadPropertiesSection';
import { SendWhatsAppPanel } from './SendWhatsAppPanel';
import { SendEmailPanel } from './SendEmailPanel';
import { MessageHistory } from './MessageHistory';
import { ScoreBadge } from '@/components/scoring/ScoreBadge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useLead, useTenantUsers } from '@/hooks/useLeads';
import { useLeadChecklist, useToggleLeadChecklistItem, useLeadStageHistory } from '@/hooks/useFunnel';
import { useLeadScore, useRecalculateScore } from '@/hooks/useLeadScore';
import { useAuthStore } from '@/store/auth.store';
import { formatUSD } from '@/lib/utils';
import { leadsService } from '@/services/leads.service';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 text-sm font-medium text-gray-900">{value}</div>
      </div>
    </div>
  );
}

// ─── Stage timeline ───────────────────────────────────────────────────────────

function StageTimeline({ leadId }: { leadId: string }) {
  const { data: history = [], isLoading } = useLeadStageHistory(leadId);

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (history.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-500" />
          Historial de etapas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative border-l border-slate-200 ml-2 space-y-4">
          {history.map((h, idx) => (
            <li key={h.id} className="ml-4">
              <span
                className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white"
                style={{ backgroundColor: h.stage?.color ?? '#6B7280' }}
              />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-900">{h.stageName}</span>
                {h.daysInStage !== null && (
                  <Badge variant="outline" className="text-xs">
                    {h.daysInStage} {h.daysInStage === 1 ? 'día' : 'días'}
                  </Badge>
                )}
                {!h.exitedAt && idx === history.length - 1 && (
                  <Badge className="text-xs bg-blue-100 text-blue-700">Actual</Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {format(new Date(h.enteredAt), "d MMM yyyy", { locale: es })}
                {h.exitedAt && ` → ${format(new Date(h.exitedAt), "d MMM yyyy", { locale: es })}`}
              </p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

// ─── Checklist card ───────────────────────────────────────────────────────────

function ChecklistCard({ leadId }: { leadId: string }) {
  const { data: items = [], isLoading } = useLeadChecklist(leadId);
  const toggle = useToggleLeadChecklistItem(leadId);

  if (isLoading) return <Skeleton className="h-24 w-full" />;
  if (items.length === 0) return null;

  const doneCount = items.filter((i) => i.isDone).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-slate-500" />
            Checklist de etapa
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {doneCount}/{items.length}
          </Badge>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
          <div
            className="h-1.5 rounded-full bg-emerald-500 transition-all"
            style={{ width: `${items.length > 0 ? (doneCount / items.length) * 100 : 0}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={item.isDone}
              onChange={(e) =>
                toggle.mutate({ checklistId: item.id, isDone: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 cursor-pointer"
            />
            <span className={`text-sm flex-1 ${item.isDone ? 'line-through text-slate-400' : 'text-slate-700'}`}>
              {item.text}
            </span>
            {item.doneAt && (
              <span className="text-xs text-slate-400 flex-shrink-0">
                {formatDistanceToNow(new Date(item.doneAt), { locale: es, addSuffix: true })}
              </span>
            )}
          </label>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Score panel ─────────────────────────────────────────────────────────────

function ScorePanel({ leadId }: { leadId: string }) {
  const { data: score, isLoading } = useLeadScore(leadId);
  const recalculate = useRecalculateScore(leadId);

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  if (!score) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Análisis de potencial</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="text-sm text-slate-500">Aún no se ha calculado el score de este lead.</p>
          <Button
            size="sm"
            onClick={() => recalculate.mutate()}
            disabled={recalculate.isPending}
          >
            {recalculate.isPending ? (
              <><RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />Calculando…</>
            ) : (
              <><RefreshCw className="mr-2 h-3.5 w-3.5" />Calcular score</>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const urgencyColor = score.urgency === 'ALTA'
    ? 'bg-red-100 text-red-700'
    : score.urgency === 'MEDIA'
    ? 'bg-amber-100 text-amber-700'
    : 'bg-slate-100 text-slate-600';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Análisis de potencial</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Recalcular score"
            onClick={() => recalculate.mutate()}
            disabled={recalculate.isPending}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${recalculate.isPending ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score bar + badge */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <ScoreBadge score={score.score} temperature={score.temperature} size="md" />
            <Badge className={`text-xs ${urgencyColor}`}>
              Urgencia {score.urgency}
            </Badge>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div
              className={`h-2 rounded-full transition-all ${
                score.temperature === 'HOT' ? 'bg-red-500' :
                score.temperature === 'WARM' ? 'bg-amber-400' : 'bg-blue-400'
              }`}
              style={{ width: `${score.score}%` }}
            />
          </div>
          <p className="text-right text-xs text-slate-400">{score.score}/100</p>
        </div>

        {/* Reasoning */}
        {score.reasoning && (
          <p className="text-xs text-slate-600 leading-relaxed">{score.reasoning}</p>
        )}

        {/* Recommendation */}
        {score.recommendation && (
          <div className="rounded-lg bg-indigo-50 p-2.5">
            <p className="text-xs font-medium text-indigo-700">Recomendación</p>
            <p className="mt-0.5 text-xs text-indigo-600">{score.recommendation}</p>
          </div>
        )}

        {/* Signals */}
        {(score.positiveSignals.length > 0 || score.negativeSignals.length > 0) && (
          <div className="space-y-2">
            {score.positiveSignals.length > 0 && (
              <div>
                <p className="mb-1 flex items-center gap-1 text-xs font-medium text-emerald-700">
                  <ThumbsUp className="h-3 w-3" /> Señales positivas
                </p>
                <ul className="space-y-0.5">
                  {score.positiveSignals.map((s, i) => (
                    <li key={i} className="text-xs text-slate-600">· {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {score.negativeSignals.length > 0 && (
              <div>
                <p className="mb-1 flex items-center gap-1 text-xs font-medium text-red-600">
                  <ThumbsDown className="h-3 w-3" /> Señales negativas
                </p>
                <ul className="space-y-0.5">
                  {score.negativeSignals.map((s, i) => (
                    <li key={i} className="text-xs text-slate-600">· {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <p className="text-[10px] text-slate-400">
          Actualizado {formatDistanceToNow(new Date(score.lastCalculatedAt), { locale: es, addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Page skeleton ────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: lead, isLoading, isError } = useLead(id ?? '');
  const { data: users } = useTenantUsers();
  const currentRole = useAuthStore((s) => s.user?.role);
  const qc = useQueryClient();
  const [assigning, setAssigning]       = useState(false);
  const [commTab,   setCommTab]         = useState<'whatsapp' | 'email' | 'history'>('whatsapp');

  const activeUsers = users?.filter((u) => u.isActive) ?? [];

  const handleReassign = async (assignedToId: string) => {
    if (!id) return;
    setAssigning(true);
    try {
      await leadsService.assign(id, assignedToId === '__none__' ? null : assignedToId);
      void qc.invalidateQueries({ queryKey: ['leads', id] });
      void qc.invalidateQueries({ queryKey: ['leads'] });
      void qc.invalidateQueries({ queryKey: ['pipeline'] });
      toast.success('Lead reasignado correctamente');
    } catch {
      toast.error('Error al reasignar lead');
    } finally {
      setAssigning(false);
    }
  };

  if (isLoading) return <PageSkeleton />;

  if (isError || !lead) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-medium text-gray-700">Lead no encontrado</p>
        <Button variant="outline" onClick={() => navigate('/leads')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a leads
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/leads')}
          title="Volver a leads"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {lead.firstName} {lead.lastName}
          </h1>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <LeadStatusBadge status={lead.status} />
            <LeadSourceBadge source={lead.source} />
            {lead.daysInCurrentStage > 0 && (
              <Badge variant="outline" className="text-xs text-slate-500">
                <Clock className="h-3 w-3 mr-1" />
                {lead.daysInCurrentStage}d en etapa
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left column ─────────────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">

          {/* Contact & pipeline info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Información del lead</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InfoRow icon={Phone} label="Teléfono" value={lead.phone} />

              <InfoRow
                icon={Mail}
                label="Email"
                value={lead.email ?? <span className="text-muted-foreground">Sin email</span>}
              />

              <InfoRow
                icon={DollarSign}
                label="Presupuesto (USD)"
                value={
                  lead.budget != null
                    ? formatUSD(lead.budget)
                    : <span className="text-muted-foreground">No indicado</span>
                }
              />

              <InfoRow
                icon={Layers}
                label="Etapa"
                value={
                  lead.stage ? (
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: lead.stage.color }}
                      />
                      {lead.stage.name}
                      {(lead.stage as { probability?: number }).probability !== undefined && (
                        <span className="text-xs text-slate-400 ml-1">
                          {(lead.stage as { probability: number }).probability}%
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Sin etapa</span>
                  )
                }
              />

              {/* Assignee — inline select for ADMIN, static for VENDEDOR */}
              {currentRole === 'ADMIN' ? (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <UserCheck className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Asignado a
                    </p>
                    <Select
                      value={lead.assignedToId ?? '__none__'}
                      onValueChange={handleReassign}
                      disabled={assigning}
                    >
                      <SelectTrigger className="mt-0.5 h-8 text-sm font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sin asignar</SelectItem>
                        {activeUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <UserCheck className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Asignado a</p>
                    {lead.assignedTo ? (
                      <div className="mt-0.5 flex items-center gap-2">
                        <UserAvatar name={lead.assignedTo.name} avatarUrl={lead.assignedTo.avatarUrl} size="sm" />
                        <span className="text-sm font-medium">{lead.assignedTo.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin asignar</span>
                    )}
                  </div>
                </div>
              )}

              <InfoRow
                icon={Calendar}
                label="Fecha de creación"
                value={format(new Date(lead.createdAt), "d 'de' MMMM yyyy", { locale: es })}
              />
            </CardContent>
          </Card>

          {/* Loss reason (when LOST) */}
          {lead.status === 'LOST' && (lead.lossReason || lead.lostReason) && (
            <Card className="border-red-200 bg-red-50/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-red-700">
                  <XCircle className="h-4 w-4" />
                  Motivo de pérdida
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-800">
                  {(lead.lossReason as { name?: string } | null)?.name ?? lead.lostReason}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Stage checklist */}
          <ChecklistCard leadId={lead.id} />

          {/* Stage history */}
          <StageTimeline leadId={lead.id} />

          {/* Property interest */}
          {lead.propertyInterest && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">¿Qué busca?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-gray-700">{lead.propertyInterest}</p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {lead.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-gray-700">{lead.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Properties */}
          <Card>
            <CardContent className="p-4">
              <LeadPropertiesSection leadId={lead.id} />
            </CardContent>
          </Card>

          {/* ── Comunicación ──────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Comunicación</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {/* Tabs */}
              <div className="mb-4 flex rounded-lg border p-0.5 bg-gray-50 gap-0.5">
                {([
                  { key: 'whatsapp', label: 'WhatsApp' },
                  { key: 'email',    label: 'Email' },
                  { key: 'history',  label: 'Historial' },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setCommTab(key)}
                    className={`flex-1 rounded py-1.5 text-xs font-medium transition-colors ${
                      commTab === key
                        ? 'bg-white shadow-sm text-gray-900'
                        : 'text-muted-foreground hover:text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {commTab === 'whatsapp' && <SendWhatsAppPanel lead={lead} />}
              {commTab === 'email'    && <SendEmailPanel    lead={lead} />}
              {commTab === 'history'  && <MessageHistory    leadId={lead.id} />}
            </CardContent>
          </Card>
        </div>

        {/* ── Right column — Score + Bitácora ─────────────────────── */}
        <div className="space-y-6">
          <ScorePanel leadId={lead.id} />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Bitácora</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <LogActivityPanel leadId={lead.id} />
              <ActivityTimeline leadId={lead.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
