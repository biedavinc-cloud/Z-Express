import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, ChevronDown, LifeBuoy, Code2, ExternalLink } from 'lucide-react';
import SiteShell from '@/components/site/SiteShell';
import { useI18n } from '@/components/LanguageProvider';
import { HELP_ARTICLES, HELP_TOPICS } from '@/lib/helpArticles';
import { localized, localizedList } from '@/lib/localized';

export default function HelpCenter() {
  const { t, lang } = useI18n();
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('');
  const [open, setOpen] = useState('');

  const articles = useMemo(() => {
    const term = search.trim().toLowerCase();
    return HELP_ARTICLES.filter((article) => {
      if (topic && article.topic !== topic) return false;
      if (!term) return true;
      const haystack = [
        localized(article.title, lang),
        ...localizedList(article.body, lang),
        article.topic,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [search, topic, lang]);

  return (
    <SiteShell>
      <section className="bg-primary px-4 pb-20 pt-16 text-primary-foreground sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/20 text-accent">
            <LifeBuoy className="h-7 w-7" />
          </span>
          <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {t('help.title')}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-primary-foreground/70">
            {t('help.subtitle')}
          </p>

          <div className="relative mx-auto mt-8 max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('help.search')}
              className="w-full rounded-2xl border border-transparent bg-background py-3.5 pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-accent"
            />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setTopic('')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                topic === '' ? 'bg-accent text-accent-foreground' : 'bg-primary-foreground/10 text-primary-foreground/80'
              }`}
            >
              {t('help.all')}
            </button>
            {HELP_TOPICS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTopic(item.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  topic === item.id
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-primary-foreground/10 text-primary-foreground/80'
                }`}
              >
                {localized(item.label, lang)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-12 max-w-4xl px-4 pb-20 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-6 zx-shadow sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {t('help.results', { count: articles.length })}
            </p>
            <div className="flex flex-wrap gap-3 text-xs">
              <Link to="/developers" className="inline-flex items-center gap-1.5 font-medium text-accent">
                <Code2 className="h-3.5 w-3.5" />
                {t('help.apiDocs')}
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link to="/contact" className="inline-flex items-center gap-1.5 font-medium text-accent">
                {t('help.contact')}
              </Link>
            </div>
          </div>

          {articles.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">{t('help.noResults')}</p>
          ) : (
            <div className="mt-6 divide-y divide-border">
              {articles.map((article) => {
                const isOpen = open === article.id;
                return (
                  <article key={article.id} className="py-5">
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? '' : article.id)}
                      className="flex w-full items-start justify-between gap-4 text-left"
                    >
                      <span>
                        <span className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-accent" />
                          <span className="font-heading text-base font-semibold text-primary">
                            {localized(article.title, lang)}
                          </span>
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {localized(HELP_TOPICS.find((item) => item.id === article.topic)?.label, lang)} ·{' '}
                          {t('help.updated')} {article.updated}
                        </span>
                      </span>
                      <ChevronDown
                        className={`mt-1 h-4 w-4 shrink-0 text-muted-foreground transition ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="mt-4 space-y-3 pl-6 text-sm leading-relaxed text-muted-foreground">
                        {localizedList(article.body, lang).map((paragraph) => (
                          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}