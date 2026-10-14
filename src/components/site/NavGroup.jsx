import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NavGroup({ label, items, onNavigate }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={cn(
          'flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition',
          open ? 'bg-secondary text-primary' : 'text-foreground/70 hover:bg-secondary hover:text-primary'
        )}
      >
        {label}
        <ChevronDown className={cn('h-4 w-4 transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 pt-2">
          <div className="w-64 rounded-2xl border border-border bg-card p-2 zx-shadow">
            {items.map((item) => {
              const Icon = item.icon;
              const anchor = item.to.startsWith('/#');
              return (
                <Link
                  key={item.key}
                  to={anchor ? '/' : item.to}
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.(item.to);
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/80 transition hover:bg-secondary hover:text-primary"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/12 text-accent">
                    <Icon className="h-4 w-4" />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}