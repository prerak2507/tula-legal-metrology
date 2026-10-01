// SMS and email text. One copy, used by the server (api/notify.js) and the app's outbox view.
// Kept short: links are plain check or apply pages, never the signed QR payload, so an SMS stays readable.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-09-14" -> "14 Sep 2026". Anything else is returned unchanged. */
export function fmtDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : (iso || '');
}

export const TEMPLATES = {
  APPLICATION_SUBMITTED: p => ({
    subject: `Application ${p.appId} received`,
    text: `TULA: Application ${p.appId} for ${p.instrumentId} received. Track: ${p.link}`,
  }),
  FEE_RECEIVED: p => ({
    subject: `Fee received for ${p.appId}`,
    text: `TULA: Fee of Rs ${p.amount} received for ${p.appId}. Receipt ${p.ref}.`,
  }),
  CORRECTION_REQUIRED: p => ({
    subject: `Correction needed on ${p.appId}`,
    text: `TULA: Application ${p.appId} needs a correction: ${p.note}. Open: ${p.link}`,
  }),
  INSPECTION_SCHEDULED: p => ({
    subject: `Inspection scheduled for ${p.appId}`,
    text: `TULA: Inspection of ${p.instrumentId} on ${fmtDate(p.date)}, ${p.slot}. Officer: ${p.officer}.`,
  }),
  CERTIFICATE_ISSUED: p => ({
    subject: `Certificate ${p.certNo} issued`,
    text: `TULA: Certificate ${p.certNo} issued for ${p.instrumentId}, valid until ${fmtDate(p.validUntil)}. Display it at the premises. Check: ${p.link}`,
  }),
  INSPECTION_FAILED: p => ({
    subject: `Inspection result for ${p.appId}`,
    text: `TULA: ${p.instrumentId} did not pass verification (${p.result}). Open: ${p.link}`,
  }),
  EXPIRY_REMINDER: p => p.expired === '1'
    ? {
      subject: `Verification expired: ${p.instrumentId}`,
      text: `TULA: Verification of ${p.instrumentId} expired on ${fmtDate(p.dueDate)}. Using it for trade is an offence under section 24, Legal Metrology Act. Apply: ${p.link}`,
    }
    : {
      subject: `Re-verification due: ${p.instrumentId}`,
      text: `TULA: Verification of ${p.instrumentId} is due ${p.days === '0' ? 'today' : `on ${fmtDate(p.dueDate)}, in ${p.days} day${p.days === '1' ? '' : 's'}`}. Apply: ${p.link}`,
    },
};
