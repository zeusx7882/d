// @ts-nocheck
import { Router } from 'express'

export const projectsRouter = Router()
const sharedProjects = new Map()

projectsRouter.get('/favorites', (req, res) => {
  const favorites = req.session.favorites || []
  res.json({ favorites })
})

projectsRouter.post('/favorites', (req, res) => {
  req.session.favorites = Array.isArray(req.body.favorites) ? req.body.favorites : []
  res.json({ ok: true })
})

projectsRouter.post('/projects/share', (req, res) => {
  const project = req.body.project
  if (!project) {
    res.status(400).json({ error: 'Projeto ausente.' })
    return
  }

  const id = crypto.randomUUID()
  sharedProjects.set(id, { ...project, readOnly: true })
  res.json({ id, url: `/api/share/${id}` })
})

projectsRouter.get('/share/:id', (req, res) => {
  const project = sharedProjects.get(req.params.id)
  if (!project) {
    res.status(404).json({ error: 'Projeto não encontrado.' })
    return
  }

  res.json({ project })
})
