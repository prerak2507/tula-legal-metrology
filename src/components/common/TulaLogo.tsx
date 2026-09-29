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

  // Palette from the official logo asset
  // Navy: #1F497D, Blue: #0070C0, Sky: #7FB1DE, Green: #1B7F5A, Ice: #E8EEF7
  const isDark = theme === 'dark';
  const beamColor = isDark ? '#FFFFFF' : '#1F497D';
  const weightColor = isDark ? '#7FB1DE' : '#0070C0';
  const qrColor = isDark ? '#FFFFFF' : '#1F497D';
  const checkBg = '#1B7F5A';

  // Mark SVG
  const MarkSvg = (
    <svg
      width={px}
      height={px}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-300 group-hover:scale-105"
    >
      {/* Central Pillar & Base */}
      <path d="M 50 32 L 50 78" stroke={beamColor} strokeWidth="5.5" strokeLinecap="round" />
      <path d="M 36 78 L 64 78" stroke={beamColor} strokeWidth="6" strokeLinecap="round" />

      {/* Main Balance Beam */}
      <path d="M 18 32 L 82 32" stroke={beamColor} strokeWidth="5.5" strokeLinecap="round" />

      {/* Top Green Verification Circle with Checkmark */}
      <circle cx="50" cy="22" r="8" fill={checkBg} />
      <path d="M 46.5 22 L 49 24.5 L 53.5 20" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Left Pan: Weight (Triangle) */}
      <path d="M 26 34 L 18 52 M 34 34 L 42 52" stroke={beamColor} strokeWidth="2.2" strokeOpacity="0.75" strokeLinecap="round" />
      <path d="M 14 52 L 46 52" stroke={beamColor} strokeWidth="3" strokeLinecap="round" />
      <path d="M 30 40 L 19 51 L 41 51 Z" fill={weightColor} />

      {/* Right Pan: Digital QR Matrix */}
      <path d="M 66 34 L 58 52 M 74 34 L 82 52" stroke={beamColor} strokeWidth="2.2" strokeOpacity="0.75" strokeLinecap="round" />
      <path d="M 54 52 L 86 52" stroke={beamColor} strokeWidth="3" strokeLinecap="round" />
      {/* QR Blocks */}
      <g transform="translate(59, 38)">
        <rect x="0" y="0" width="6" height="6" fill={qrColor} rx="1" />
        <rect x="1.5" y="1.5" width="3" height="3" fill={isDark ? '#1F497D' : '#FFFFFF'} />
        <rect x="15" y="0" width="6" height="6" fill={qrColor} rx="1" />
        <rect x="16.5" y="1.5" width="3" height="3" fill={isDark ? '#1F497D' : '#FFFFFF'} />
        <rect x="0" y="8" width="6" height="6" fill={qrColor} rx="1" />
        <rect x="1.5" y="9.5" width="3" height="3" fill={isDark ? '#1F497D' : '#FFFFFF'} />
        <rect x="8" y="1" width="4.5" height="3" fill={weightColor} rx="0.5" />
        <rect x="8" y="6" width="4.5" height="4.5" fill={qrColor} rx="0.5" />
        <rect x="15" y="8" width="6" height="3" fill={weightColor} rx="0.5" />
        <rect x="8" y="12" width="3" height="2.5" fill={qrColor} rx="0.5" />
        <rect x="13" y="12" width="8" height="2.5" fill={weightColor} rx="0.5" />
      </g>
    </svg>
  );

  // Badge format (white squircle background)
  if (variant === 'badge') {
    return (
      <div
        className={`rounded-2xl bg-white shadow-md border border-slate-200/90 p-2 flex items-center justify-center shrink-0 ${className}`}
        style={{ width: px + 12, height: px + 12 }}
      >
        {MarkSvg}
      </div>
    );
  }

  // Standalone mark
  if (variant === 'mark') {
    return <div className={`inline-flex shrink-0 ${className}`}>{MarkSvg}</div>;
  }

  // Full brand lockup with subtitle
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Icon Badge */}
      <div
        className={`rounded-xl flex items-center justify-center shrink-0 ${
          isDark
            ? 'bg-white/10 backdrop-blur-md border border-white/20 shadow-xs'
            : 'bg-white shadow-xs border border-slate-200/90'
        }`}
        style={{ width: px + 10, height: px + 10 }}
      >
        {MarkSvg}
      </div>

      {/* Brand Name & Typography */}
      <div className="flex flex-col leading-none overflow-hidden">
        <div className="flex items-center gap-2">
          <span
            className={`font-black tracking-wider uppercase text-lg sm:text-xl font-sans ${
              isDark ? 'text-white' : 'text-[#1F497D]'
            }`}
          >
            TULA
          </span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
              isDark
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-blue-50 text-[#0070C0] border border-blue-200'
            }`}
          >
            SIH 26036
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`text-[10px] tracking-tight font-medium mt-1 ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            Verified weights and measures
          </span>
        )}
      </div>
    </div>
  );
};
