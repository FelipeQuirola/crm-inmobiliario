import { useState } from 'react';
import { cn, buildImageUrl } from '@/lib/utils';

const AVATAR_COLORS = [
  '#006031', '#23103B', '#B5C032',
  '#0ea5e9', '#8b5cf6', '#f59e0b',
  '#ef4444', '#10b981', '#f97316',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}


const SIZE_CLASSES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-24 w-24 text-2xl',
} as const;

export interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

export function UserAvatar({ name, avatarUrl, size = 'md', className }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);
  const bg = getAvatarColor(name);
  const sizeClass = SIZE_CLASSES[size];

  const showImg = !!avatarUrl && !imgError;
  const src = buildImageUrl(avatarUrl);

  return (
    <div
      className={cn(
        'flex flex-shrink-0 items-center justify-center rounded-full font-bold text-white overflow-hidden',
        sizeClass,
        className,
      )}
      style={showImg ? undefined : { backgroundColor: bg }}
      title={name}
    >
      {showImg ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}
