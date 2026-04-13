import { Flame, TrendingUp, Minus } from 'lucide-react';
import type { LeadTemperature } from '@/types';

interface ScoreBadgeProps {
  score: number;
  temperature: LeadTemperature;
  size?: 'sm' | 'md';
}

const TEMP_CONFIG: Record<LeadTemperature, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  HOT:  { icon: Flame,      color: '#ef4444', bg: '#fef2f2', label: 'HOT' },
  WARM: { icon: TrendingUp, color: '#f59e0b', bg: '#fffbeb', label: 'WARM' },
  COLD: { icon: Minus,      color: '#3b82f6', bg: '#eff6ff', label: 'COLD' },
};

export function ScoreBadge({ score, temperature, size = 'sm' }: ScoreBadgeProps) {
  const cfg = TEMP_CONFIG[temperature];
  const Icon = cfg.icon;
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full font-semibold flex-shrink-0 ${
        isSmall ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'
      }`}
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
      title={`Score: ${score}/100 (${cfg.label})`}
    >
      <Icon className={isSmall ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} />
      {score}
    </span>
  );
}
