import React from 'react';
import VehicleSprite from '@/components/site/VehicleSprite';

// Two lanes just under the hero: the top lane drives left to right, the bottom
// one right to left. `duration` and a negative `delay` spread the fleet along
// the lane so the band never empties.
const LANE = { up: 'top-[28%]', down: 'top-[58%]' };
const DIRECTION = { right: 'animate-zx-roll-right', left: 'animate-zx-roll-left' };

const FLEET = [
  { id: 'up-1', lane: 'up', dir: 'right', type: 'car', size: 'h-4 w-9', tone: 'text-primary-foreground', duration: 26, delay: -1 },
  { id: 'up-2', lane: 'up', dir: 'right', type: 'moto', size: 'h-4 w-6', tone: 'text-accent', duration: 17, delay: -8 },
  { id: 'up-3', lane: 'up', dir: 'right', type: 'van', size: 'h-5 w-11', tone: 'text-primary-foreground/80', duration: 36, delay: -20 },
  { id: 'up-4', lane: 'up', dir: 'right', type: 'car', size: 'h-4 w-9', tone: 'text-secondary', duration: 22, delay: -14 },
  { id: 'down-1', lane: 'down', dir: 'left', type: 'truck', size: 'h-5 w-14', tone: 'text-primary-foreground/85', duration: 40, delay: -11 },
  { id: 'down-2', lane: 'down', dir: 'left', type: 'car', size: 'h-4 w-9', tone: 'text-accent', duration: 24, delay: -3 },
  { id: 'down-3', lane: 'down', dir: 'left', type: 'moto', size: 'h-4 w-6', tone: 'text-primary-foreground', duration: 19, delay: -12 },
  { id: 'down-4', lane: 'down', dir: 'left', type: 'car', size: 'h-4 w-9', tone: 'text-primary-foreground/70', duration: 31, delay: -24 },
];

export default function HeroTraffic() {
  return (
    <section className="relative isolate overflow-hidden border-y border-primary-foreground/10 bg-primary" aria-hidden="true">
      <div className="zx-road absolute inset-0" />
      <div className="zx-road-lane absolute inset-x-0 top-1/2 h-px" />

      <div className="relative h-[88px] sm:h-[104px]">
        {FLEET.map((vehicle) => (
          <span
            key={vehicle.id}
            className={`absolute ${LANE[vehicle.lane]} ${DIRECTION[vehicle.dir]} motion-reduce:animate-none`}
            style={{ animationDuration: `${vehicle.duration}s`, animationDelay: `${vehicle.delay}s` }}
          >
            <span className={`block ${vehicle.tone} ${vehicle.dir === 'left' ? '-scale-x-100' : ''}`}>
              <VehicleSprite type={vehicle.type} className={vehicle.size} />
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}