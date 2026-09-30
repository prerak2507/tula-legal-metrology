// POST /api/gemini
// Server-side proxy for Google Gemini. The API key stays in GEMINI_API_KEY on the server.
// Prompts are built here, so a caller cannot turn this into a general-purpose AI endpoint.
// Gemini only assists: it never computes fees, MPE limits or pass/fail.

import { guard, readJson, send } from './_lib/common.js';

const MODELS = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

const ASSISTANT_PROMPT = `You are the TULA help assistant for the Legal Metrology verification system in India.
Answer questions about the Legal Metrology Act, 2009, the Legal Metrology (General) Rules, 2011,
the Government Approved Test Centre Rules, 2013, and how to use TULA (register, apply, pay, track, verify a QR).
Rules:
- Be short and practical. Use plain language. Reply in the user's language (English, Hindi or Gujarati).
- If you are not sure of a section number, fee or limit, say so and tell the user to check with the district Legal Metrology office.
- Fees and validity periods are set by each State's enforcement rules and differ by state. Never quote a fee as final.
- You cannot approve, reject or certify anything.`;

const SCRUTINY_PROMPT = `You assist a Legal Metrology officer with document scrutiny of a verification application.
Compare the application fields and look for problems an officer should check. You do not decide.
Flag: missing or odd model approval number format, capacity vs scale interval that looks inconsistent
for the accuracy class, instrument category that normally needs a GATC or specialised test, anything unusual.
Return JSON only. Keep each flag under 25 words. If nothing looks wrong, return an empty flags array.`;

const SCRUTINY_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING' },
    flags: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          field: { type: 'STRING' },
          issue: { type: 'STRING' },
          severity: { type: 'STRING', enum: ['LOW', 'MEDIUM', 'HIGH'] },
        },
        required: ['field', 'issue', 'severity'],
      },
    },
  },
  required: ['summary', 'flags'],
};

async function callGemini(apiKey, { contents, system, schema }) {
  let lastError = 'no model responded';
  for (const model of MODELS) {
    try {
      const body = {
        contents,
        systemInstruction: { parts: [{ text: system }] },
        // Newer Flash models "think" before answering; minimal thinking keeps answers fast and
        // stops the reasoning from eating the output budget (which truncated the JSON).
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048, thinkingConfig: { thinkingLevel: 'minimal' } },
      };
      if (schema) {
        body.generationConfig.responseMimeType = 'application/json';
        body.generationConfig.responseSchema = schema;
      }
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20_000),
      });
      const data = await r.json().catch(() => ({}));
      if (r.status === 400 && body.generationConfig.thinkingConfig && /thinking/i.test(data?.error?.message || '')) {
        // Model does not accept a thinking level: retry the same model without it.
        delete body.generationConfig.thinkingConfig;
        const r2 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, body: JSON.stringify(body), signal: AbortSignal.timeout(20_000),
        });
        const d2 = await r2.json().catch(() => ({}));
        const t2 = d2?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
        if (r2.ok && t2) return { model, text: t2 };
      }
      const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
      if (r.ok && text) return { model, text };
      lastError = `${model}: ${r.status} ${data?.error?.message || ''}`.trim();
    } catch (e) {
      lastError = `${model}: ${e.message}`;
    }
  }
  throw new Error(lastError);
}

const clip = (s, n) => String(s ?? '').slice(0, n);

export default async function handler(req, res) {
  if (!guard(req, res, { name: 'gemini', limit: 12, windowMs: 60_000 })) return;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return send(res, 503, { error: 'ai_not_configured', message: 'AI assistant is not configured on this deployment.' });

  let body;
  try {
    body = await readJson(req);
  } catch {
    return send(res, 400, { error: 'invalid_json' });
  }

  try {
    if (body.mode === 'assistant') {
      const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
      const contents = history
        .filter(m => m && (m.role === 'user' || m.role === 'model'))
        .map(m => ({ role: m.role, parts: [{ text: clip(m.text, 1500) }] }));
      contents.push({ role: 'user', parts: [{ text: clip(body.question, 1500) }] });
      const out = await callGemini(apiKey, { contents, system: ASSISTANT_PROMPT });
      return send(res, 200, { model: out.model, text: out.text });
    }

    if (body.mode === 'scrutiny') {
      const a = body.application || {};
      const fields = ['category', 'categoryName', 'accuracyClass', 'capacity', 'scaleInterval', 'manufacturer', 'model',
        'modelApprovalNumber', 'serialNumber', 'serviceType', 'state', 'district'];
      const lines = fields.map(f => `${f}: ${clip(a[f], 120)}`).join('\n');
      const out = await callGemini(apiKey, {
        contents: [{ role: 'user', parts: [{ text: `Application fields:\n${lines}` }] }],
        system: SCRUTINY_PROMPT,
        schema: SCRUTINY_SCHEMA,
      });
      let parsed;
      try {
        parsed = JSON.parse(out.text);
      } catch {
        return send(res, 502, { error: 'ai_bad_output', message: 'The AI returned an unreadable answer. Continue with manual scrutiny.' });
      }
      const flags = Array.isArray(parsed.flags) ? parsed.flags.slice(0, 8) : [];
      return send(res, 200, { model: out.model, summary: clip(parsed.summary, 600), flags });
    }

    return send(res, 400, { error: 'unknown_mode' });
  } catch (e) {
    console.error('gemini_error', e.message);
    return send(res, 502, { error: 'ai_unavailable', message: 'The AI service did not respond. Continue with manual scrutiny.' });
  }
}
