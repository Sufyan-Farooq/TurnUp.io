import React from 'react';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...rest
}) => (
  <div className={['glass-panel', className].filter(Boolean).join(' ')} {...rest}>
    {children}
  </div>
);
