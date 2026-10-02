// Plain checks on a QR that TULA could not match (no signature, no approval mark, no certificate number).
// These run before any AI call and their flags are certain. Shared by api/check.js and the tests.

const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'cutt.ly', 'rb.gy', 'ow.ly', 'shorturl.at', 'tiny.cc'];
const GOV_WORDS = /(gov|legal|metrology|doca|consumer|verify|verification|certificate|ministry|sarkar)/i;
const GOV_DOMAIN = /(\.gov\.in|\.nic\.in)$/i;

/** Hides phone, Aadhaar-style and account numbers, UPI IDs, e-mails and passwords before text leaves the server. */
export function maskSensitive(text) {
  return String(text)
    .replace(/([;:]P:)[^;]*/gi, '$1•••')                                                                       // Wi-Fi password
    .replace(/\b(pn|name)=([^&]*)/gi, '$1=•••')                                                                // payee name
    .replace(/([\w.-]{1,64})@([a-z]{2,32})\b(?!\.)/gi, (_, user, bank) => `${user.slice(0, 2)}•••@${bank}`)   // UPI IDs
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.]+\b/g, m => `${m.slice(0, 2)}•••@•••`)                                    // e-mail
    .replace(/\+?\d[\d\s-]{6,}\d/g, m => (m.replace(/\D/g, '').length >= 7 ? `${m.slice(0, 2)}•••${m.slice(-2)}` : m)); // numbers, spaced or not
}

/** AI text shown to buyers must not carry links, numbers or reassurances; such text is dropped. */
export function safeAiText(t) {
  const s = String(t || '').trim();
  if (!s) return null;
  if (/https?:\/\/|www\.|\b[\w-]+\.(com|in|net|org|app|ly|co)\b/i.test(s)) return null;
  if (/\d{5,}|\d[\d\s-]{6,}\d/.test(s)) return null;
  if (/\b(genuine|approved|safe|verified|legit(imate)?|trusted)\b/i.test(s)) return null;
  return s;
}

/** What the QR is, and certain warnings about it. */
export function precheckQr(raw) {
  const text = String(raw || '').trim();
  const flags = [];
  const add = (level, message) => flags.push({ level, message });

  if (/^upi:\/\//i.test(text)) {
    add('warn', 'This is a UPI payment request, not a certificate. Paying it does not verify anything.');
    return { kind: 'payment', flags };
  }
  if (/^WIFI:/i.test(text)) return { kind: 'wifi', flags };
  if (/^BEGIN:VCARD/i.test(text) || /^MECARD:/i.test(text)) return { kind: 'contact', flags };
  if (/^(tel|sms|smsto):/i.test(text)) return { kind: 'phone', flags };
  if (/^\d{8,14}$/.test(text)) {
    add('info', 'Only digits: this looks like a product barcode number, not a certificate.');
    return { kind: 'product_code', flags };
  }

  let url = null;
  try { if (/^https?:\/\//i.test(text)) url = new URL(text); } catch { url = null; }
  if (!url) return { kind: 'text', flags };

  const host = url.hostname.toLowerCase();
  if (url.protocol === 'http:') add('warn', 'The link is not encrypted (http, not https).');
  if (SHORTENERS.includes(host.replace(/^www\./, ''))) add('warn', 'This is a shortened link, so its real destination is hidden.');
  if (host.split('.').some(p => p.startsWith('xn--'))) add('warn', 'The address uses look-alike characters (an internationalised domain).');
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) add('warn', 'The link points to a bare IP address, not a named website.');
  if (GOV_DOMAIN.test(host)) add('info', `Government domain (${host}). TULA cannot vouch for the page itself.`);
  else if (GOV_WORDS.test(host)) add('warn', `The address (${host}) uses government-sounding words but is not a .gov.in or .nic.in site.`);
  return { kind: 'link', host, flags };
}
