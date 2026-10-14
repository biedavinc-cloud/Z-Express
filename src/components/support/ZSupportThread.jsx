import React, { useEffect, useRef, useState } from 'react';
import { Loader2, SendHorizontal } from 'lucide-react';
import { useI18n } from '@/components/LanguageProvider';
import { SUPPORT_EMAIL } from '@/lib/support';

export default function ZSupportThread({ messages, sending, failed, onSend }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending, failed]);

  const submit = (event) => {
    event.preventDefault();
    const clean = draft.trim();
    if (!clean || sending) return;
    setDraft('');
    onSend(clean);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message, index) => (
          <div
            key={`${index}-${message.role}`}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <p
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground'
              }`}
            >
              {message.content}
            </p>
          </div>
        ))}

        {sending && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t('zsupport.thinking')}
          </p>
        )}
        {failed && !sending && (
          <p className="text-xs leading-relaxed text-destructive">
            {t('zsupport.failed', { email: SUPPORT_EMAIL })}
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) submit(event);
            }}
            placeholder={t('zsupport.placeholder')}
            className="max-h-24 min-h-[42px] flex-1 resize-none rounded-2xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            aria-label={t('zsupport.send')}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground transition hover:bg-accent/90 disabled:opacity-50"
          >
            <SendHorizontal className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          {t('zsupport.disclaimer')}
        </p>
      </form>
    </div>
  );
}