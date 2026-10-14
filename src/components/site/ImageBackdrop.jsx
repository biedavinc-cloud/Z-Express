import React, { useEffect, useState } from 'react';
import { Image } from '@/components/ui/image';
import { IMAGE_OPACITY, SITE_IMAGES } from '@/lib/siteImages';

/**
 * Cross-fading photographic backdrop shared by the hero and auth screens.
 * Images render at 95% opacity; pass an `overlayClassName` for text legibility.
 */
export default function ImageBackdrop({ interval = 7000, overlayClassName = '', className = '' }) {
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState([0]);

  useEffect(() => {
    const id = setInterval(() => setIndex((prev) => (prev + 1) % SITE_IMAGES.length), interval);
    return () => clearInterval(id);
  }, [interval]);

  useEffect(() => {
    setMounted((prev) => (prev.includes(index) ? prev : [...prev, index]));
  }, [index]);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {SITE_IMAGES.map((src, i) =>
        mounted.includes(i) ? (
          <Image
            key={src}
            src={src}
            alt=""
            className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ${
              i === index ? 'opacity-95' : 'opacity-0'
            }`}
            style={{ opacity: i === index ? IMAGE_OPACITY : 0 }}
            fittingType="fill"
          />
        ) : null
      )}
      {overlayClassName ? <div className={`absolute inset-0 ${overlayClassName}`} /> : null}
    </div>
  );
}