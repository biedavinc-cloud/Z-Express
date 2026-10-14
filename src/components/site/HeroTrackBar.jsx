import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, SlidersHorizontal, PackageCheck, Clock } from 'lucide-react';
import { useI18n } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { parseTrackingNumbers } from '@/lib/logistics';

export default function HeroTrackBar() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [value, setValue] = useState('');

  const submit = (event) => {
    event.preventDefault();
    const numbers = parseTrackingNumbers(value);
    navigate(numbers.length ? `/track?numbers=${encodeURIComponent(numbers.join(','))}` : '/track');
  };

  return (
    <div className="mt-12 lg:mt-16">
      <form
        onSubmit={submit}
        className="flex items-center gap-2 rounded-full border border-border bg-background p-2 text-foreground zx-shadow-lg sm:pl-5"
      >
        <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/12 text-accent sm:grid">
          <PackageCheck className="h-4 w-4" />
        </span>
        <input
          data-testid="hero-tracking-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t('hero.trackPlaceholder')}
          className="h-11 w-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground/70"
        />
        <Button
          type="submit"
          data-testid="hero-track-button"
          size="lg"
          className="h-11 shrink-0 rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground hover:bg-accent/90 sm:px-8"
        >
          <Search className="mr-2 h-4 w-4" />
          {t('hero.track')}
        </Button>
      </form>

      <div className="mt-3.5 flex flex-col items-center gap-2 text-[11px] text-primary-foreground/60 sm:flex-row sm:justify-between">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0 text-accent" />
          {t('hero.advancedHint')}
        </span>
        <button
          type="button"
          onClick={() => navigate('/track')}
          className="inline-flex shrink-0 items-center gap-1 font-semibold text-accent transition hover:underline"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {t('hero.advanced')}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}