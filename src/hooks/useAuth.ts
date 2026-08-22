import { useCallback, useEffect, useState } from 'react'
import { AUTH_ENABLED } from '../lib/auth'
import { api } from '../lib/api'
import type { AuthState } from '../types'

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: AUTH_ENABLED,
    error: null,
  })
  const [isAdmin, setIsAdmin] = useState(false)

  const refresh = useCallback(async () => {
    if (!AUTH_ENABLED) {
      setState({ user: null, loading: false, error: null })
      setIsAdmin(false)
      return
    }

    setState((current) => ({ ...current, loading: true, error: null }))
    try {
      const payload = await api.me()
      setState({ user: payload.user ?? null, loading: false, error: null })
      setIsAdmin(Boolean(payload.isAdmin))
    } catch (error) {
      setState({
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Não foi possível carregar seu login.',
      })
      setIsAdmin(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    ...state,
    enabled: AUTH_ENABLED,
    isAdmin,
    refresh,
  }
}
