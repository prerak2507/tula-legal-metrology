import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { VerificationCertificate } from '../types';
import { certificateFacts } from './certificateFacts';

// The PDF follows the certificate of verification in Schedule VIII [rule 15(3)] of the State Legal
// Metrology (Enforcement) Rules, 2011, the same as the certificate page. Every copy says SPECIMEN.
export async function generateCertificatePdf(cert: VerificationCertificate): Promise<void> {
  const f = certificateFacts(cert);
  const qr = await QRCode.toDataURL(cert.qrPayloadUrl, { errorCorrectionLevel: 'M', margin: 1, width: 600 });
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const INK: [number, number, number] = [14, 26, 43];
  const MUTED: [number, number, number] = [58, 77, 104];
  const date = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const wrap = (text: string, x: number, y: number, w: number, lh = 4.6) => { const lines = doc.splitTextToSize(text, w); doc.text(lines, x, y); return y + lines.length * lh; };

  // Specimen marking
  doc.setTextColor(245, 225, 222);
  doc.setFont('times', 'bold');
  doc.setFontSize(72);
  doc.text('SPECIMEN', 105, 170, { align: 'center', angle: 30 });

  // Double border
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.8); doc.rect(9, 9, 192, 279);
  doc.setLineWidth(0.25); doc.rect(11, 11, 188, 275);

  // Heading
  doc.setTextColor(...MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
  doc.text(f.form.toUpperCase(), 105, 19, { align: 'center' });
  doc.setTextColor(...INK); doc.setFont('times', 'bold'); doc.setFontSize(13);
  doc.text(f.government.toUpperCase(), 105, 27, { align: 'center' });
  doc.setFont('times', 'normal'); doc.setFontSize(11);
  doc.text(f.office, 105, 33, { align: 'center' });
  doc.setFont('times', 'bold'); doc.setFontSize(18);
  doc.text('Certificate of Verification', 105, 44, { align: 'center' });

  doc.setLineWidth(0.2); doc.line(16, 49, 194, 49);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
  doc.text(`Name of Legal Metrology officer: ${cert.issuingOfficerName}, ${cert.issuingOfficerDesignation}`, 16, 55);
  doc.setFont('helvetica', 'bold');
  doc.text(`No. ${cert.certificateNumber}`, 194, 55, { align: 'right' });
  doc.line(16, 58, 194, 58);

  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  let y = wrap(`I hereby certify that I have this day, ${date(cert.verificationDate)}, verified and stamped the under-mentioned weighing or measuring instrument belonging to ${cert.issuedToName}${cert.organization && cert.organization !== cert.issuedToName ? `, ${cert.organization}` : ''}, locality ${cert.address}, ${cert.district}, ${cert.state}.`, 16, 66, 178, 5);

  // Schedule VIII table
  y += 3;
  const cols: [string, number][] = [['Instrument (type)', 34], ['Capacity', 20], ['Class', 12], ['Manufacturer', 30], ['Model, serial no.', 28], ['Qty', 9], ['Verification fee (Rs)', 21], ['Carriage, conveyance, adjusting (Rs)', 24]];
  const cells = [
    `${cert.instrumentType}\n${cert.instrumentId}`, `${cert.capacity}\n${cert.scaleInterval}`, cert.accuracyClass.replace('CLASS_', '').replace(/_/g, ' '),
    `${cert.manufacturer}\nApproval ${cert.modelApprovalNumber}`, `${cert.model}\n${cert.serialNumber}`, '1',
    f.feeTotal !== undefined ? String(f.feeTotal) : '-', '-',
  ];
  doc.setFontSize(7.5);
  let x = 16;
  const headH = 10;
  cols.forEach(([h, w]) => { doc.setFillColor(243, 236, 223); doc.rect(x, y, w, headH, 'FD'); doc.setFont('helvetica', 'bold'); doc.text(doc.splitTextToSize(h, w - 2), x + 1, y + 3.5); x += w; });
  x = 16;
  const rowH = 16;
  cols.forEach(([, w], i) => { doc.rect(x, y + headH, w, rowH); doc.setFont('helvetica', 'normal'); doc.text(doc.splitTextToSize(cells[i], w - 2), x + 1, y + headH + 4); x += w; });
  y += headH + rowH + 7;

  doc.setFontSize(9.5);
  y = wrap(`Total Rs ${f.feeTotal ?? '-'} ${f.receipt ? `deposited vide receipt no. ${f.receipt}${f.paidOn ? ` dated ${f.paidOn}` : ''}` : f.feeStatus === 'EXEMPT' ? '(exempt)' : '(receipt not recorded)'}.`, 16, y, 178, 5);
  y = wrap(`Used by: ${cert.organization}.`, 16, y + 1, 178, 5);
  y = wrap(`Stamp: officer no. ${f.stampNumber}, quarter mark ${f.quarterText}. Seal / stamp record ${cert.stampId}; inspection ${cert.inspectionId}.`, 16, y + 1, 178, 5);

  // Next verification due
  y += 5;
  doc.setLineWidth(0.6); doc.rect(16, y, 92, 22);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
  doc.text('NEXT VERIFICATION DUE ON', 19, y + 5);
  doc.setFont('times', 'bold'); doc.setFontSize(16); doc.setTextColor(...INK);
  doc.text(date(cert.validUntil), 19, y + 13);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
  doc.text(doc.splitTextToSize(f.validityRule, 86), 19, y + 18);

  doc.addImage(qr, 'PNG', 160, y - 2, 34, 34);
  doc.setFontSize(7); doc.text('Scan to check', 177, y + 35, { align: 'center' });

  // Signature
  const sy = y + 46;
  doc.setTextColor(...INK);
  doc.setFont('times', 'italic'); doc.setFontSize(11);
  doc.text(cert.signatureStatus === 'SIGNED' ? 'Digitally signed' : 'Signature pending', 194, sy, { align: 'right' });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
  doc.text(cert.issuingOfficerName, 194, sy + 5, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
  doc.text('Legal Metrology officer', 194, sy + 9.5, { align: 'right' });
  doc.setFontSize(7.5); doc.setTextColor(...MUTED);
  doc.text(cert.signatureStatus === 'SIGNED' ? `ECDSA P-256 signature, key ${cert.signingKid}, ${cert.signedAt?.slice(0, 10)}. A copy with any field changed fails the QR check.` : 'Digital signature pending.', 16, sy + 5);

  // Footer
  doc.setLineWidth(0.2); doc.line(16, 258, 194, 258);
  doc.setFontSize(7.5); doc.setTextColor(...MUTED);
  doc.text(f.displayRule, 16, 263);
  doc.text('A rejected instrument gets a separate certificate of rejection with reasons (Schedule VIII, note).', 16, 267);
  doc.setTextColor(165, 48, 42); doc.setFont('helvetica', 'bold');
  doc.text('Specimen generated by the TULA prototype for Smart India Hackathon 2026 (PS 26036). Not issued by any government office; not valid for trade.', 16, 272, { maxWidth: 178 });
  doc.setFont('helvetica', 'normal'); doc.setTextColor(31, 53, 84);
  doc.textWithLink('Check this certificate online', 16, 280, { url: cert.qrPayloadUrl });
  doc.textWithLink('Form: Schedule VIII (official rules)', 80, 280, { url: f.formUrl });

  doc.save(`Certificate_${cert.certificateNumber.replace(/\//g, '_')}.pdf`);
}
