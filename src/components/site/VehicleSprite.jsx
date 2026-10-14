import React from 'react';

// Miniature vehicle silhouettes for the animated traffic band. They are drawn
// with `currentColor` so each vehicle takes the tone of its own wrapper.
const SPRITES = {
  car: (
    <svg viewBox="0 0 64 30" fill="none">
      <path
        d="M6 24V15.5c0-1.2 1-2.2 2.2-2.2h6.4l5.2-6h20.4l5.2 6h6.4c1.2 0 2.2 1 2.2 2.2V24a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z"
        fill="currentColor"
      />
      <path d="M22.5 9.5H31V15H16.6l3.6-5.5Zm11.5 0h6.4l3.6 5.5H34V9.5Z" fill="rgba(255,255,255,0.55)" />
      <circle cx="18" cy="26" r="3.4" fill="rgba(18,11,3,0.92)" />
      <circle cx="47" cy="26" r="3.4" fill="rgba(18,11,3,0.92)" />
    </svg>
  ),
  moto: (
    <svg viewBox="0 0 46 30" fill="none">
      <circle cx="8.5" cy="23.5" r="4.2" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="34" cy="23.5" r="4.2" stroke="currentColor" strokeWidth="2.2" />
      <path d="M8.5 23.5h9l5.5-8.5h6.5l4.5 8.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M21 15h6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="24" cy="4.6" r="3" fill="currentColor" />
      <path d="M24 7.6V15" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="28" y="6.5" width="10" height="9.5" rx="1.6" fill="currentColor" />
    </svg>
  ),
  van: (
    <svg viewBox="0 0 76 30" fill="none">
      <path d="M4 24V9.5c0-1.2 1-2.2 2.2-2.2h34V24H4Z" fill="currentColor" />
      <path d="M40.2 7.3h13.4l9.4 9.2V24H40.2V7.3Z" fill="currentColor" />
      <path d="M44 11h7.6l5.8 5.4H44V11Z" fill="rgba(255,255,255,0.55)" />
      <circle cx="17" cy="26" r="3.4" fill="rgba(18,11,3,0.92)" />
      <circle cx="55" cy="26" r="3.4" fill="rgba(18,11,3,0.92)" />
    </svg>
  ),
  truck: (
    <svg viewBox="0 0 92 30" fill="none">
      <rect x="3" y="6.5" width="52" height="17.5" rx="1.6" fill="currentColor" />
      <path d="M58 10.6c0-1.1.9-2 2-2h10.2l9.3 6.7V24H58V10.6Z" fill="currentColor" />
      <path d="M62.6 12.6h6l5 4h-11v-4Z" fill="rgba(255,255,255,0.55)" />
      <circle cx="16" cy="26" r="3.4" fill="rgba(18,11,3,0.92)" />
      <circle cx="46" cy="26" r="3.4" fill="rgba(18,11,3,0.92)" />
      <circle cx="73" cy="26" r="3.4" fill="rgba(18,11,3,0.92)" />
    </svg>
  ),
};

export default function VehicleSprite({ type, className = '' }) {
  return <span className={`block ${className}`}>{SPRITES[type] || SPRITES.car}</span>;
}