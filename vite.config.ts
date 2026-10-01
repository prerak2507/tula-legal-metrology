import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Runs the same /api/*.js handlers that Vercel deploys, so `npm run dev` and `npm run preview`
// behave like production (signing, AI proxy, notifications, health).
function localApi(): Plugin {
  const handle = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const match = (req.url || '').match(/^\/api\/([a-z-]+)(?:\?.*)?$/)
    if (!match) return next()
    const file = resolve(process.cwd(), 'api', `${match[1]}.js`)
    if (!existsSync(file)) return next()
    try {
      const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`)
      await mod.default(req, res)
    } catch (e) {
      res.statusCode = 500
      res.end(JSON.stringify({ error: 'local_api_error', message: (e as Error).message }))
    }
  }
  return {
    name: 'tula-local-api',
    configureServer(server) { server.middlewares.use(handle) },
    configurePreviewServer(server) { server.middlewares.use(handle) },
  }
}

export default defineConfig(({ mode }) => {
  // Server-only secrets for the local API (never exposed to the client bundle).
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of ['GEMINI_API_KEY', 'CERT_SIGNING_PRIVATE_KEY', 'CERT_SIGNING_KEY_ID', 'RESEND_API_KEY', 'NOTIFY_FROM_EMAIL', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM', 'NOTIFY_ALLOWLIST']) {
    if (env[key] && !process.env[key]) process.env[key] = env[key]
  }
  return {
    plugins: [react(), localApi()],
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    // Shown as "Last updated" in the portal footer.
    define: { __BUILD_DATE__: JSON.stringify(new Date().toISOString()) },
  }
})
