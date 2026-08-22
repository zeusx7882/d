// @ts-nocheck
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import session from 'express-session'
import { doubleCsrf } from 'csrf-csrf'
import { authRouter } from './routes/auth'
import { adminRouter } from './routes/admin'
import { storageRouter } from './routes/storage'
import { projectsRouter } from './routes/projects'
import { generateCsrfToken as legacyGenerateCsrfToken } from './middleware'

const app = express()
const port = Number(process.env.PORT || 3001)

// ── CORS: require an explicit, narrowly scoped origin ──────────────────────
// CORS_ORIGIN must be set to a specific origin string in production,
// e.g. "https://pulsogifs.com". Wildcard (*) is not permitted.
const rawCorsOrigin = process.env.CORS_ORIGIN || ''
const allowedOrigins: string[] = rawCorsOrigin
  .split(',')
  .map((o) => o.trim())
  .filter((o) => o.length > 0 && o !== '*')

if (allowedOrigins.length === 0 && process.env.NODE_ENV === 'production') {
  console.error('[security] CORS_ORIGIN is not set – cross-origin requests will be rejected.')
}

app.use(helmet())
app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin / non-browser tool requests (no Origin header)
    if (!origin) { callback(null, false); return }
    if (allowedOrigins.includes(origin)) { callback(null, true); return }
    callback(new Error(`CORS: origin not allowed – ${origin}`))
  },
  credentials: true,
}))

app.use(express.json({ limit: '2mb' }))
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}))

// ── CSRF protection (csrf-csrf double-submit cookie) ───────────────────────
const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.SESSION_SECRET || 'change-me-in-production',
  cookieName: '__Host-x-csrf-token',
  cookieOptions: {
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
})

// Apply CSRF protection globally (GET/HEAD/OPTIONS are automatically exempt)
app.use(doubleCsrfProtection)

// ── CSRF token endpoint ──────────────────────────────────────────────────────
// Frontend fetches this once; sends token back as X-CSRF-Token on mutations.
app.get('/api/auth/csrf-token', (req, res) => {
  res.json({ csrfToken: generateToken(req, res) })
})

app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)
app.use('/api/storage', storageRouter)
app.use('/api', projectsRouter)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mode: 'backend-boundary' })
})

app.listen(port, () => {
  console.log(`PULSO GIFS backend listening on http://localhost:${port}`)
})

