import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCcw, Save, ShieldCheck, Star } from 'lucide-react'
import { api } from '../../lib/api'
import { DECORATION_CATEGORIES, type Decoration } from '../../types'

type AdminPanelProps = {
  enabled: boolean
  isAdmin: boolean
}

export function AdminPanel({ enabled, isAdmin }: AdminPanelProps) {
  const [decorations, setDecorations] = useState<Decoration[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({})
  const [refreshInfo, setRefreshInfo] = useState('')

  useEffect(() => {
    if (!enabled || !isAdmin) return
    setLoading(true)
    api.getAdminDecorations()
      .then((payload) => {
        setDecorations(payload.decorations)
        setError(null)
      })
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : 'Falha ao carregar o painel admin.')
      })
      .finally(() => setLoading(false))
  }, [enabled, isAdmin])

  if (!enabled) {
    return <section className="admin-panel panel"><div className="empty state-box"><ShieldCheck size={28} /><p>Ative <code>VITE_AUTH_ENABLED=true</code> e configure o backend para liberar o painel.</p></div></section>
  }

  if (!isAdmin) {
    return <section className="admin-panel panel"><div className="empty state-box"><AlertTriangle size={28} /><p>Apenas administradores autenticados podem acessar esta área.</p></div></section>
  }

  const updateLocalDecoration = (id: string, patch: Partial<Decoration>) => {
    setDecorations((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item))
  }

  return (
    <section className="admin-panel panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">ADMIN</p>
          <h2>Gerenciar catálogo</h2>
        </div>
        <button
          className="secondary-btn"
          onClick={async () => {
            const payload = await api.refreshManifest()
            setRefreshInfo(`Manifesto atualizado em ${new Date(payload.refreshedAt).toLocaleTimeString('pt-BR')}`)
          }}
        >
          <RefreshCcw size={16} /> Atualizar manifesto
        </button>
      </div>

      {refreshInfo && <p className="hint-inline">{refreshInfo}</p>}
      {loading && <p className="section-copy">Carregando catálogo administrativo…</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="admin-grid">
        {decorations.map((item) => (
          <article key={item.id} className="admin-card">
            <div className="admin-thumb-wrap">
              <img src={item.thumbnail} alt={item.name} className="admin-thumb" onError={() => setBrokenImages((current) => ({ ...current, [item.id]: true }))} />
              {brokenImages[item.id] && <span className="broken-flag"><AlertTriangle size={14} /> Quebrada</span>}
            </div>
            <div className="admin-form">
              <label>
                Nome
                <input value={item.name} onChange={(event) => updateLocalDecoration(item.id, { name: event.target.value })} />
              </label>
              <label>
                Categoria
                <select value={item.category} onChange={(event) => updateLocalDecoration(item.id, { category: event.target.value })}>
                  {DECORATION_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label>
                Tags
                <input value={item.tags.join(', ')} onChange={(event) => updateLocalDecoration(item.id, { tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })} />
              </label>
              <div className="quick-add-grid admin-switches">
                <label className="checkbox-row"><input type="checkbox" checked={Boolean(item.featured)} onChange={(event) => updateLocalDecoration(item.id, { featured: event.target.checked })} /> <Star size={14} /> Destaque</label>
                <label className="checkbox-row"><input type="checkbox" checked={item.visible !== false} onChange={(event) => updateLocalDecoration(item.id, { visible: event.target.checked })} /> Visível</label>
              </div>
              <button
                className="secondary-btn"
                onClick={async () => {
                  const payload = await api.updateAdminDecoration(item.id, item)
                  updateLocalDecoration(item.id, payload.decoration)
                }}
              >
                <Save size={16} /> Salvar
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
