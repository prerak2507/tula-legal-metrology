// Compares what Gemini read from an uploaded model approval certificate with DoCA's register, DoCA's own
// published certificate and the application. The comparison is plain code, so every finding is explainable.
// The result advises the officer; it never approves or rejects.
import { sameMaker } from './modelApproval';
import { parseCapacity } from './rulesEngine';

export interface CertFields {
  readable: boolean; approvalMark: string; company: string; brand?: string; series?: string;
  instrumentType?: string; maxCapacity: string; accuracyClass: string; issueDate: string;
}
export interface DocCheckResponse {
  exact: boolean; officialChecked: boolean; model?: string;
  register: { company: string; equipment: string; issueDate: string | null; pdf: string } | null;
  uploaded: CertFields | null; official: CertFields | null; visualHints: string[];
}
export interface ApplicationFacts { modelApprovalNumber: string; manufacturer: string; capacity: string; accuracyClass: string }
export type FindingLevel = 'ok' | 'warn' | 'info';
export interface Finding { level: FindingLevel; text: string }
export interface DocVerdict { status: 'exact' | 'match' | 'mismatch' | 'unreadable'; findings: Finding[] }

/** "IND/09/2025/049" and "IND / 09 / 25 / 49" are the same mark. */
export function normaliseMark(m: string): string | null {
  const x = (m || '').toUpperCase().match(/IND\s*[/(]\s*0?9\s*[/)]\s*(\d{2}|\d{4})\s*\/\s*(\d{1,4})/);
  return x ? `IND/09/${x[1].slice(-2)}/${Number(x[2])}` : null;
}

/** "Class III", "accuracy class-III", "CLASS_III", "medium accuracy (III)" -> "III". */
export function normaliseClass(c: string): string | null {
  const s = (c || '').toUpperCase().replace(/CLASS_/g, ' ');
  const m = s.match(/\b(IIII|III|II|I)\b/);
  return m ? m[1] : null;
}

/** 21.02.2025, 21-02-2025, 2025-02-21 -> 2025-02-21. */
export function normaliseDate(d: string | null | undefined): string | null {
  if (!d) return null;
  const iso = d.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = d.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  return dmy ? `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}` : null;
}

function compareToOfficial(up: CertFields, off: CertFields, add: (l: FindingLevel, t: string) => void) {
  if (!off.readable) return add('info', "DoCA's published copy could not be read, so only the register entry was compared.");
  if (off.company && up.company && !sameMaker(off.company, up.company)) add('warn', `Company differs from DoCA's published copy (${off.company}).`);
  const capUp = parseCapacity(up.maxCapacity), capOff = parseCapacity(off.maxCapacity);
  if (capUp !== undefined && capOff !== undefined && capUp !== capOff) add('warn', `Maximum capacity differs from DoCA's published copy (${off.maxCapacity}).`);
  const clUp = normaliseClass(up.accuracyClass), clOff = normaliseClass(off.accuracyClass);
  if (clUp && clOff && clUp !== clOff) add('warn', `Accuracy class differs from DoCA's published copy (Class ${clOff}).`);
  const dUp = normaliseDate(up.issueDate), dOff = normaliseDate(off.issueDate);
  if (dUp && dOff && dUp !== dOff) add('warn', `Issue date differs from DoCA's published copy (${dOff}).`);
}

export function compareDocument(res: DocCheckResponse, app: ApplicationFacts): DocVerdict {
  if (res.exact) return { status: 'exact', findings: [{ level: 'ok', text: "Same file as the certificate DoCA publishes for this approval." }] };
  const findings: Finding[] = [];
  const add = (level: FindingLevel, text: string) => findings.push({ level, text });
  if (!res.register && !res.uploaded) {
    return { status: 'mismatch', findings: [{ level: 'warn', text: "The approval mark on the application is not in DoCA's register, so there is no published certificate to compare with." }] };
  }
  const up = res.uploaded;
  if (!up || !up.readable) return { status: 'unreadable', findings: [{ level: 'info', text: 'The document could not be read clearly. Ask for a clearer copy or check it by hand.' }] };

  if (!res.register) add('warn', "The approval mark on the application is not in DoCA's register.");
  const markDoc = normaliseMark(up.approvalMark), markApp = normaliseMark(app.modelApprovalNumber);
  if (!markDoc) add('warn', 'No approval mark could be read on the document.');
  else if (markApp && markDoc !== markApp) add('warn', `Document shows ${markDoc}, application says ${markApp}.`);
  else add('ok', `Approval mark ${markDoc} matches the application.`);

  if (res.register && up.company && !sameMaker(res.register.company, up.company)) add('warn', `Document names ${up.company}; DoCA's register names ${res.register.company}.`);
  if (up.company && app.manufacturer && !sameMaker(up.company, app.manufacturer)) add('warn', `Document names ${up.company}; application says ${app.manufacturer}.`);
  else if (up.company) add('ok', `Company ${up.company} matches.`);

  const capDoc = parseCapacity(up.maxCapacity), capApp = parseCapacity(app.capacity);
  if (capDoc !== undefined && capApp !== undefined && capApp > capDoc) add('warn', `Application says ${app.capacity}; the approved model goes up to ${up.maxCapacity}.`);
  const clDoc = normaliseClass(up.accuracyClass), clApp = normaliseClass(app.accuracyClass);
  if (clDoc && clApp && clDoc !== clApp) add('warn', `Document approves Class ${clDoc}; application says Class ${clApp}.`);

  const dDoc = normaliseDate(up.issueDate), dReg = normaliseDate(res.register?.issueDate);
  if (dDoc && dReg && dDoc !== dReg) add('warn', `Issue date ${dDoc} differs from DoCA's register (${dReg}).`);

  if (res.official) compareToOfficial(up, res.official, add);
  else if (res.register) add('info', "DoCA's published copy could not be fetched, so only the register entry was compared.");
  for (const h of res.visualHints) add('info', `AI hint (low confidence): ${h}`);

  return { status: findings.some(f => f.level === 'warn') ? 'mismatch' : 'match', findings };
}
