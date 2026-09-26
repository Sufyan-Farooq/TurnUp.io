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
    <img
      src="/favicon.svg"
      width={size}
      height={size}
      className={className}
      alt=""
      draggable={false}
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0, objectFit: 'contain' }}
    />
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
