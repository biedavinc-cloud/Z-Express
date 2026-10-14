import React from 'react';

// Compact metric used by the operator dashboards.
export default function MetricCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      {Icon && (
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/12 text-accent">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <p className={Icon ? 'mt-5 font-heading text-2xl font-semibold text-primary' : 'font-heading text-2xl font-semibold text-primary'}>
        {value}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      {hint && <p className="mt-2 text-xs text-muted-foreground/80">{hint}</p>}
    </div>
  );
}