import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Skeleton
 * A lightweight, brand-themed skeleton loader component for indicating loading states.
 *
 * Props:
 * - width?: number | string - width of the skeleton (default '100%')
 * - height?: number | string - height of the skeleton (default 12)
 * - circle?: boolean - render as a circle (uses height as diameter)
 * - style?: React.CSSProperties - additional style overrides
 * - className?: string - optional class name
 *
 * Example:
 *  <Skeleton width={120} height={14} />
 *  <Skeleton circle height={24} />
 *  <Skeleton style={{ marginTop: 8 }} />
 */
export default function Skeleton({
  width = '100%',
  height = 12,
  circle = false,
  style = {},
  className = '',
}) {
  const base = {
    display: 'inline-block',
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    background: 'linear-gradient(90deg, var(--bg-secondary) 25%, #eaeef3 37%, var(--bg-secondary) 63%)',
    backgroundSize: '400% 100%',
    borderRadius: circle ? '9999px' : 'var(--radius-md)',
    animation: 'kavia-skeleton-shimmer 1.4s ease-in-out infinite',
    border: '1px solid var(--border-color)',
  };

  return <span className={className} style={{ ...base, ...style }} aria-hidden="true" />;
}
