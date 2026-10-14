import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import BrandMark from '@/components/site/BrandMark';
import { useI18n } from '@/components/LanguageProvider';
import useStaffScope from '@/hooks/useStaffScope';

// Shell shared by the operator pages that sit outside the portal sidebar:
// brand header, language switch, page heading and the workspace guard.
export default function StaffPage({ title, subtitle, children }) {
  const scope = useStaffScope();
  const { t, lang, setLang, languages } = useI18n();

  if (!scope) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (scope.role === 'merchant') return <Navigate to="/my-shipments" replace />;
  if (scope.role === 'driver') return <Navigate to="/driver" replace />;
  if (!scope.tenant) return <Navigate to="/admin" replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/">
            <BrandMark variant="light" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-primary-foreground/60 sm:block">
              {scope.tenant.name}
            </span>
            {languages.map(({ code }) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className={`rounded-full px-3 py-1 text-xs font-medium uppercase transition ${
                  lang === code ? 'bg-accent text-accent-foreground' : 'text-primary-foreground/60'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/portal" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            {t('portal.workspace')}
          </Link>
        </div>

        <h1 className="mt-5 font-heading text-2xl font-semibold tracking-tight text-primary">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{subtitle}</p>}

        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}