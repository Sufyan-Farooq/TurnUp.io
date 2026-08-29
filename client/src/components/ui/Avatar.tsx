import React from 'react';
import { getPlayerColorHex } from '../../theme/playerColors';

type Size = 'sm' | 'md' | 'lg';

const SIZE_PX: Record<Size, number> = { sm: 28, md: 34, lg: 48 };

interface AvatarProps {
  name: string;
  color?: string;
  size?: Size;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, color, size = 'md', className }) => {
  const px = SIZE_PX[size];
  const bg = getPlayerColorHex(color);
  const initial = name?.trim()?.[0]?.toUpperCase() ?? '?';
  return (
    <div
      className={['lobby-avatar', className].filter(Boolean).join(' ')}
      style={{ width: px, height: px, fontSize: px * 0.45, background: bg, color: '#1B1140' }}
      aria-label={name}
    >
      {initial}
    </div>
  );
};
