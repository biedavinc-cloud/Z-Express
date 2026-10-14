import React from 'react';

// Shared hero for the standalone information pages (careers, surcharges, policies)
// so every page linked from the footer opens with the same structure.
export default function InfoHero({ icon: Icon, badge, title, subtitle }) {
  return (
    <section className="bg-primary px-4 py-20 text-primary-foreground sm:px-6">
      <div className="mx-auto max-w-5xl">
        {badge && (
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider text-accent">
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {badge}
          </span>
        )}
        <h1 className="mt-6 max-w-3xl font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-primary-foreground/70 sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}