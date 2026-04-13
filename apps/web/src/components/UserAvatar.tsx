import { useState } from 'react';
import { buildImageUrl } from '@/lib/utils';

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


const SIZE_STYLES: Record<string, { size: number; fontSize: number; borderRadius: number }> = {
  xs: { size: 24, fontSize: 10, borderRadius: 24 },
  sm: { size: 32, fontSize: 12, borderRadius: 32 },
  md: { size: 40, fontSize: 14, borderRadius: 40 },
  lg: { size: 64, fontSize: 20, borderRadius: 64 },
  xl: { size: 96, fontSize: 28, borderRadius: 96 },
};

export interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  style?: React.CSSProperties;
}

export function UserAvatar({ name, avatarUrl, size = 'md', className, style }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);
  const bg = getAvatarColor(name);
  const sz = SIZE_STYLES[size];
  const showImg = !!avatarUrl && !imgError;
  const src = buildImageUrl(avatarUrl);

  return (
    <div
      className={className}
      style={{
        width: sz.size,
        height: sz.size,
        borderRadius: sz.size,
        backgroundColor: showImg ? undefined : bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        fontWeight: 700,
        fontSize: sz.fontSize,
        color: 'white',
        ...style,
      }}
      title={name}
    >
      {showImg ? (
        <img
          src={src}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}
