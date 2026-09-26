import React from 'react';

export interface TurnUpLogoProps {
  /** Display mode: full (mark + text), mark only, or wordmark only */
  variant?: 'full' | 'mark' | 'wordmark';
  /** Preset size or custom pixel number */
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Optional click handler (e.g. navigate home) */
  onClick?: () => void;
  /** Extra CSS classes */
  className?: string;
  /** Extra inline styles */
  style?: React.CSSProperties;
  /** Whether the wordmark shows the .io suffix */
  showDomain?: boolean;
}

export const TurnUpMarkSvg: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="tu-mark-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#192e3e" />
          <stop offset="100%" stopColor="#0a151f" />
        </linearGradient>
        <linearGradient id="tu-mark-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffe39b" />
          <stop offset="45%" stopColor="#f0bc64" />
          <stop offset="100%" stopColor="#cf8a28" />
        </linearGradient>
        <linearGradient id="tu-mark-teal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#80dfcf" />
          <stop offset="100%" stopColor="#4aa896" />
        </linearGradient>
        <linearGradient id="tu-mark-coral" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff7d86" />
          <stop offset="100%" stopColor="#e84c56" />
        </linearGradient>
        <filter id="tu-mark-shadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Outer Felt Gaming Token */}
      <rect
        x="2.5"
        y="2.5"
        width="59"
        height="59"
        rx="16"
        fill="url(#tu-mark-bg)"
        stroke="#f0bc64"
        strokeWidth="2"
        strokeOpacity="0.45"
      />
      <rect
        x="5.5"
        y="5.5"
        width="53"
        height="53"
        rx="13"
        fill="none"
        stroke="#f4f0e7"
        strokeWidth="1"
        strokeOpacity="0.09"
      />

      {/* Dynamic Sweeping Turn-Up Loop */}
      <path
        d="M 18 36 C 18 44 24 49 32 49 C 41 49 48 43 48 33 C 48 21 37 15 25 15"
        stroke="url(#tu-mark-gold)"
        strokeWidth="4.8"
        strokeLinecap="round"
        fill="none"
        filter="url(#tu-mark-shadow)"
      />

      {/* Upward Launch Arrowhead */}
      <path
        d="M 32 9 L 23 15 L 30 22"
        stroke="url(#tu-mark-gold)"
        strokeWidth="4.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Three Semantic Player Token Pips (Gold, Teal, Coral) */}
      <circle cx="32" cy="33" r="4.2" fill="url(#tu-mark-gold)" stroke="#0a151f" strokeWidth="1.2" />
      <circle cx="23" cy="27" r="3.4" fill="url(#tu-mark-teal)" stroke="#0a151f" strokeWidth="1.2" />
      <circle cx="40" cy="25" r="3.4" fill="url(#tu-mark-coral)" stroke="#0a151f" strokeWidth="1.2" />
    </svg>
  );
};

export const TurnUpLogo: React.FC<TurnUpLogoProps> = ({
  variant = 'full',
  size = 'md',
  onClick,
  className = '',
  style,
  showDomain = true,
}) => {
  const getDimensions = () => {
    if (typeof size === 'number') {
      return {
        markSize: size,
        fontSize: Math.round(size * 0.65),
        domainSize: Math.round(size * 0.38),
        gap: Math.round(size * 0.22),
      };
    }
    switch (size) {
      case 'sm':
        return { markSize: 28, fontSize: 18, domainSize: 11, gap: 8 };
      case 'lg':
        return { markSize: 56, fontSize: 36, domainSize: 18, gap: 14 };
      case 'xl':
        return { markSize: 76, fontSize: 46, domainSize: 22, gap: 18 };
      case 'md':
      default:
        return { markSize: 40, fontSize: 26, domainSize: 14, gap: 10 };
    }
  };

  const { markSize, fontSize, domainSize, gap } = getDimensions();

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label="turnUp.io"
      className={`turnup-logo turnup-logo--${variant} ${onClick ? 'turnup-logo--interactive' : ''} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${gap}px`,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        textDecoration: 'none',
        ...style,
      }}
    >
      {(variant === 'full' || variant === 'mark') && (
        <TurnUpMarkSvg size={markSize} className="turnup-logo__mark" />
      )}

      {(variant === 'full' || variant === 'wordmark') && (
        <span
          className="turnup-logo__text"
          style={{
            fontFamily: "'Fredoka', sans-serif",
            fontWeight: 700,
            fontSize: `${fontSize}px`,
            lineHeight: 1,
            letterSpacing: '-0.025em',
            display: 'inline-flex',
            alignItems: 'baseline',
          }}
        >
          <span style={{ color: 'var(--cloud, #f4f0e7)' }}>turn</span>
          <span style={{ color: 'var(--gold, #f0bc64)' }}>Up</span>
          {showDomain && (
            <span
              style={{
                color: 'var(--cloud-dim, #d5dcd8)',
                opacity: 0.55,
                fontSize: `${domainSize}px`,
                fontWeight: 600,
                marginLeft: '1px',
              }}
            >
              .io
            </span>
          )}
        </span>
      )}
    </div>
  );
};
