import { jsPDF } from 'jspdf';
import { VerificationCertificate } from '../types';

export function generateCertificatePdf(cert: VerificationCertificate): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Outer Border & Header Styling
  doc.setLineWidth(1.5);
  doc.setDrawColor(15, 62, 109); // Deep Government Navy
  doc.rect(8, 8, 194, 281);

  doc.setLineWidth(0.5);
  doc.setDrawColor(197, 155, 39); // Emblem Gold
  doc.rect(10, 10, 190, 277);

  // Government Emblem & Title Header
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 62, 109);
  doc.text('GOVERNMENT OF INDIA', 105, 22, { align: 'center' });

  doc.setFontSize(13);
  doc.setTextColor(50, 50, 50);
  doc.text('DEPARTMENT OF CONSUMER AFFAIRS', 105, 29, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('times', 'italic');
  doc.text('LEGAL METROLOGY DIVISION', 105, 35, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 62, 109);
  doc.text('CERTIFICATE OF VERIFICATION', 105, 45, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('times', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('[Under Section 24 of The Legal Metrology Act, 2009 & Rule 27, Schedule IX of The Legal Metrology (General) Rules, 2011]', 105, 51, { align: 'center' });

  doc.setLineWidth(0.3);
  doc.setDrawColor(180, 180, 180);
  doc.line(15, 54, 195, 54);

  // Certificate Metadata Box
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 62, 109);
  doc.text(`Certificate No: ${cert.certificateNumber}`, 16, 62);
  doc.text(`Instrument UID: ${cert.instrumentId}`, 130, 62);

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text(`Verification Date: ${cert.verificationDate}`, 16, 68);
  doc.text(`Valid Until: ${cert.validUntil} (12 Months)`, 130, 68);
  doc.text(`Issuing Authority: ${cert.issuingAuthority}`, 16, 74);

  doc.line(15, 78, 195, 78);

  // Recipient / Business Section
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 62, 109);
  doc.text('1. STAKEHOLDER / OCCUPIER PARTICULARS', 16, 85);

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text(`Organization Name:  ${cert.organization}`, 20, 92);
  doc.text(`Occupier / Contact:  ${cert.issuedToName}`, 20, 98);
  doc.text(`Premises / Address:  ${cert.address}`, 20, 104);
  doc.text(`Jurisdiction:       ${cert.district}, ${cert.state}`, 20, 110);

  // Metrological Specification Section
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 62, 109);
  doc.text('2. METROLOGICAL SPECIFICATIONS & TECHNICAL DATA', 16, 120);

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text(`Category / Type:     ${cert.instrumentType}`, 20, 127);
  doc.text(`Manufacturer:        ${cert.manufacturer}`, 20, 133);
  doc.text(`Model & Series:      ${cert.model}`, 20, 139);
  doc.text(`Serial Number:       ${cert.serialNumber}`, 120, 139);
  doc.text(`Model Approval No:   ${cert.modelApprovalNumber}`, 20, 145);
  doc.text(`Accuracy Class:      ${cert.accuracyClass}`, 120, 145);
  doc.text(`Nominal Capacity:    ${cert.capacity}`, 20, 151);
  doc.text(`Scale Interval:      ${cert.scaleInterval}`, 120, 151);

  // Verification & Stamping Result Section
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 62, 109);
  doc.text('3. METROLOGICAL VERIFICATION & STAMPING RECORD', 16, 161);

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text('I hereby certify that the weighing / measuring instrument described above has been thoroughly examined, tested,', 20, 168);
  doc.text('and found to conform with the standards prescribed under the Legal Metrology Act, 2009 and relevant General Rules.', 20, 173);
  doc.text('Maximum Permissible Error (MPE) was observed to be within lawful tolerance limits.', 20, 178);

  doc.text(`Official Stamp / Seal ID:  ${cert.stampId}`, 20, 186);
  doc.text(`Quarter & Year Mark:       A-26 (Quarter 1, 2026)`, 120, 186);
  doc.text(`Inspection Record Ref:    ${cert.inspectionId}`, 20, 192);

  // Integrity & Public QR Verification
  doc.line(15, 200, 195, 200);
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 62, 109);
  doc.text('4. CRYPTOGRAPHIC AUTHENTICITY & QR VERIFICATION', 16, 207);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`SHA-256 Digest: ${cert.sha256Hash}`, 20, 214);
  doc.text(`Public Verification URL: ${cert.qrPayloadUrl}`, 20, 219);

  // Signatures
  doc.line(15, 245, 195, 245);
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('This is a digitally issued Schedule IX verification certificate generated via the TULA National Legal Metrology Portal.', 16, 252);
  doc.text('Mandatory Display Requirement: Under Rule 24, this certificate must be displayed conspicuously at place of business.', 16, 256);

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 62, 109);
  doc.text('Authorized Signatory:', 130, 266);
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text(cert.issuingOfficerName, 130, 271);
  doc.text(cert.issuingOfficerDesignation, 130, 276);
  doc.text(cert.issuingOfficerBadgeOrGATC, 130, 281);

  // Save PDF
  doc.save(`Legal_Metrology_Certificate_${cert.certificateNumber.replace(/\//g, '_')}.pdf`);
}
