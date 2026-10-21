import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image } from '@/components/ui/image';
import { BRAND_LOGO, BRAND_NAME } from '@/lib/branding';
import { IMAGE_OPACITY, SITE_IMAGES } from '@/lib/siteImages';

/**
 * Cross-fading photographic backdrop shared by the hero and auth screens.
 * Photos render at 95% opacity; pass an `overlayClassName` for text legibility.
 *
 * A photo that cannot be loaded is skipped. When none can be loaded, the
 * backdrop falls back to the brand gradient with the Z.express artwork, so the
 * screen never looks empty or broken.
 */
export default function ImageBackdrop({ interval = 7000, overlayClassName = '', className = '' }) {
  const [failed, setFailed] = useState({});
  const [current, setCurrent] = useState(0);
  const [shown, setShown] = useState({});

  const usable = useMemo(() => SITE_IMAGES.filter((src) => !failed[src]), [failed]);
  const active = usable.length ? usable[current % usable.length] : null;

  useEffect(() => {
    if (usable.length < 2) return undefined;
    const id = setInterval(() => setCurrent((prev) => prev + 1), interval);
    return () => clearInterval(id);
  }, [interval, usable.length]);

  // Only photos that are (or have been) on screen are mounted, so the page does
  // not download the whole gallery up front.
  useEffect(() => {
    if (active) setShown((prev) => (prev[active] ? prev : { ...prev, [active]: true }));
  }, [active]);

  const markFailed = useCallback((src) => setFailed((prev) => (prev[src] ? prev : { ...prev, [src]: true })), []);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {/* Brand base: always painted, visible when photos are missing or still loading. */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#5A2A06] to-accent/80" />
      <div className="absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-accent/30 blur-3xl" />
      {!active ? (
        <Image
          src={BRAND_LOGO}
          alt={BRAND_NAME}
          fittingType="fit"
          loading="eager"
          className="absolute inset-x-0 bottom-[8%] mx-auto h-auto w-[min(92%,64rem)] opacity-95 drop-shadow-2xl"
        />
      ) : null}

      {SITE_IMAGES.map((src) =>
        shown[src] && !failed[src] ? (
          <Image
            key={src}
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full transition-opacity duration-1000"
            style={{ opacity: src === active ? IMAGE_OPACITY : 0 }}
            fittingType="fill"
            onError={() => markFailed(src)}
          />
        ) : null
      )}
      {overlayClassName ? <div className={`absolute inset-0 ${overlayClassName}`} /> : null}
    </div>
  );
}
