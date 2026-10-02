import React, { useEffect, useState } from 'react';
import { BadgeCheck, AlertTriangle, ExternalLink, Loader2, WifiOff, HelpCircle } from 'lucide-react';
import { ApprovalCheck, REGISTER_URL, checkApprovalMark } from '../../services/modelApproval';

/**
 * Shows whether an approval mark exists in the Department of Consumer Affairs Model Approval register.
 * Advisory: it informs scrutiny and never blocks anything on its own.
 */
export const ModelApprovalCheck: React.FC<{ mark: string; manufacturer?: string; compact?: boolean; publicView?: boolean }> = ({ mark, manufacturer, compact, publicView }) => {
  const [res, setRes] = useState<ApprovalCheck | null>(null);

  useEffect(() => {
    let live = true;
    setRes(null);
    const t = setTimeout(() => { void checkApprovalMark(mark, manufacturer).then(r => { if (live) setRes(r); }); }, 300);
    return () => { live = false; clearTimeout(t); };
  }, [mark, manufacturer]);

  const box = (tone: 'ok' | 'warn' | 'bad' | 'muted', icon: React.ReactNode, title: React.ReactNode, body?: React.ReactNode) => {
    const cls = { ok: 'bg-verify-50 border-verify/30 text-verify-700', warn: 'bg-brass-200/40 border-brass/40 text-ink', bad: 'bg-seal-50 border-seal/30 text-seal-700', muted: 'bg-paper-50 border-paper-300 text-ink-600' }[tone];
    return (
      <div className={`rounded-md border p-3 text-xs ${cls}`} role="status" aria-live="polite">
        <p className="font-semibold flex items-start gap-1.5">{icon}<span>{title}</span></p>
        {body && <div className="mt-1.5 text-ink-700 space-y-1">{body}</div>}
      </div>
    );
  };
  const source = <a href={REGISTER_URL} target="_blank" rel="noreferrer" className="underline">DoCA Model Approval register</a>;
  // For buyers: say where the record comes from and what it does and does not prove.
  const provenance = res && 'coverage' in res && res.coverage
    ? <p className="text-[11px] text-ink-600">Source: Department of Consumer Affairs (Government of India), Legal Metrology Division, public {source}. TULA keeps a copy of {res.coverage.entries.toLocaleString('en-IN')} entries from {res.coverage.from} to {res.coverage.to}, last refreshed {res.coverage.fetchedAt.slice(0, 10)}.</p>
    : <p className="text-[11px] text-ink-600">Source: Department of Consumer Affairs (Government of India), public {source}.</p>;

  if (!res) return mark ? box('muted', <Loader2 className="w-4 h-4 animate-spin shrink-0" />, 'Checking the DoCA Model Approval register…') : null;

  switch (res.status) {
    case 'empty':
      return null;
    case 'bad_format':
      return box('warn', <HelpCircle className="w-4 h-4 shrink-0" />, 'Approval mark not in the usual form',
        <p>The nameplate mark reads like <span className="font-readout">IND/09/25/235</span>: year, then the approval number.</p>);
    case 'unavailable':
      return box('muted', <WifiOff className="w-4 h-4 shrink-0" />, 'Register check needs a connection', <p>It runs again when the device is online.</p>);
    case 'year_not_covered':
      if (publicView) return box('muted', <HelpCircle className="w-4 h-4 shrink-0" />, `No government record available for ${res.year}`,
        <><p>DoCA publishes model approvals online from 2011. Approvals from other years are not in any public database, so TULA cannot show them. Ask the seller for the approval certificate.</p>{provenance}</>);
      return box('muted', <HelpCircle className="w-4 h-4 shrink-0" />, <>The {source} copy has no entries for {res.year}</>,
        <p>Ask the owner for the approval certificate and check it by hand.</p>);
    case 'not_found':
      if (publicView) return box('bad', <AlertTriangle className="w-4 h-4 shrink-0" />, <>Approval number {res.number} of {res.year} is not in the government register</>,
        <><p>DoCA's published register has no approval with this number. The number may be mistyped, the approval may be newer than TULA's copy, or the mark may not be genuine. You can search the official register yourself: {source}.</p>{provenance}</>);
      return box('bad', <AlertTriangle className="w-4 h-4 shrink-0" />, <>No approval number {res.number} in the {res.year} {source}</>,
        <p>{compact ? 'Ask the owner for the approval certificate.' : 'Ask the owner for the model approval certificate before accepting. The model may be unapproved, or the number mistyped.'}</p>);
    case 'found': {
      const e = res.matches[0];
      const tone = res.makerMatches === false ? 'warn' : 'ok';
      return box(tone, tone === 'ok' ? <BadgeCheck className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />,
        tone === 'ok' ? (publicView ? <>Model approved by the Government of India</> : <>In the {source}</>) : <>In the register, but for a different company</>,
        <>
          {res.matches.map(m => (
            <p key={m.pdf + m.equipment}>
              <strong>{m.company || 'Company not named in the register'}</strong> · {m.equipment || 'equipment not stated'}
              {m.issueDate ? ` · issued ${m.issueDate}` : ' · date not stated'}{' '}
              <a href={m.pdf} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-semibold underline">certificate <ExternalLink className="w-3 h-3" /></a>
            </p>
          ))}
          {res.makerMatches === false && manufacturer && <p>This record says the maker is <strong>{manufacturer}</strong>. Check the nameplate.</p>}
          {!compact && res.matches.length > 1 && <p>The register lists more than one entry for this number.</p>}
          {publicView && <p>Approval mark <span className="font-readout">IND/09/{String(res.year).slice(2)}/{res.number}</span>. This confirms the model was approved under section 22 of the Act. Whether this particular instrument was verified and stamped is shown only by its certificate of verification.</p>}
          {publicView ? provenance : !compact && e && res.coverage && <p className="text-[11px] text-ink-600">Copy of the public register, {res.coverage.entries.toLocaleString('en-IN')} entries from {res.coverage.from} to {res.coverage.to}.</p>}
        </>);
    }
  }
};
