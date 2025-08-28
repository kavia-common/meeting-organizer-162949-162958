import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Skeleton (Shadcn-inspired)
 * A simple skeleton loading placeholder with shimmer animation and shape variants.
 *
 * Props:
 * - className?: string - additional classes
 * - style?: React.CSSProperties - inline style overrides
 * - width?: number | string - explicit width (default: undefined, uses CSS/parent)
 * - height?: number | string - explicit height for block (default: 12)
 * - circle?: boolean - render as a circle (uses height as diameter)
 * - rounded?: number | string - border radius override (default: var(--radius-md))
 *
 * Usage:
 *   <Skeleton width="60%" height={16} />
 *   <Skeleton circle height={32} />
 *   <Skeleton className="w-full h-4" />
 */
export const Skeleton = ({
  className = '',
  style = {},
  width,
  height = 12,
  circle = false,
  rounded,
  ...rest
}) => {
  const styles = {
    display: 'inline-block',
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    // Shimmer inspired by shadcn/ui
    background: 'linear-gradient(90deg, var(--bg-secondary) 25%, #eaeef3 37%, var(--bg-secondary) 63%)',
    backgroundSize: '400% 100%',
    animation: 'kavia-skeleton-shimmer 1.4s ease-in-out infinite',
    borderRadius: circle ? '9999px' : (rounded ?? 'var(--radius-md)'),
    border: '1px solid var(--border-color)',
    ...style,
  };

  return <span className={['ui-skeleton', className].filter(Boolean).join(' ')} style={styles} aria-hidden="true" {...rest} />;
};

Skeleton.displayName = 'Skeleton';

/**
 * Note: The shimmer keyframes are expected to be present globally.
 * If not already present, ensure the following is in your CSS:
 *
 * @keyframes kavia-skeleton-shimmer {
 *   0% { background-position: 100% 0; }
 *   100% { background-position: 0 0; }
 * }
 */
