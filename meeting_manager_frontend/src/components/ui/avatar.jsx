import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Avatar
 * Lightweight avatar component showing an image, or fallback initials, or placeholder.
 *
 * Props:
 * - src?: string - image source URL
 * - alt?: string - alt text
 * - name?: string - used to derive initials fallback
 * - size?: number - diameter in px (default 32)
 * - className?: string
 * - style?: React.CSSProperties
 */
export const Avatar = ({ src, alt = 'Avatar', name = '', size = 32, className = '', style = {} }) => {
  const initials = React.useMemo(() => {
    const n = String(name || '').trim();
    if (!n) return '';
    const parts = n.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  }, [name]);

  const baseStyle = {
    width: size,
    height: size,
    borderRadius: '9999px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-secondary)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: Math.max(12, Math.floor(size * 0.4)),
    userSelect: 'none',
    overflow: 'hidden',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        style={{ ...baseStyle, objectFit: 'cover' }}
        className={className}
      />
    );
  }

  return (
    <span className={className} style={{ ...baseStyle, ...style }} aria-hidden={initials ? undefined : true}>
      {initials || '👤'}
    </span>
  );
};

Avatar.displayName = 'Avatar';
