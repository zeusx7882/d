import type { Decoration, DiscordUser, Project } from '../types'

const API_ROOT = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

// ── CSRF token cache ──────────────────────────────────────────────────────────
// Fetch once per page load; included as X-CSRF-Token header on all mutations.
let csrfTokenPromise: Promise<string> | null = null

function getCsrfToken(): Promise<string> {
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetch(`${API_ROOT}/api/auth/csrf-token`, { credentials: 'include' })
      .then(r => r.ok ? r.json() as Promise<{ csrfToken: string }> : Promise.reject(new Error('CSRF fetch failed')))
      .then(body => body.csrfToken)
      .catch(() => { csrfTokenPromise = null; return '' })
  }
  return csrfTokenPromise
}

// ── Core request helper ───────────────────────────────────────────────────────
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isMutation = init?.method && !['GET', 'HEAD', 'OPTIONS'].includes(init.method.toUpperCase())
  const csrfToken = isMutation ? await getCsrfToken() : ''

  const response = await fetch(`${API_ROOT}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Falha ao comunicar com a API.')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const api = {
  me: () => request<{ user: DiscordUser | null; isAdmin?: boolean }>('/api/auth/me'),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  getFavorites: () => request<{ favorites: string[] }>('/api/favorites'),
  saveFavorites: (favorites: string[]) => request<{ ok: boolean }>('/api/favorites', {
    method: 'POST',
    body: JSON.stringify({ favorites }),
  }),
  getAdminDecorations: () => request<{ decorations: Decoration[] }>('/api/admin/decorations'),
  updateAdminDecoration: (id: string, payload: Partial<Decoration>) => request<{ decoration: Decoration }>(`/api/admin/decorations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  refreshManifest: () => request<{ refreshedAt: string; total: number }>('/api/admin/manifest/refresh', {
    method: 'POST',
    body: JSON.stringify({}),
  }),
  createShare: (project: Project) => request<{ id: string; url: string }>('/api/projects/share', {
    method: 'POST',
    body: JSON.stringify({ project }),
  }),
  getSharedProject: (id: string) => request<{ project: Project }>('/api/share/' + encodeURIComponent(id)),
}
