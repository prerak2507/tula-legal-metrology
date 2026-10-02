// Shared Gemini caller for server functions. The API key stays in GEMINI_API_KEY on the server.
// Tries the listed models in order; returns the first text answer.

const MODELS = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
const ENDPOINT = m => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;

async function post(apiKey, model, body, timeoutMs) {
  const r = await fetch(ENDPOINT(model), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = await r.json().catch(() => ({}));
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
  return { ok: r.ok, status: r.status, data, text };
}

/** contents: Gemini "contents" array. schema: optional JSON response schema. */
export async function callGemini(apiKey, { contents, system, schema, timeoutMs = 20_000 }) {
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
      let out = await post(apiKey, model, body, timeoutMs);
      if (out.status === 400 && /thinking/i.test(out.data?.error?.message || '')) {
        // Model does not accept a thinking level: retry the same model without it.
        delete body.generationConfig.thinkingConfig;
        out = await post(apiKey, model, body, timeoutMs);
      }
      if (out.ok && out.text) return { model, text: out.text };
      lastError = `${model}: ${out.status} ${out.data?.error?.message || ''}`.trim();
    } catch (e) {
      lastError = `${model}: ${e.message}`;
    }
  }
  throw new Error(lastError);
}

/** Parses a JSON answer; returns null when the model returned something else. */
export function parseJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}
