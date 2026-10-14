import React from 'react';
import { Check } from 'lucide-react';

export default function StepIndicator({ steps, current, onSelect }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step.key} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => done && onSelect(index)}
              disabled={!done}
              className={`flex shrink-0 items-center gap-2 rounded-full text-left ${done ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                  active
                    ? 'bg-accent text-accent-foreground'
                    : done
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span
                className={`hidden whitespace-nowrap text-xs font-medium sm:block ${
                  active || done ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </button>
            {index < steps.length - 1 && (
              <span className={`hidden h-px flex-1 sm:block ${done ? 'bg-primary/30' : 'bg-border'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}