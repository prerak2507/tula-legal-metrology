import React, { useMemo } from 'react';

// Security-print patterns, the kind printed on certificates and banknotes. Drawn once from
// sine curves, so they cost no image download and stay sharp at any size.

const fmt = (n: number) => n.toFixed(1);

/** A horizontal band of interlaced waves. */
export const GuillocheBand: React.FC<{ className?: string; lines?: number; width?: number; height?: number }> = ({
  className = '', lines = 18, width = 1200, height = 240,
}) => {
  const paths = useMemo(() => {
    const out: string[] = [];
    const mid = height / 2;
    for (let k = 0; k < lines; k++) {
      const phase = (k / lines) * Math.PI * 2;
      let d = '';
      for (let x = 0; x <= width; x += 6) {
        const t = (x / width) * Math.PI * 2;
        const y = mid + Math.sin(t * 3 + phase) * height * 0.28 + Math.sin(t * 7 - phase * 2) * height * 0.12;
        d += `${x === 0 ? 'M' : 'L'}${x},${fmt(y)}`;
      }
      out.push(d);
    }
    return out;
  }, [lines, width, height]);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className={className} aria-hidden="true" focusable="false" data-decor="">
      {paths.map((d, i) => <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />)}
    </svg>
  );
};

/** A circular rosette, used as a watermark and on the seal. */
export const Rosette: React.FC<{ className?: string; rings?: number; petals?: number }> = ({ className = '', rings = 14, petals = 12 }) => {
  const paths = useMemo(() => {
    const out: string[] = [];
    for (let k = 0; k < rings; k++) {
      const phase = (k / rings) * (Math.PI * 2) / petals;
      let d = '';
      for (let i = 0; i <= 360; i++) {
        const th = (i / 360) * Math.PI * 2;
        const r = 62 + 22 * Math.sin(petals * th + phase * petals) + 8 * Math.sin((petals * 2 + 1) * th);
        d += `${i === 0 ? 'M' : 'L'}${fmt(100 + r * Math.cos(th))},${fmt(100 + r * Math.sin(th))}`;
      }
      out.push(d + 'Z');
    }
    return out;
  }, [rings, petals]);
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false" data-decor="">
      {paths.map((d, i) => <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth="0.5" />)}
    </svg>
  );
};
