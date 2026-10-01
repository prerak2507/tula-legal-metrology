// What a certificate of verification must say, in the form of Schedule VIII of the State Legal Metrology
// (Enforcement) Rules, 2011 (rule 15(3)). Shared by the certificate page and the PDF so both always agree.
import { VerificationCertificate } from '../types';
import { storage } from './storage';
import { quarterMark, DEFAULT_VALIDITY_RULES } from './rulesEngine';
import { SOURCES } from '../config/sources';

const GOVERNMENTS: Record<string, string> = {
  Delhi: 'Government of National Capital Territory of Delhi',
  Gujarat: 'Government of Gujarat',
};
const RULES_SOURCE: Record<string, { title: string; url: string }> = {
  Delhi: { title: 'Delhi Legal Metrology (Enforcement) Rules, 2011', url: SOURCES.DL_ENF.url },
  Gujarat: { title: 'Gujarat Legal Metrology (Enforcement) Rules, 2011', url: SOURCES.GJ_ENF.url },
};

export function certificateFacts(cert: VerificationCertificate) {
  const app = storage.getApplications().find(a => a.id === cert.applicationId);
  const stamp = storage.getStampings().find(s => s.id === cert.stampId);
  const mark = stamp?.quarterAndYear || quarterMark(new Date(cert.verificationDate));
  const quarter = 'ABCD'.indexOf(mark[0]) + 1;
  const rules = RULES_SOURCE[cert.state] || { title: `${cert.state} Legal Metrology (Enforcement) Rules, 2011`, url: SOURCES.DL_ENF.url };
  const validity = DEFAULT_VALIDITY_RULES.find(v => v.category === cert.category);
  return {
    government: GOVERNMENTS[cert.state] || `Government of ${cert.state}`,
    office: cert.issuingOfficerBadgeOrGATC?.startsWith('GATC') ? cert.issuingAuthority : `Office of the Controller, Legal Metrology, ${cert.state}`,
    form: `Schedule VIII [see rule 15(3)], ${rules.title}`,
    formUrl: rules.url,
    quarterMark: mark,
    quarterText: quarter > 0 ? `${mark}: quarter ${quarter} (${['Jan to Mar', 'Apr to Jun', 'Jul to Sep', 'Oct to Dec'][quarter - 1]}) of 20${mark.slice(-2)}` : mark,
    stampNumber: (cert.issuingOfficerBadgeOrGATC || '').replace(/^Badge\s*#\s*/i, ''),   // rule 15(1): stamp shows the number allotted to the officer
    feeTotal: app?.feeAmount,
    receipt: app?.paymentReference,
    paidOn: app?.paidAt?.slice(0, 10),
    feeStatus: app?.feeStatus,
    validityRule: validity?.statutoryReference || `Re-verification every ${cert.validityMonths} months`,
    displayRule: `Rule 22, ${rules.title}: display this certificate in a conspicuous place where the instrument is used.`,
  };
}
