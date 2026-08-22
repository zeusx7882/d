import { LogIn, LogOut, ShieldCheck } from 'lucide-react'
import { AUTH_API_BASE } from '../../lib/auth'
import { api } from '../../lib/api'
import type { DiscordUser } from '../../types'

type AuthButtonProps = {
  enabled: boolean
  loading: boolean
  user: DiscordUser | null
  onRefresh: () => Promise<void> | void
}

function avatarUrl(user: DiscordUser) {
  return user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=96`
    : `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator || 0) % 5}.png`
}

export function AuthButton({ enabled, loading, user, onRefresh }: AuthButtonProps) {
  if (!enabled) {
    return <span className="auth-badge auth-badge-disabled"><ShieldCheck size={14} /> Login próximamente</span>
  }

  if (user) {
    return (
      <div className="auth-user">
        <img src={avatarUrl(user)} alt={user.username} className="auth-avatar" />
        <div className="auth-copy">
          <strong>{user.username}</strong>
          <span>Discord conectado</span>
        </div>
        <button
          className="secondary-btn"
          onClick={async () => {
            try {
              await api.logout()
            } finally {
              await onRefresh()
            }
          }}
        >
          <LogOut size={16} /> Sair
        </button>
      </div>
    )
  }

  return (
    <a className="secondary-btn auth-login" href={`${AUTH_API_BASE}/api/auth/discord`} aria-disabled={loading}>
      <LogIn size={16} /> {loading ? 'Carregando...' : 'Entrar com Discord'}
    </a>
  )
}
