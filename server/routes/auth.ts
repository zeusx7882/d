// @ts-nocheck
import { Router } from 'express'

export const authRouter = Router()

function isAdmin(userId) {
  const adminIds = (process.env.ADMIN_DISCORD_IDS || '').split(',').map((value) => value.trim()).filter(Boolean)
  return Boolean(userId && adminIds.includes(userId))
}

authRouter.get('/discord', (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID
  const redirectUri = process.env.DISCORD_REDIRECT_URI
  if (!clientId || !redirectUri) {
    res.status(501).json({ error: 'OAuth do Discord não configurado.' })
    return
  }

  const state = crypto.randomUUID()
  req.session.oauthState = state
  const search = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'identify',
    prompt: 'consent',
    state,
  })
  res.redirect(`https://discord.com/oauth2/authorize?${search.toString()}`)
})

authRouter.get('/discord/callback', async (req, res) => {
  const { code, state } = req.query
  if (!code || !state || state !== req.session.oauthState) {
    res.status(400).json({ error: 'State inválido no OAuth.' })
    return
  }

  const clientId = process.env.DISCORD_CLIENT_ID
  const clientSecret = process.env.DISCORD_CLIENT_SECRET
  const redirectUri = process.env.DISCORD_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) {
    res.status(501).json({ error: 'OAuth do Discord não configurado.' })
    return
  }

  try {
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Falha ao trocar code por token')
    }

    const tokenPayload = await tokenResponse.json()
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: 'Bearer ' + tokenPayload.access_token },
    })

    if (!userResponse.ok) {
      throw new Error('Falha ao buscar perfil do Discord')
    }

    const user = await userResponse.json()
    req.session.user = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      discriminator: user.discriminator,
    }
    delete req.session.oauthState
    res.redirect('/')
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Falha no login Discord.' })
  }
})

authRouter.get('/me', (req, res) => {
  const user = req.session.user || null
  res.json({ user, isAdmin: isAdmin(user?.id) })
})

authRouter.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true })
  })
})
