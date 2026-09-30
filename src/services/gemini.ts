// Client for the TULA AI assistant. All Gemini calls go through /api/gemini, so the API key
// never reaches the browser. When the AI is unavailable the caller gets a clear error and the
// workflow continues manually. Nothing here invents a result.

export interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini' | 'system';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
}

export interface ScrutinyFlag {
  field: string;
  issue: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ScrutinyResult {
  model: string;
  summary: string;
  flags: ScrutinyFlag[];
}

export class AiUnavailableError extends Error {}

async function post<T>(body: unknown): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new AiUnavailableError('You are offline. The AI assistant needs a connection.');
  }
  let r: Response;
  try {
    r = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new AiUnavailableError('Could not reach the AI service.');
  }
  const data = await r.json().catch(() => ({}));
  if (r.status === 404 || r.status === 503) throw new AiUnavailableError('The AI assistant is not switched on for this deployment.');
  if (r.status === 429) throw new AiUnavailableError('Too many AI requests. Wait a minute and try again.');
  if (!r.ok) throw new AiUnavailableError(data.message || 'The AI service did not answer.');
  return data as T;
}

export async function getAiStatus(): Promise<{ configured: boolean }> {
  try {
    const r = await fetch('/api/health');
    if (!r.ok) return { configured: false };
    const d = await r.json();
    return { configured: Boolean(d.ai?.configured) };
  } catch {
    return { configured: false };
  }
}

export async function askMetrologyAssistant(
  question: string,
  conversationHistory: { sender: 'user' | 'gemini'; text: string }[] = [],
): Promise<string> {
  const history = conversationHistory.slice(-6).map(m => ({ role: m.sender === 'user' ? 'user' : 'model', text: m.text }));
  const data = await post<{ text: string }>({ mode: 'assistant', question, history });
  return data.text;
}

/** Advisory scrutiny. Returns flags for the officer to check; it never approves or rejects. */
export async function analyzeApplicationScrutiny(application: Record<string, string | undefined>): Promise<ScrutinyResult> {
  return post<ScrutinyResult>({ mode: 'scrutiny', application });
}

/** Kept for the rules screen health check. */
export async function testGeminiConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const text = await askMetrologyAssistant('Reply with the single word OK.');
    return { ok: true, message: `AI assistant reachable (${text.slice(0, 20)})` };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export const isGeminiConfigured = true; // real status comes from getAiStatus()
