import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/api/client';
import { useI18n } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Image } from '@/components/ui/image';
import { Check, Loader2, Pencil, Plus, Trash2, Upload } from 'lucide-react';

const EMPTY = { name: '', logo_url: '', website: '', sort_order: 0, active: true };

// Super-admin CMS for the partner logos shown in the scrolling band on the home
// page. Logos are uploaded to public storage (they are meant to be world-readable
// on the public site) and the PartnerLogo record only stores the resulting URL.
export default function PartnerCms() {
  const { t } = useI18n();
  const [partners, setPartners] = useState(null);
  const [draft, setDraft] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const page = await api.entities.PartnerLogo.filter({}, { sort: 'sort_order', limit: 100 });
    setPartners(page.items || []);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message || t('common.error')));
  }, [load, t]);

  const onFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { file_url } = await api.integrations.Core.UploadPublicFile({ file });
      setDraft((d) => ({ ...d, logo_url: file_url }));
    } catch (e) {
      setError(e.message || t('common.error'));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      setError(t('partners.nameReq'));
      return;
    }
    if (!draft.logo_url) {
      setError(t('partners.logoReq'));
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const payload = {
        name: draft.name.trim(),
        logo_url: draft.logo_url,
        website: (draft.website || '').trim(),
        sort_order: Number(draft.sort_order) || 0,
        active: !!draft.active,
      };
      if (draft.id) {
        await api.entities.PartnerLogo.update(draft.id, payload);
      } else {
        await api.entities.PartnerLogo.create(payload);
      }
      setNotice(t('partners.saved'));
      setDraft(null);
      await load();
    } catch (e) {
      setError(e.message || t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (partner) => {
    if (!window.confirm(`${t('partners.delete')} — ${partner.name}?`)) return;
    setBusy(true);
    setError('');
    try {
      await api.entities.PartnerLogo.delete(partner.id);
      setNotice(t('partners.deleted'));
      await load();
    } catch (e) {
      setError(e.message || t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (partner) => {
    try {
      await api.entities.PartnerLogo.update(partner.id, { active: !partner.active });
      await load();
    } catch (e) {
      setError(e.message || t('common.error'));
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-primary">{t('partners.cmsTitle')}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t('partners.cmsSubtitle')}</p>
        </div>
        <Button
          type="button"
          onClick={() => setDraft({ ...EMPTY })}
          className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" />
          {t('partners.add')}
        </Button>
      </div>

      {notice && (
        <p className="flex items-center gap-2 rounded-none border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          <Check className="h-4 w-4" />
          {notice}
        </p>
      )}
      {error && (
        <p className="rounded-none border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </p>
      )}

      {draft && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="partner-name">{t('partners.name')}</Label>
              <Input
                id="partner-name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="partner-website">{t('partners.website')}</Label>
              <Input
                id="partner-website"
                value={draft.website || ''}
                onChange={(e) => setDraft({ ...draft, website: e.target.value })}
                placeholder="https://"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="partner-sort">{t('partners.sort')}</Label>
              <Input
                id="partner-sort"
                type="number"
                value={draft.sort_order}
                onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="partner-active"
                checked={!!draft.active}
                onCheckedChange={(v) => setDraft({ ...draft, active: v })}
              />
              <Label htmlFor="partner-active">{t('partners.active')}</Label>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Label>{t('partners.logo')}</Label>
            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-primary transition hover:border-accent">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? t('partners.uploading') : t('partners.logo')}
                <input
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
              </label>
              {draft.logo_url && (
                <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-lg border border-border bg-secondary">
                  <Image src={draft.logo_url} alt={draft.name} className="h-8 w-8" fittingType="fit" />
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Button type="button" onClick={save} disabled={busy || uploading} className="rounded-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('partners.save')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDraft(null)}
              className="rounded-full"
            >
              {t('partners.cancel')}
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {partners === null ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : partners.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t('partners.empty')}</p>
        ) : (
          <ul className="divide-y divide-border">
            {partners.map((partner) => (
              <li key={partner.id} className="flex items-center gap-4 px-4 py-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-secondary">
                  <Image src={partner.logo_url} alt={partner.name} className="h-7 w-7" fittingType="fit" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-primary">{partner.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {partner.website || '—'} · {t('partners.sort')}: {partner.sort_order ?? 0}
                  </p>
                </div>
                <Switch
                  checked={!!partner.active}
                  onCheckedChange={() => toggleActive(partner)}
                  aria-label={t('partners.active')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setDraft({ ...partner })}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-destructive hover:text-destructive"
                  onClick={() => remove(partner)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}