// Merchant compliance documents: the kinds a company can file and the review
// status of the file they make up.
export const DOC_KINDS = [
  { id: 'registration', key: 'doc.kind.registration' },
  { id: 'tax', key: 'doc.kind.tax' },
  { id: 'id', key: 'doc.kind.id' },
  { id: 'license', key: 'doc.kind.license' },
  { id: 'insurance', key: 'doc.kind.insurance' },
  { id: 'bank', key: 'doc.kind.bank' },
  { id: 'other', key: 'doc.kind.other' },
];

export const docKindKey = (kind) =>
  (DOC_KINDS.find((item) => item.id === kind) || DOC_KINDS[DOC_KINDS.length - 1]).key;

export const KYC_STATUSES = ['not_submitted', 'pending', 'verified', 'rejected'];

export const kycKey = (status) => `kyc.${KYC_STATUSES.includes(status) ? status : 'not_submitted'}`;

export const kycClass = (status) => {
  if (status === 'verified') return 'bg-emerald-100 text-emerald-800';
  if (status === 'pending') return 'bg-accent/15 text-accent';
  if (status === 'rejected') return 'bg-destructive/10 text-destructive';
  return 'bg-secondary text-muted-foreground';
};

export const docStatusClass = (status) => {
  if (status === 'verified') return 'text-emerald-700';
  if (status === 'rejected') return 'text-destructive';
  return 'text-accent';
};

// The company file is verified once every filed document is, rejected as soon
// as one is, and pending while any review is outstanding.
export const reviewStatus = (documents = []) => {
  if (!documents.length) return 'not_submitted';
  if (documents.some((doc) => doc.status === 'rejected')) return 'rejected';
  if (documents.every((doc) => doc.status === 'verified')) return 'verified';
  return 'pending';
};

export const newDocument = ({ label, kind, file_name, file_uri }) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  label: label || file_name,
  kind: kind || 'other',
  file_name,
  file_uri,
  uploaded_at: new Date().toISOString(),
  status: 'pending',
  note: '',
});