import React from 'react';

type Variant = 'host' | 'uno' | 'turn' | 'mortgaged' | 'neutral';

interface BadgeProps {
  variant?: Variant;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const VARIANT_CLASS: Record<Variant, string> = {
  host: 'badge-host',
  uno: 'badge-uno',
  turn: 'badge-turn',
  mortgaged: 'badge-mortgaged',
  neutral: '',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', icon, children, className }) => (
  <span className={['badge', VARIANT_CLASS[variant], className].filter(Boolean).join(' ')}>
    {icon}
    {children}
  </span>
);
