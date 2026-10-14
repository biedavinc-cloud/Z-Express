import React from 'react';
import { Clock, Mail, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/LanguageProvider';
import { localized } from '@/lib/localized';

// One open role on the careers page, with the mail link that starts an application.
export default function RoleCard({ role, onApply }) {
  const { t, lang } = useI18n();

  const facts = [
    { icon: Users, value: localized(role.team, lang) },
    { icon: MapPin, value: localized(role.location, lang) },
    { icon: Clock, value: localized(role.type, lang) },
  ];

  return (
    <article className="flex flex-col rounded-3xl border border-border bg-card p-6">
      <h3 className="font-heading text-lg font-semibold text-primary">{localized(role.title, lang)}</h3>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {facts.map((fact) => (
          <li key={fact.value} className="inline-flex items-center gap-1.5">
            <fact.icon className="h-3.5 w-3.5 text-accent" />
            {fact.value}
          </li>
        ))}
      </ul>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">{localized(role.body, lang)}</p>
      <Button
        variant="outline"
        className="mt-5 self-start rounded-full"
        onClick={() => onApply(localized(role.title, lang))}
      >
        <Mail className="mr-2 h-4 w-4" />
        {t('careers.apply')}
      </Button>
    </article>
  );
}