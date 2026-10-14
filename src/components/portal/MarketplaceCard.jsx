import React from 'react';
import { Copy, Plug, Check } from 'lucide-react';
import { formatDate } from '@/lib/logistics';
import { marketplaceEndpoint, marketplaceName } from '@/lib/marketplaces';

export default function MarketplaceCard({ connection, origin, onToggle, onRemove, onCopy, copied, t }) {
  const endpoint = marketplaceEndpoint(origin, connection.inbound_token);

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Plug className="h-4 w-4 text-accent" />
            <p className="font-heading text-base font-semibold text-primary">{marketplaceName(connection.marketplace)}</p>
            {connection.label && <span className="text-xs text-muted-foreground">· {connection.label}</span>}
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-muted-foreground">
              {t(`mkt.mode.${connection.mode}`)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('mkt.orders')}: {connection.orders_count || 0} · {t('mkt.lastEvent')}:{' '}
            {formatDate(connection.last_event_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggle(connection)}
            className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold ${
              connection.status === 'connected'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            {connection.status === 'connected' ? t('common.active') : t('mkt.status.disabled')}
          </button>
          <button
            type="button"
            onClick={() => onRemove(connection)}
            className="rounded-full bg-secondary px-3.5 py-1.5 text-[11px] text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-primary px-4 py-3">
        <code className="min-w-0 flex-1 truncate font-mono text-xs text-accent">{endpoint}</code>
        <button
          type="button"
          onClick={() => onCopy(endpoint)}
          className="grid h-8 w-8 place-items-center rounded-full text-primary-foreground/70 transition hover:text-accent"
        >
          {copied === endpoint ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">{t('mkt.endpointHint')}</p>

      {connection.webhook_url && (
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          {t('mkt.webhook')}: {connection.webhook_url}
        </p>
      )}
      {connection.last_error && <p className="mt-2 text-xs text-destructive">{connection.last_error}</p>}
    </div>
  );
}