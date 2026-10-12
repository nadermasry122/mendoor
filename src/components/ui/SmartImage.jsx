import { useState } from 'react';
import { Icon } from './Icon.jsx';

/* Bild mit Icon-Fallback. Ersetzt die früheren inline-onerror-Hacks und
   hält auch den Platzhalter einfarbig (5-Farben-Regel). */
export function SmartImage({ src, alt = '', className = '', fallbackIcon = 'wrench', fallbackSize = 28 }) {
  const [failed, setFailed] = useState(!src);

  if (failed) {
    return (
      <div className={`${className} ${className}--placeholder`} aria-hidden="true">
        <Icon name={fallbackIcon} size={fallbackSize} />
      </div>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
