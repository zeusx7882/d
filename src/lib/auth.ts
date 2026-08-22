export { type DiscordUser, type AuthState } from '../types'
import type { DiscordUser, AuthState } from '../types'

export const AUTH_ENABLED = import.meta.env.VITE_AUTH_ENABLED === 'true'
export const AUTH_API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export function getLoginLabel() {
  return AUTH_ENABLED ? 'Entrar com Discord' : 'Login próximamente'
}

export async function fetchAuthState(signal?: AbortSignal): Promise<AuthState> {
  if (!AUTH_ENABLED) {
    return { user: null, loading: false, error: null }
  }

  try {
    const response = await fetch(`${AUTH_API_BASE}/api/auth/me`, {
      credentials: 'include',
      signal,
    })

    if (response.status === 404 || response.status === 501) {
      return {
        user: null,
        loading: false,
        error: 'Backend de autenticação não configurado.',
      }
    }

    if (!response.ok) {
      return {
        user: null,
        loading: false,
        error: 'Não foi possível verificar sua sessão.',
      }
    }

    const payload = (await response.json()) as { user?: DiscordUser | null }
    return {
      user: payload.user ?? null,
      loading: false,
      error: null,
    }
  } catch (error) {
    return {
      user: null,
      loading: false,
      error: error instanceof Error ? error.message : 'Erro inesperado ao consultar login.',
    }
  }
}
