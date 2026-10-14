import React from 'react';
import { Image } from '@/components/ui/image';
import { BRAND_LOGO, BRAND_NAME } from '@/lib/branding';

// The official Z. Express mark is a complete lockup — the orange "Z" icon
// with motion lines and the vertical "Express" wordmark — so it is shown whole
// inside a neutral chip. No separate wordmark is appended (it is already in the
// logo) and the chip reads cleanly on both light and dark surfaces.
export default function BrandMark({ variant = 'dark', size = 'md' }) {
  const box = size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';

  return (
    <span
      className={`${box} grid shrink-0 place-items-center overflow-hidden rounded-xl bg-background p-1 ring-1 ring-border`}
    >
      <Image src={BRAND_LOGO} alt={BRAND_NAME} className="h-full w-full" fittingType="fit" />
    </span>
  );
}