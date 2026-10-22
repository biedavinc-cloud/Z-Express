import React from 'react';
import { Image } from '@/components/ui/image';
import { BRAND_LOGO, BRAND_NAME } from '@/lib/branding';

// The official Z.express wordmark (3D lettering with the logistics scenes inside).
// It is wide (about 3.4:1), so it is sized by height. On dark surfaces
// (variant="light") it sits on a cream pill so the dark-brown letter sides stay
// readable; on light surfaces it is shown as is.
const HEIGHTS = {
  sm: 'h-8',
  md: 'h-11 sm:h-14',
  lg: 'h-16 sm:h-20',
  xl: 'h-20 sm:h-28',
};

export default function BrandMark({ variant = 'dark', size = 'md', className = '' }) {
  const logo = (
    <Image
      src={BRAND_LOGO}
      alt={BRAND_NAME}
      className={`${HEIGHTS[size] || HEIGHTS.md} w-auto max-w-none object-contain`}
      fittingType="fit"
      loading="eager"
      decoding="sync"
    />
  );

  if (variant === 'light') {
    return (
      <span
        className={`inline-flex shrink-0 items-center rounded-full bg-[#FFF9F0]/95 px-4 py-1.5 shadow-lg ring-1 ring-white/20 ${className}`}
      >
        {logo}
      </span>
    );
  }

  return <span className={`inline-flex shrink-0 items-center ${className}`}>{logo}</span>;
}
