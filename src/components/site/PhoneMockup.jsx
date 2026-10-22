import React from 'react';
import { Bell, CheckCheck, Signature, Truck } from 'lucide-react';

/**
 * Drawn phone showing the driver app (live map + proof of delivery). Everything
 * is sized in `em`, so it scales with the font-size set on the wrapper below.
 * Used when the product photo is not available.
 */
export default function PhoneMockup({ className = '' }) {
  return (
    <div
      role="img"
      aria-label="Z. Express driver app showing live map tracking and proof of delivery"
      className={`relative mx-auto aspect-[9/19] h-[400px] text-[7.2px] sm:h-[480px] sm:text-[8.66px] lg:h-[440px] lg:text-[7.94px] ${className}`}
    >
      {/* Glow behind the device */}
      <div className="absolute inset-[-8%] rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />

      <div className="relative h-full w-full rounded-[3.4em] bg-[#1B0F06] p-[0.7em] shadow-[0_3em_6em_-1.5em_rgba(0,0,0,0.65)] ring-1 ring-white/15">
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2.8em] bg-[#FFF9F0]">
          {/* Dynamic island */}
          <div className="absolute left-1/2 top-[0.8em] z-20 h-[1.9em] w-[7em] -translate-x-1/2 rounded-full bg-[#1B0F06]" />

          {/* Status bar */}
          <div className="flex items-center justify-between px-[2.2em] pb-[0.6em] pt-[1em] text-[1.2em] font-semibold text-[#3D1E00]">
            <span>9:41</span>
            <span className="flex gap-[0.35em]" aria-hidden="true">
              <i className="h-[0.7em] w-[1.1em] rounded-[0.2em] bg-[#3D1E00]" />
              <i className="h-[0.7em] w-[0.7em] rounded-full bg-[#3D1E00]" />
              <i className="h-[0.7em] w-[1.6em] rounded-[0.25em] bg-[#3D1E00]" />
            </span>
          </div>

          {/* App bar */}
          <div className="flex items-center gap-[0.9em] px-[1.6em] pb-[0.9em] pt-[0.8em]">
            <span className="grid h-[3em] w-[3em] place-items-center rounded-[0.9em] bg-[#3D1E00] text-[1.7em] font-extrabold leading-none text-[#FF8E24]">
              Z
            </span>
            <div className="leading-tight">
              <p className="text-[1.45em] font-bold text-[#3D1E00]">Z. Express</p>
              <p className="text-[1em] text-[#87725E]">Driver · Route 14</p>
            </div>
            <span className="ml-auto grid h-[3em] w-[3em] place-items-center rounded-full bg-white ring-1 ring-[#E9E3DD]">
              <Bell className="h-[1.5em] w-[1.5em] text-[#3D1E00]" />
            </span>
          </div>

          {/* Live map */}
          <div className="relative mx-[1.2em] flex-1 overflow-hidden rounded-[2em] bg-[#F7F3EE] ring-1 ring-[#E9E3DD]">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
              <path d="M-5 78 C 25 62, 40 85, 70 66 S 105 52, 110 56 L110 70 C 90 66, 78 84, 52 88 S 10 92, -5 96 Z" fill="#D3E5EE" />
              <rect x="8" y="10" width="26" height="18" rx="4" fill="#E3EBD3" />
              <rect x="62" y="14" width="30" height="14" rx="4" fill="#E3EBD3" />
              <g stroke="#fff" strokeWidth="3.2" fill="none" strokeLinecap="round">
                <path d="M-5 34 L105 30" />
                <path d="M20 -5 L26 105" />
                <path d="M58 -5 L66 105" />
                <path d="M-5 58 L105 52" />
              </g>
              <path
                d="M18 90 C 22 70, 30 60, 36 50 S 50 36, 62 32 S 78 24, 84 14"
                fill="none"
                stroke="#FF8E24"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeDasharray="0.1 5.4"
              />
              <path
                d="M18 90 C 22 70, 30 60, 36 50 S 50 36, 62 32"
                fill="none"
                stroke="#FF8E24"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
            {/* Truck */}
            <span className="absolute left-[56%] top-[28%] grid h-[3.6em] w-[3.6em] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#FF8E24] shadow-[0_0.6em_1.4em_-0.4em_rgba(255,142,36,0.9)] ring-[0.3em] ring-white">
              <Truck className="h-[1.9em] w-[1.9em] text-[#3D1E00]" />
            </span>
            {/* Destination */}
            <span className="absolute left-[84%] top-[13%] h-[1.8em] w-[1.8em] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3D1E00] ring-[0.35em] ring-white" />
          </div>

          {/* Delivery card */}
          <div className="mx-[1.2em] mb-[1.4em] mt-[1.1em] rounded-[2em] bg-white p-[1.5em] shadow-[0_1em_2em_-1.2em_rgba(61,30,0,0.5)] ring-1 ring-[#E9E3DD]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[1.1em] text-[#87725E]">ZEXP48291377</span>
              <span className="rounded-full bg-[#FF8E24]/15 px-[1em] py-[0.35em] text-[1em] font-semibold text-[#B25200]">
                Out for delivery
              </span>
            </div>
            <p className="mt-[0.7em] text-[1.7em] font-bold leading-tight text-[#3D1E00]">Arriving 14:20</p>
            <p className="text-[1.1em] text-[#87725E]">Cocody, Abidjan · 3 stops left</p>

            <div className="mt-[1.1em] flex gap-[0.45em]" aria-hidden="true">
              <i className="h-[0.5em] flex-1 rounded-full bg-[#3D1E00]" />
              <i className="h-[0.5em] flex-1 rounded-full bg-[#3D1E00]" />
              <i className="h-[0.5em] flex-1 rounded-full bg-[#FF8E24]" />
              <i className="h-[0.5em] flex-1 rounded-full bg-[#E9E3DD]" />
            </div>

            <div className="mt-[1.2em] flex items-center justify-center gap-[0.7em] rounded-full bg-[#3D1E00] py-[1em] text-[1.25em] font-semibold text-[#FFF9F0]">
              <Signature className="h-[1.3em] w-[1.3em]" />
              Proof of delivery
              <CheckCheck className="h-[1.2em] w-[1.2em] text-[#FF8E24]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
