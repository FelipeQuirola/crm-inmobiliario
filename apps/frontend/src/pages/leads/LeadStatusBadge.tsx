import { Badge } from '@/components/ui/badge';
import type { LeadSource, LeadStatus } from '@/types';

// ─── Status ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; variant: 'success' | 'default' | 'destructive' | 'muted' }
> = {
  ACTIVE:  { label: 'Activo',  variant: 'success' },
  WON:     { label: 'Ganado',  variant: 'default' },
  LOST:    { label: 'Perdido', variant: 'destructive' },
  PAUSED:  { label: 'Pausado', variant: 'muted' },
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const { label, variant } = STATUS_CONFIG[status];
  return <Badge variant={variant}>{label}</Badge>;
}

// ─── Source ───────────────────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<LeadSource, { label: string; className: string }> = {
  MANUAL:   { label: 'Manual',    className: 'bg-gray-100 text-gray-700' },
  WEBSITE:  { label: 'Sitio web', className: 'bg-blue-100 text-blue-700' },
  FACEBOOK: { label: 'Facebook',  className: 'bg-indigo-100 text-indigo-700' },
  GOOGLE:   { label: 'Google',    className: 'bg-green-100 text-green-700' },
  WHATSAPP: { label: 'WhatsApp',  className: 'bg-emerald-100 text-emerald-700' },
  REFERRAL: { label: 'Referido',  className: 'bg-purple-100 text-purple-700' },
  OTHER:    { label: 'Otro',      className: 'bg-slate-100 text-slate-600' },
};

export function LeadSourceBadge({ source }: { source: LeadSource }) {
  const { label, className } = SOURCE_CONFIG[source];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
