import React from 'react';
import { getPlayerColorHex } from '../../theme/playerColors';
import { getPlayerInitial } from '../../theme/playerIdentity';

type SizePreset = 'sm' | 'md' | 'lg';

const SIZE_PX: Record<SizePreset, number> = { sm: 28, md: 34, lg: 48 };

interface AvatarProps {
  name: string;
  isBot?: boolean;
  color?: string;
  size?: SizePreset | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Avatar: React.FC<AvatarProps> = ({ name, isBot = false, color, size = 'md', className, style }) => {
  const px = typeof size === 'number' ? size : SIZE_PX[size];
  const bg = getPlayerColorHex(color);
  const initial = getPlayerInitial(name, isBot);
  const channels = bg.slice(1).match(/../g)!.map(value => parseInt(value, 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return (
    <div
      className={['lobby-avatar', className].filter(Boolean).join(' ')}
      style={{ width: px, height: px, fontSize: px * 0.45, background: bg, color: luminance > 0.18 ? '#0d1a24' : '#f4f0e7', ...style }}
      aria-label={name}
    >
      {initial}
    </div>
  );
};
