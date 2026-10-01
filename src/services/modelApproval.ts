// Checks an instrument's approval mark against the Department of Consumer Affairs Model Approval
// register (https://lm.doca.gov.in/modelapproval/Certificates.aspx), copied into the database by
// scripts/fetch-model-approvals.mjs. The mark on a nameplate reads IND/09/<yy>/<number>.

import { cloud } from './cloud';

export const REGISTER_URL = 'https://lm.doca.gov.in/modelapproval/Certificates.aspx';
export const MARK_PATTERN = /^\s*IND\s*\/\s*\d{1,2}\s*\/\s*(\d{2}|\d{4})\s*\/\s*\d{1,4}\s*$/i;

export interface RegisterEntry { company: string; equipment: string; issueDate: string; certNo: string; fileNo: string; pdf: string }
interface Lookup {
  parsed: boolean;
  year: number | null;
  number: number | null;
  matches: RegisterEntry[];
  yearCovered: boolean;
  coverage: { from: number; to: number; entries: number; fetchedAt: string } | null;
}

export type ApprovalCheck =
  | { status: 'empty' }
  | { status: 'bad_format' }
  | { status: 'unavailable' }
  | { status: 'year_not_covered'; year: number; coverage: Lookup['coverage'] }
  | { status: 'not_found'; year: number; number: number; coverage: Lookup['coverage'] }
  | { status: 'found'; year: number; number: number; matches: RegisterEntry[]; makerMatches: boolean | null; coverage: Lookup['coverage'] };

const cache = new Map<string, Lookup>();

// Words that do not identify a company, so "M/s Avery India Ltd." matches "Avery India Limited".
const NOISE = new Set(['m', 's', 'ms', 'pvt', 'private', 'ltd', 'limited', 'india', 'co', 'company', 'and', 'the', 'inc', 'llp', 'corporation', 'corp', 'industries', 'systems', 'technologies', 'technology', 'instruments', 'p']);
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter(w => w.length > 1 && !NOISE.has(w));

/** True when the register's company and the record's manufacturer share an identifying word. */
export function sameMaker(registerCompany: string, manufacturer: string): boolean {
  const a = new Set(words(registerCompany));
  return words(manufacturer).some(w => a.has(w));
}

export async function checkApprovalMark(mark: string, manufacturer?: string): Promise<ApprovalCheck> {
  const m = (mark || '').trim().toUpperCase();
  if (!m) return { status: 'empty' };
  if (!MARK_PATTERN.test(m)) return { status: 'bad_format' };
  let r = cache.get(m);
  if (!r) {
    const data = (await cloud.lookupModelApproval(m)) as Lookup | null;
    if (!data) return { status: 'unavailable' };
    r = data;
    cache.set(m, r);
  }
  if (!r.parsed || r.year === null || r.number === null) return { status: 'bad_format' };
  if (!r.yearCovered) return { status: 'year_not_covered', year: r.year, coverage: r.coverage };
  if (!r.matches.length) return { status: 'not_found', year: r.year, number: r.number, coverage: r.coverage };
  const makerMatches = manufacturer ? r.matches.some(e => sameMaker(e.company, manufacturer)) : null;
  return { status: 'found', year: r.year, number: r.number, matches: r.matches, makerMatches, coverage: r.coverage };
}
