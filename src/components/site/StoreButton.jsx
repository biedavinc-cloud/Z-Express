import React from 'react';
import { Image } from '@/components/ui/image';

// `Logo` is a drawn mark (see StoreIcons); `logoSrc` stays supported for a picture.
export default function StoreButton({ Logo, logoSrc, eyebrow, label, href = '/#app', focalX, focalY }) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-2.5 rounded-full border border-black/80 bg-white py-1.5 pl-2 pr-4 text-black shadow-[0_10px_24px_-16px_rgba(0,0,0,0.7)] transition duration-200 hover:-translate-y-0.5 hover:border-black hover:shadow-[0_16px_30px_-16px_rgba(0,0,0,0.6)]"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-white ring-1 ring-black/10 transition group-hover:ring-black/25">
        {Logo ? (
          <Logo />
        ) : (
          <Image
            src={logoSrc}
            alt={label}
            className="h-8 w-8"
            fittingType="fill"
            focalPointX={focalX}
            focalPointY={focalY}
          />
        )}
      </span>
      <span className="text-left leading-none">
        <span className="block text-[9px] font-medium uppercase tracking-[0.15em] text-black/55">
          {eyebrow}
        </span>
        <span className="mt-1 block text-[13px] font-semibold tracking-tight">{label}</span>
      </span>
    </a>
  );
}