import React, { useState } from 'react';
import { api } from '@/api/client';
import { Sparkles, X } from 'lucide-react';
import { useI18n } from '@/components/LanguageProvider';
import ZSupportThread from '@/components/support/ZSupportThread';

// Floating assistant for the merchant and driver spaces. The context object is a
// small snapshot of what is on screen, so the answers match the user's own data.
export default function ZSupportWidget({ context }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !started) {
      setStarted(true);
      setMessages([
        { role: 'assistant', content: t('zsupport.greeting', { name: context?.name || '' }) },
      ]);
    }
  };

  const send = async (text) => {
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((previous) => [...previous, { role: 'user', content: text }]);
    setSending(true);
    setFailed(false);
    try {
      const response = await api.functions.invoke('zSupport', {
        message: text,
        history,
        context,
      });
      const reply = response.data?.reply;
      if (!reply) throw new Error('no answer');
      setMessages((previous) => [...previous, { role: 'assistant', content: reply }]);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[min(30rem,72vh)] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-border bg-card zx-shadow-lg sm:right-6">
          <div className="flex items-center gap-3 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-heading text-sm font-semibold">{t('zsupport.title')}</span>
              <span className="block truncate text-[11px] text-primary-foreground/70">
                {t('zsupport.subtitle')}
              </span>
            </span>
            <button
              type="button"
              onClick={toggle}
              aria-label={t('zsupport.close')}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-primary-foreground/70 transition hover:bg-primary-foreground/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ZSupportThread messages={messages} sending={sending} failed={failed} onSend={send} />
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        className="fixed bottom-5 right-4 z-40 flex items-center gap-2 rounded-full bg-accent px-4 py-3 font-heading text-sm font-semibold text-accent-foreground shadow-xl transition hover:bg-accent/90 sm:right-6"
      >
        {open ? <X className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        <span className="hidden sm:inline">{t('zsupport.open')}</span>
      </button>
    </>
  );
}