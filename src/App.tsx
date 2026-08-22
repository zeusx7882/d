import { useEffect, useMemo, useRef, useState } from 'react'
import { Grid3X3, Link as LinkIcon, ShieldCheck, Sparkles, X } from 'lucide-react'
import decorationData from '../data/decorations.json'
import { AdminPanel } from './components/Admin/AdminPanel'
import { AuthButton } from './components/Auth/AuthButton'
import { CatalogView } from './components/Catalog/CatalogView'
import { LayerEditor, type LayerEditorHandle } from './components/Editor/LayerEditor'
import { useAuth } from './hooks/useAuth'
import { api } from './lib/api'
import { COPYRIGHT, PROTECTION_CONFIG } from './security-config'
import type { Decoration, Project } from './types'

const FAVORITES_KEY = 'pulso-favorites'

type View = 'editor' | 'catalog' | 'admin'
type MobileTab = 'editor' | 'catalog' | 'create'

function decodeProjectFromHash(hash: string): Project | null {
  const raw = hash.startsWith('#share=') ? hash.replace('#share=', '') : ''
  if (!raw) return null
  try {
    const binary = atob(raw)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const json = new TextDecoder().decode(bytes)
    const project = JSON.parse(json) as Project
    return { ...project, readOnly: true }
  } catch {
    return null
  }
}

export default function App() {
  const editorRef = useRef<LayerEditorHandle>(null)
  const auth = useAuth()
  const [view, setView] = useState<View>('editor')
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor')
  const [notice, setNotice] = useState('')
  const [sharedProject, setSharedProject] = useState<Project | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])

  const decorations = useMemo(() => (decorationData as Decoration[]).filter((item) => item.visible !== false), [])
  const favoritesKey = auth.user ? `${FAVORITES_KEY}:${auth.user.id}` : FAVORITES_KEY

  useEffect(() => {
    const decoded = decodeProjectFromHash(window.location.hash)
    if (decoded) {
      setSharedProject(decoded)
      setView('editor')
      setMobileTab('editor')
      setNotice('Projeto compartilhado carregado em modo somente leitura.')
    }
  }, [])

  useEffect(() => {
    const localFavorites = localStorage.getItem(favoritesKey)
    setFavorites(localFavorites ? JSON.parse(localFavorites) as string[] : [])
  }, [favoritesKey])

  useEffect(() => {
    localStorage.setItem(favoritesKey, JSON.stringify(favorites))
  }, [favorites, favoritesKey])

  useEffect(() => {
    if (!auth.enabled || !auth.user) return
    api.getFavorites()
      .then((payload) => {
        if (payload.favorites.length) {
          setFavorites(payload.favorites)
        }
      })
      .catch(() => undefined)
  }, [auth.enabled, auth.user])

  useEffect(() => {
    if (!auth.enabled || !auth.user) return
    api.saveFavorites(favorites).catch(() => undefined)
  }, [auth.enabled, auth.user, favorites])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 3400)
    return () => window.clearTimeout(timer)
  }, [notice])

  const isAdmin = auth.enabled && auth.isAdmin

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><Sparkles size={17} /></span><span>PULSO <b>GIFS</b></span></div>
        <nav className="main-nav" aria-label="Navegação principal">
          <div className="nav-segment" role="tablist">
            <button role="tab" aria-selected={view === 'editor'} className={view === 'editor' ? 'nav-tab active' : 'nav-tab'} onClick={() => setView('editor')}>
              <Sparkles size={14} /> <span>Editor</span>
            </button>
            <button role="tab" aria-selected={view === 'catalog'} className={view === 'catalog' ? 'nav-tab active' : 'nav-tab'} onClick={() => setView('catalog')}>
              <Grid3X3 size={14} /> <span>Catálogo</span><span className="count-badge">{decorations.length}</span>
            </button>
            {isAdmin && (
              <button role="tab" aria-selected={view === 'admin'} className={view === 'admin' ? 'nav-tab active' : 'nav-tab'} onClick={() => setView('admin')}>
                <ShieldCheck size={14} /> <span>Admin</span>
              </button>
            )}
          </div>
        </nav>
        <div className="top-actions">
          <a className="discord-link" href="https://discord.gg/52vcE7dpnQ" target="_blank" rel="noopener noreferrer"><LinkIcon size={15} /> Comunidade Discord</a>
          <AuthButton enabled={auth.enabled} loading={auth.loading} user={auth.user} onRefresh={auth.refresh} />
        </div>
      </header>

      <main className="workspace">
        <section className="intro">
          <div>
            <p className="eyebrow">PULSO GIFS STUDIO</p>
            <h1>Editor por <span>camadas</span>.</h1>
            <p className="intro-copy">Monte avatares com múltiplas decorações, texto, emoji, uploads e efeitos. Tudo continua funcionando no navegador, com fallback honesto quando o backend não estiver configurado.</p>
          </div>
          <div className="intro-badge"><Sparkles size={18} /><span>Static-first + backend opcional<br /><small>PNG, GIF, favoritos, projetos e compartilhamento</small></span></div>
        </section>

        {view === 'catalog' && (
          <CatalogView
            decorations={decorations}
            favorites={favorites}
            onToggleFavorite={(id) => setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])}
            onSelectDecoration={(decoration) => {
              void editorRef.current?.addDecorationLayer(decoration)
              setView('editor')
              setMobileTab('create')
            }}
            mode="full"
            title="Todas as decorações"
            description="Busca, categorias, tags e paginação em lotes de 48 itens."
          />
        )}

        {view === 'editor' && (
          <LayerEditor
            ref={editorRef}
            decorations={decorations}
            favorites={favorites}
            onToggleFavorite={(id) => setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])}
            onOpenLibrary={() => setView('catalog')}
            onNotice={setNotice}
            userId={auth.user?.id}
            sharedProject={sharedProject}
          />
        )}

        {view === 'admin' && <AdminPanel enabled={auth.enabled} isAdmin={isAdmin} />}

        <section className="trust-row">
          <span><span className="mini-dot" /> Processamento local para uploads</span>
          <span>Undo/redo com 30 snapshots</span>
          <span>GIF com limitação explicada na interface</span>
        </section>
      </main>

      <nav className="mobile-bottom-nav" aria-label="Atalhos mobile">
        <button className={mobileTab === 'editor' ? 'mobile-nav-btn active' : 'mobile-nav-btn'} onClick={() => { setView('editor'); setMobileTab('editor') }}>Editor</button>
        <button className={mobileTab === 'catalog' ? 'mobile-nav-btn active' : 'mobile-nav-btn'} onClick={() => { setView('catalog'); setMobileTab('catalog') }}>Catálogo</button>
        <button className={mobileTab === 'create' ? 'mobile-nav-btn active' : 'mobile-nav-btn'} onClick={() => { setView('editor'); setMobileTab('create') }}>Criar</button>
      </nav>

      <footer>
        <span>© {COPYRIGHT.year} {COPYRIGHT.owner}</span>
        <span>Ferramenta independente de criação de imagens. Não afiliada oficialmente ao Discord.</span>
        <a href="https://discord.gg/52vcE7dpnQ" target="_blank" rel="noopener noreferrer">Entre na comunidade →</a>
        {PROTECTION_CONFIG.showCopyrightNotice && <span className="footer-copyright">{COPYRIGHT.notice}</span>}
      </footer>

      {notice && <div className="toast"><Sparkles size={16} />{notice}<button onClick={() => setNotice('')} aria-label="Fechar"><X size={14} /></button></div>}
    </div>
  )
}
