// Downloads the public Model Approval register published by the Department of Consumer Affairs
// (https://lm.doca.gov.in/modelapproval/Certificates.aspx) and writes it as SQL for the
// model_approvals table. One request per year, with a pause between requests.
// Run: node scripts/fetch-model-approvals.mjs [fromYear] [toYear]
import { writeFileSync, mkdirSync } from 'node:fs';

const URL_ = 'https://lm.doca.gov.in/modelapproval/Certificates.aspx';
const ORIGIN = 'https://lm.doca.gov.in';
const from = Number(process.argv[2] || 2011);
const to = Number(process.argv[3] || new Date().getFullYear());
const sleep = ms => new Promise(r => setTimeout(r, ms));

const decode = s => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const field = (html, name) => (html.match(new RegExp(`name="${name}"[^>]*value="([^"]*)"`)) || [])[1] || '';

// Pulls the approval number (or range) out of the certificate column. Older years mix in application
// numbers, file numbers, revisions and notes, e.g. "7140-316", "18620 (86 ) 21(228)24", "57(1)", "4-7".
function certRange(certNo, appNo) {
  let s = ` ${certNo || ''} `;
  // An approval mark written out, e.g. "IND(09)24 (114)" or "IND/09/24/114".
  const mark = s.match(/IND\s*[(/]?\s*09\s*[)/]?\s*\/?\s*\d{2}\s*[/(]?\s*(\d{1,4})/i);
  if (mark) return [Number(mark[1]), Number(mark[1])];
  s = s.replace(/\d{1,3}\(\s*\d{1,4}\s*[)}]\s*\d{2}\b/g, ' ');   // file numbers like 21(228)24 or 21(209}24
  s = s.replace(/\d+\s*\(\s*20\d\d\s*\)/g, ' ');                  // like 281(2014)
  const spaced = s.match(/\s\(\s*(\d{1,4})\s*\)/);                // "18620 (86 )": the number in brackets
  if (spaced && Number(spaced[1]) < 3000) return [Number(spaced[1]), Number(spaced[1])];
  s = s.replace(/(\d)\(\s*\d{1,2}\s*\)/g, '$1 ');                 // revision suffix like 57(1)
  // Certificate numbers stay well under 3000 a year; bigger numbers are application numbers.
  const app = String(appNo || '').trim();
  const ok = n => String(n) !== app && n < 3000;
  const pair = s.match(/(\d+)\s*-\s*(\d+)/);
  if (pair) {
    const a = Number(pair[1]), b = Number(pair[2]);
    if (ok(a) && ok(b) && b >= a && b - a <= 60) return [a, b];
  }
  const nums = (s.match(/\d+/g) || []).map(Number).filter(ok);
  return nums.length ? [nums[0], nums[0]] : null;
}

function parse(html) {
  const rows = [];
  for (const tr of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => decode(m[1]));
    const href = (tr[1].match(/href="([^"]+\.pdf)"/i) || [])[1];
    if (cells.length < 7 || !href) continue;
    // Dates appear as 2026-01-31, 31/01/2020, 31-01-2021, 13.01.12 or 7.1.16 depending on the year.
    const iso = cells[1].match(/^(\d{4})-(\d{2})-(\d{2})/);
    const dmy = cells[1].match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2}|\d{4})\b/);
    if (!iso && !dmy) continue;
    const pad = v => String(v).padStart(2, '0');
    const issueDate = iso ? `${iso[1]}-${iso[2]}-${iso[3]}`
      : `${dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]}-${pad(dmy[2])}-${pad(dmy[1])}`;
    // One certificate can cover a range of approval numbers; the column is free text in older years.
    const range = certRange(cells[5], cells[6]);
    rows.push({
      issueDate, fileNo: cells[2], company: cells[3], equipment: cells[4], certNo: cells[5],
      certFrom: range ? range[0] : null, certTo: range ? range[1] : null,
      appNo: cells[6], pdf: ORIGIN + href.replace(/^~/, ''),
    });
  }
  return rows;
}

let cookie = '';
const get = async (init = {}) => {
  const r = await fetch(URL_, { ...init, headers: { 'User-Agent': 'TULA-SIH-prototype (public register lookup)', ...(cookie ? { Cookie: cookie } : {}), ...(init.headers || {}) } });
  const set = r.headers.get('set-cookie');
  if (set) cookie = set.split(',').map(c => c.split(';')[0]).join('; ');
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
};

const first = await get();
const current = Number((first.match(/<option selected="selected" value="(\d{4})"/) || [])[1]);
const all = [];
for (let y = from; y <= to; y++) {
  let html = first;
  if (y !== current) {
    const body = new URLSearchParams({
      __EVENTTARGET: 'ddlyear', __EVENTARGUMENT: '', __LASTFOCUS: '',
      __VIEWSTATE: field(first, '__VIEWSTATE'), __VIEWSTATEGENERATOR: field(first, '__VIEWSTATEGENERATOR'),
      __VIEWSTATEENCRYPTED: field(first, '__VIEWSTATEENCRYPTED'), __EVENTVALIDATION: field(first, '__EVENTVALIDATION'),
      ddlyear: String(y),
    });
    html = await get({ method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    await sleep(1500);
  }
  const rows = parse(html).map(r => ({ ...r, year: y }));
  console.log(y, rows.length);
  all.push(...rows);
}

const q = v => (v === null || v === undefined || v === '' ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const fetchedAt = new Date().toISOString();
const seen = new Set();
const unique = all.filter(r => {
  const k = `${r.year}|${r.certNo}|${r.company}|${r.equipment}`;
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});
const values = unique.map(r => `(${r.year}, '${r.certNo.replace(/'/g, "''")}', ${r.certFrom ?? 'null'}, ${r.certTo ?? 'null'}, ${q(r.issueDate)}, ${q(r.fileNo)}, '${r.company.replace(/'/g, "''")}', '${r.equipment.replace(/'/g, "''")}', ${q(r.appNo)}, ${q(r.pdf)}, ${q(fetchedAt)})`);
mkdirSync('supabase/data', { recursive: true });
const out = [`-- Generated by scripts/fetch-model-approvals.mjs on ${fetchedAt} from ${URL_}`, 'begin;'];
for (let i = 0; i < values.length; i += 500) {
  out.push(`insert into public.model_approvals (year, cert_no, cert_from, cert_to, issue_date, file_no, company, equipment, application_no, pdf_url, fetched_at) values
${values.slice(i, i + 500).join(',\n')}
on conflict (year, cert_no, company, equipment) do update set cert_from = excluded.cert_from, cert_to = excluded.cert_to, issue_date = excluded.issue_date, file_no = excluded.file_no, application_no = excluded.application_no, pdf_url = excluded.pdf_url, fetched_at = excluded.fetched_at;`);
}
out.push('commit;');
writeFileSync('supabase/data/model_approvals.sql', out.join('\n') + '\n');
writeFileSync('supabase/data/model_approvals.json', JSON.stringify(unique));
console.log('total', unique.length);
