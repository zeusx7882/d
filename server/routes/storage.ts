// @ts-nocheck
import { Router } from 'express'

export const storageRouter = Router()

storageRouter.get('/sign', (req, res) => {
  const user = req.session.user
  console.log('[storage/sign]', { path: req.query.path, userId: user?.id ?? null, at: new Date().toISOString() })
  if (!user) {
    res.status(401).json({ error: 'Autenticação obrigatória para URL assinada.' })
    return
  }

  const path = typeof req.query.path === 'string' ? req.query.path : ''
  res.json({ url: path, expiresAt: new Date(Date.now() + 60_000).toISOString(), provider: 'stub' })
})
