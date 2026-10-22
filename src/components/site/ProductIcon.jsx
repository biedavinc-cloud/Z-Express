import React from 'react';
import { Calculator, Handshake, Headset, PackagePlus, Ship, Truck, Warehouse, Zap } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { cn } from '@/lib/utils';
import {
  BUSINESS_ICON,
  EXPRESS_ICON,
  FREIGHT_ICON,
  HELP_CENTER_ICON,
  LAST_MILE_ICON,
  RATE_CALC_ICON,
  SEND_SHIPMENT_ICON,
  SUPPLY_CHAIN_ICON,
} from '@/lib/branding';

// Each product icon has a drawn stand-in, so a section never shows a blank tile
// (or a broken image) when the artwork file is not available.
const STAND_INS = {
  [SEND_SHIPMENT_ICON]: PackagePlus,
  [RATE_CALC_ICON]: Calculator,
  [BUSINESS_ICON]: Handshake,
  [HELP_CENTER_ICON]: Headset,
  [EXPRESS_ICON]: Zap,
  [FREIGHT_ICON]: Ship,
  [SUPPLY_CHAIN_ICON]: Warehouse,
  [LAST_MILE_ICON]: Truck,
};

export default function ProductIcon({ src, alt = '', className = 'h-12 w-12 rounded-2xl', onAccent = false }) {
  const Icon = STAND_INS[src] || Zap;
  const standIn = (
    <span
      role="img"
      aria-label={alt}
      className={cn(
        'relative grid shrink-0 place-items-center shadow-md ring-1',
        onAccent
          ? 'bg-[#FFF9F0] text-primary ring-white/40'
          : 'bg-gradient-to-br from-accent to-[#E8730E] text-white ring-accent/30',
        className
      )}
    >
      <Icon className="h-1/2 w-1/2" strokeWidth={2} />
    </span>
  );
  return <Image src={src} alt={alt} className={className} fallback={standIn} />;
}
