import React from 'react';

export const fieldClass =
  'w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-accent focus:ring-2 focus:ring-accent/20';

export default function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="mt-1.5 block">{children}</span>
      {error ? (
        <span className="mt-1 block text-[11px] font-medium text-destructive">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>
      )}
    </label>
  );
}