import React from 'react';
import { Image } from '@/components/ui/image';
import { BRAND_LOGO, BRAND_NAME } from '@/lib/branding';

export default function BrandMark({ variant = 'dark', size = 'md' }) {
  const box = size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
  const text = size === 'lg' ? 'text-xl' : 'text-lg';
  const light = variant === 'light';

  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`${box} grid shrink-0 place-items-center overflow-hidden rounded-xl bg-background p-1 ring-1 ring-border`}
      >
        <Image src={BRAND_LOGO} alt={BRAND_NAME} className="h-full w-full" fittingType="fit" />
      </span>
      <span
        className={`${text} font-heading font-semibold tracking-tight ${
          light ? 'text-primary-foreground' : 'text-primary'
        }`}
      >
        {BRAND_NAME}
      </span>
    </span>
  );
}