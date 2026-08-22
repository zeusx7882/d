// @ts-nocheck
import { Router } from 'express'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import rateLimit from 'express-rate-limit'

export const adminRouter = Router()
const dataPath = resolve(process.cwd(), 'data/decorations.json')

// Rate-limit all admin routes: 30 requests per minute per IP
adminRouter.use(rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false }))

function requireAdmin(req, res, next) {
  const adminIds = (process.env.ADMIN_DISCORD_IDS || '').split(',').map((value) => value.trim()).filter(Boolean)
  const userId = req.session.user?.id
  if (!userId || !adminIds.includes(userId)) {
    res.status(403).json({ error: 'Acesso negado.' })
    return
  }
  next()
}

function readDecorations() {
  return JSON.parse(readFileSync(dataPath, 'utf8'))
}

adminRouter.use(requireAdmin)

adminRouter.get('/decorations', (_req, res) => {
  res.json({ decorations: readDecorations() })
})

adminRouter.put('/decorations/:id', (req, res) => {
  const decorations = readDecorations()
  const index = decorations.findIndex((item) => item.id === req.params.id)
  if (index < 0) {
    res.status(404).json({ error: 'Decoração não encontrada.' })
    return
  }

  const current = decorations[index]
  decorations[index] = {
    ...current,
    name: typeof req.body.name === 'string' ? req.body.name.slice(0, 100) : current.name,
    category: typeof req.body.category === 'string' ? req.body.category.slice(0, 60) : current.category,
    tags: Array.isArray(req.body.tags) ? req.body.tags.slice(0, 20).map((t) => String(t).slice(0, 40)) : current.tags,
    featured: typeof req.body.featured === 'boolean' ? req.body.featured : current.featured,
    visible: typeof req.body.visible === 'boolean' ? req.body.visible : current.visible,
  }

  writeFileSync(dataPath, JSON.stringify(decorations, null, 2) + '\n', 'utf8')
  res.json({ decoration: decorations[index] })
})

adminRouter.post('/manifest/refresh', (_req, res) => {
  const decorations = readDecorations()
  res.json({ refreshedAt: new Date().toISOString(), total: decorations.length })
})
