// @ts-nocheck
import { Request, Response, NextFunction } from 'express'
import crypto from 'node:crypto'

// ── CSRF double-submit token ──────────────────────────────────────────────────
// The server stores a random token in the session and returns it via
// GET /api/auth/csrf-token. The frontend must echo it in the
// X-CSRF-Token request header for every mutating request.

export function generateCsrfToken(req: Request): string {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex')
  }
  return req.session.csrfToken
}

/**
 * Middleware: validate X-CSRF-Token header on mutating requests.
 * GET / HEAD / OPTIONS are exempt (idempotent).
 */
export function csrfMiddleware(req: Request, res: Response, next: NextFunction): void {
  const exempt = ['GET', 'HEAD', 'OPTIONS']
  if (exempt.includes(req.method)) {
    next()
    return
  }

  const sessionToken = req.session?.csrfToken
  const headerToken = req.headers['x-csrf-token']

  if (!sessionToken || !headerToken || !timingSafeEqual(String(sessionToken), String(headerToken))) {
    res.status(403).json({ error: 'Token CSRF inválido ou ausente.' })
    return
  }
  next()
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return crypto.timingSafeEqual(bufA, bufB)
}

// ── Simple in-memory rate limiter ─────────────────────────────────────────────
// Uses a sliding window. Works for single-process deployments.
// For multi-instance, swap the Map for Redis.

interface RateRecord {
  count: number
  windowStart: number
}

const rateLimitStore = new Map<string, RateRecord>()

/**
 * Create a rate-limit middleware.
 * @param maxRequests Maximum requests per window
 * @param windowMs    Window size in milliseconds
 */
export function rateLimit(maxRequests: number, windowMs: number) {
  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    const key = `${req.ip ?? 'unknown'}:${req.path}`
    const now = Date.now()
    const record = rateLimitStore.get(key)

    if (!record || now - record.windowStart > windowMs) {
      rateLimitStore.set(key, { count: 1, windowStart: now })
      next()
      return
    }

    record.count += 1

    if (record.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((record.windowStart + windowMs - now) / 1000).toString())
      res.status(429).json({ error: 'Muitas requisições. Aguarde um momento.' })
      return
    }

    next()
  }
}

// Periodically prune stale entries to avoid unbounded memory growth
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now - record.windowStart > 60_000) {
      rateLimitStore.delete(key)
    }
  }
}, 60_000)
