import React, { useState } from 'react';
import { api } from '@/api/client';
import { FileText, Loader2, Trash2 } from 'lucide-react';
import { useI18n } from '@/components/LanguageProvider';
import { DOC_KINDS, docKindKey, newDocument } from '@/lib/documents';
import Field, { fieldClass } from './Field';

export default function DocumentsStep({ form, setForm }) {
  const { t } = useI18n();
  const [kind, setKind] = useState('registration');
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const documents = form.documents || [];

  // Uploads happen before the company exists, so the files are staged in the
  // form and filed with the company record when the workspace is created.
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const { file_uri } = await api.integrations.Core.UploadPrivateFile({ file });
    setForm((prev) => ({
      ...prev,
      documents: [...(prev.documents || []), newDocument({ label, kind, file_name: file.name, file_uri })],
    }));
    setLabel('');
    setBusy(false);
  };

  const remove = (document) =>
    setForm((prev) => ({
      ...prev,
      documents: (prev.documents || []).filter((item) => item.id !== document.id),
    }));

  return (
    <div className="space-y-5">
      <p className="rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        {t('onboard.documentsOptional')}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('settings.docKind')}>
          <select className={fieldClass} value={kind} onChange={(event) => setKind(event.target.value)}>
            {DOC_KINDS.map((item) => (
              <option key={item.id} value={item.id}>
                {t(item.key)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('settings.docLabel')}>
          <input className={fieldClass} value={label} onChange={(event) => setLabel(event.target.value)} />
        </Field>
      </div>

      <label
        className={`flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-input px-4 py-4 text-sm font-medium text-primary transition hover:border-accent ${
          busy ? 'opacity-50' : ''
        }`}
      >
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {busy ? t('settings.uploading') : t('settings.addDocument')}
        <input
          type="file"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
          disabled={busy}
          onChange={upload}
        />
      </label>

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('settings.noDocuments')}</p>
      ) : (
        <ul className="divide-y divide-border border border-border">
          {documents.map((document) => (
            <li key={document.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate text-sm font-medium text-primary">
                  <FileText className="h-4 w-4 shrink-0 text-accent" />
                  {document.label || document.file_name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t(docKindKey(document.kind))}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(document)}
                className="shrink-0 text-muted-foreground transition hover:text-destructive"
                aria-label={t('settings.removeDocument')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}