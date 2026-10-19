import React, { useState } from 'react';
import { api } from '@/api/client';
import { FileCheck2, FileText, Loader2, Trash2 } from 'lucide-react';
import { useI18n } from '@/components/LanguageProvider';
import { formatDate } from '@/lib/logistics';
import { DOC_KINDS, docKindKey, docStatusClass, kycClass, kycKey, newDocument, reviewStatus } from '@/lib/documents';

const inputClass =
  'w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-accent';

export default function MerchantDocuments({ tenant }) {
  const { t } = useI18n();
  const [documents, setDocuments] = useState(tenant.documents || []);
  const [kind, setKind] = useState('registration');
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Documents live in private storage; the platform team opens them with a
  // signed link, so nothing here is publicly reachable.
  const save = async (next) => {
    await api.entities.Tenant.update(tenant.id, {
      documents: next,
      kyc_status: reviewStatus(next),
    });
    setDocuments(next);
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const { file_uri } = await api.integrations.Core.UploadPrivateFile({ file });
      await save([...documents, newDocument({ label, kind, file_name: file.name, file_uri })]);
      setLabel('');
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (document) => {
    setBusy(true);
    setError('');
    try {
      await save(documents.filter((item) => item.id !== document.id));
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <FileCheck2 className="h-4 w-4" />
          {t('settings.documents')}
        </h2>
        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${kycClass(reviewStatus(documents))}`}>
          {t(kycKey(reviewStatus(documents)))}
        </span>
      </div>
      <p className="mt-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        {t('settings.documentsHint')}
      </p>

      {documents.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">{t('settings.noDocuments')}</p>
      ) : (
        <ul className="mt-5 divide-y divide-border border border-border">
          {documents.map((document) => (
            <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium text-primary">
                  <FileText className="h-4 w-4 text-accent" />
                  {document.label || document.file_name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t(docKindKey(document.kind))} · {formatDate(document.uploaded_at, false)}
                  {document.note ? ` · ${document.note}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold ${docStatusClass(document.status)}`}>
                  {t(`doc.status.${document.status || 'pending'}`)}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(document)}
                  className="text-muted-foreground transition hover:text-destructive"
                  aria-label={t('settings.removeDocument')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-3">
        <select className={inputClass} value={kind} onChange={(event) => setKind(event.target.value)}>
          {DOC_KINDS.map((item) => (
            <option key={item.id} value={item.id}>
              {t(item.key)}
            </option>
          ))}
        </select>
        <input
          className={inputClass}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder={t('settings.docLabel')}
        />
        <label
          className={`flex cursor-pointer items-center justify-center rounded-xl border border-input px-3.5 py-2.5 text-sm font-medium text-primary transition hover:border-accent ${
            busy ? 'opacity-50' : ''
          }`}
        >
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {busy ? t('settings.uploading') : t('settings.uploadDocument')}
          <input
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
            disabled={busy}
            onChange={upload}
          />
        </label>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
    </div>
  );
}