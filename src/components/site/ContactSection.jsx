import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { useI18n } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { COUNTRIES } from '@/lib/logistics';

const CATEGORIES = [
  'customer_support',
  'business_enquiry',
  'careers',
  'partnership',
  'api_integration',
];

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  company: '',
  country: 'Cameroon',
  category: 'customer_support',
  subject: '',
  tracking_number: '',
  message: '',
  consent: false,
};

const inputClass =
  'w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-accent focus:ring-2 focus:ring-accent/20';

export default function ContactSection() {
  const { t } = useI18n();
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const update = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.message || !form.consent) {
      setError(t('contact.consent'));
      return;
    }
    setSending(true);
    try {
      await base44.entities.ContactMessage.create(form);
      setSent(true);
      setForm(EMPTY);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="bg-secondary/60 py-20">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
            {t('contact.title')}
          </h2>
          <p className="mt-3 max-w-md text-base text-muted-foreground">{t('contact.subtitle')}</p>
          <div className="mt-8 space-y-3 text-sm text-muted-foreground">
            <p>support@zexpress.africa</p>
            <p>+237 6 00 00 00 00</p>
            <p>Bonanjo, Douala — Cameroon</p>
          </div>
        </div>

        {sent ? (
          <div className="flex flex-col items-start justify-center rounded-3xl border border-border bg-card p-10">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/12 text-accent">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h3 className="mt-6 font-heading text-xl font-semibold text-primary">{t('contact.success')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t('contact.successBody')}</p>
            <Button variant="outline" className="mt-6 rounded-full" onClick={() => setSent(false)}>
              {t('common.back')}
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-3xl border border-border bg-card p-7 sm:p-9">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('contact.name')}</label>
                <input className={`mt-1.5 ${inputClass}`} value={form.name} onChange={update('name')} required />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('contact.email')}</label>
                <input
                  type="email"
                  className={`mt-1.5 ${inputClass}`}
                  value={form.email}
                  onChange={update('email')}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('contact.phone')}</label>
                <input className={`mt-1.5 ${inputClass}`} value={form.phone} onChange={update('phone')} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('contact.company')}</label>
                <input className={`mt-1.5 ${inputClass}`} value={form.company} onChange={update('company')} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('contact.country')}</label>
                <select className={`mt-1.5 ${inputClass}`} value={form.country} onChange={update('country')}>
                  {COUNTRIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('contact.category')}</label>
                <select className={`mt-1.5 ${inputClass}`} value={form.category} onChange={update('category')}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {t(`contact.cat.${c}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('contact.tracking')}</label>
                <input
                  className={`mt-1.5 ${inputClass}`}
                  value={form.tracking_number}
                  onChange={update('tracking_number')}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('contact.subject')}</label>
                <input className={`mt-1.5 ${inputClass}`} value={form.subject} onChange={update('subject')} />
              </div>
            </div>

            <div className="mt-5">
              <label className="text-xs font-medium text-muted-foreground">{t('contact.message')}</label>
              <textarea
                rows={4}
                className={`mt-1.5 resize-none ${inputClass}`}
                value={form.message}
                onChange={update('message')}
                required
              />
            </div>

            <label className="mt-5 flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={update('consent')}
                className="mt-0.5 h-4 w-4 rounded border-border accent-[#FF8E24]"
              />
              {t('contact.consent')}
            </label>

            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              disabled={sending}
              size="lg"
              className="mt-6 w-full rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto sm:px-10"
            >
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {t('contact.submit')}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}