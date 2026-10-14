import { jsPDF } from 'jspdf';
import { formatDate } from '@/lib/logistics';
import { BRAND_NAME } from '@/lib/branding';

const BROWN = [61, 30, 0];
const ORANGE = [255, 142, 36];
const GREY = [138, 122, 106];

// Builds a one-page invoice PDF from a stored Invoice record. `labels` carries
// the already-translated field names so the document follows the interface
// language, and `tenantName` is who the invoice is billed to.
export function downloadInvoicePdf(invoice, tenantName, labels) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const L = labels || {};

  doc.setFillColor(...BROWN);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(BRAND_NAME, 20, 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(String(L.invoice || 'Invoice'), 20, 25);
  doc.setTextColor(...BROWN);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(String(invoice.number || ''), 20, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GREY);
  doc.text(`${L.billedTo || 'Billed to'}: ${tenantName || ''}`, 20, 60);
  doc.text(
    `${L.generated || 'Generated'} ${formatDate(new Date().toISOString())}`,
    20,
    66
  );
  doc.setTextColor(...BROWN);

  const rows = [
    [L.plan || 'Plan', String(invoice.plan || '')],
    [L.colPeriod || 'Period', `${invoice.period_start || ''} → ${invoice.period_end || ''}`],
    [L.seats || 'Seats', String(invoice.seats || '')],
    [L.colIssued || 'Issued', String(invoice.issued_at || '')],
    [L.colDue || 'Due', String(invoice.due_at || '')],
    [L.colStatus || 'Status', String(invoice.status || '')],
    [L.method || 'Payment method', String(invoice.method || '—')],
  ];

  let y = 82;
  doc.setDrawColor(230, 226, 220);
  rows.forEach(([label, value]) => {
    doc.setFontSize(10);
    doc.setTextColor(...GREY);
    doc.text(String(label), 20, y);
    doc.setTextColor(...BROWN);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value), 95, y);
    doc.setFont('helvetica', 'normal');
    doc.line(20, y + 2, 190, y + 2);
    y += 12;
  });

  doc.setFillColor(...ORANGE);
  doc.rect(20, y + 4, 170, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(String(L.colAmount || 'Amount'), 26, y + 14);
  doc.setFontSize(16);
  doc.text(`${Number(invoice.amount) || 0} ${invoice.currency || ''}`, 26, y + 22);

  if (invoice.notes) {
    doc.setTextColor(...GREY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(String(invoice.notes), 20, y + 40, { maxWidth: 170 });
  }

  doc.save(`${invoice.number || 'invoice'}.pdf`);
}