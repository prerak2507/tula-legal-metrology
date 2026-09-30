import React from 'react';

interface TulaLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'badge' | 'mark' | 'full' | 'simple';
  theme?: 'dark' | 'light';
  showSubtitle?: boolean;
}

export const TulaLogo: React.FC<TulaLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'simple',
  theme = 'light',
  showSubtitle = true,
}) => {
  const pixelSizes = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 72,
  };

  const px = pixelSizes[size];
  const isDark = theme === 'dark';

  // For badge variant, we use the badge logo image
  if (variant === 'badge') {
    const badgeSrc = isDark ? '/logo/tula-logo-badge-light.png' : '/logo/tula-logo-badge.png';
    return (
      <img
        src={badgeSrc}
        alt="Tula Badge"
        className={`shrink-0 ${className}`}
        style={{ width: px + 12, height: px + 12 }}
      />
    );
  }

  // For mark variant, we use the open mark logo image
  if (variant === 'mark') {
    const markSrc = isDark ? '/logo/tula-logo-open-reversed.png' : '/logo/tula-logo-open.png';
    return (
      <img
        src={markSrc}
        alt="Tula Mark"
        className={`inline-flex shrink-0 ${className}`}
        style={{ height: px, width: px }}
      />
    );
  }

  // For full and simple variants, use the horizontal logo with text
  const horizontalSrc = isDark ? '/logo/tula-logo-horizontal-dark.png' : '/logo/tula-logo-horizontal.png';

  return (
    <img
      src={horizontalSrc}
      alt="TULA"
      className={`inline-flex shrink-0 ${className}`}
      style={{ height: px * 1.5, objectFit: 'contain' }}
    />
  );
};
