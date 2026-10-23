import React, { useEffect, useMemo, useState } from 'react';
import { Image } from '@/components/ui/image';
import { IMAGE_OPACITY, SITE_IMAGES } from '@/lib/siteImages';

/**
 * Cross-fading photographic backdrop shared by the hero and auth screens.
 * Images render at 95% opacity; pass an `overlayClassName` for text legibility.
 *
 * A photo whose file is not available is skipped, so the rotation never lands
 * on an empty slide.
 */
export default function ImageBackdrop({ interval = 7000, overlayClassName = '', className = '' }) {
  const [available, setAvailable] = useState(null); // null while the files are being checked
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState([]);

  // A missing file often comes back as an HTML page with status 200 (single-page-app
  // fallback), so the content type is checked rather than trusting the status alone.
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      SITE_IMAGES.map((src) =>
        fetch(src, { method: 'HEAD' })
          .then((response) => response.ok && /^image\//i.test(response.headers.get('content-type') || ''))
          .catch(() => false)
          .then((ok) => (ok ? src : null))
      )
    ).then((found) => {
      if (!cancelled) setAvailable(found.filter(Boolean));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const images = useMemo(() => available ?? [], [available]);

  useEffect(() => {
    if (images.length < 2) return undefined;
    const id = setInterval(() => setIndex((prev) => (prev + 1) % images.length), interval);
    return () => clearInterval(id);
  }, [interval, images.length]);

  // Only photos that are (or have been) on screen are mounted.
  useEffect(() => {
    if (!images.length) return;
    const current = images[index % images.length];
    setMounted((prev) => (prev.includes(current) ? prev : [...prev, current]));
  }, [index, images]);

  const current = images.length ? images[index % images.length] : null;

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {images.map((src) =>
        mounted.includes(src) ? (
          <Image
            key={src}
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full transition-opacity duration-1000"
            style={{ opacity: src === current ? IMAGE_OPACITY : 0 }}
            fittingType="fill"
            loading="eager"
          />
        ) : null
      )}
      {overlayClassName ? <div className={`absolute inset-0 ${overlayClassName}`} /> : null}
    </div>
  );
}
