import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { Download, Film, Heart, ImagePlus, Link as LinkIcon, Menu, RotateCcw, Search, Sparkles, Undo2, Redo2, X, ZoomIn, ZoomOut, ArrowRight, Grid3X3, ShieldCheck } from 'lucide-react'
import gifshot from 'gifshot'
import decorationData from '../data/decorations.json'
import type { Decoration, EditorState } from './types'
import { PROTECTION_CONFIG, COPYRIGHT } from './security-config'

const staticDecorations = decorationData as Decoration[]
const catalogDecorationUrls = import.meta.glob('../public/decorations/catalogo/decoracao_*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const catalogDecorations = Object.entries(catalogDecorationUrls).map(([path, asset]) => {
  const fileName = path.split('/').slice(-1)[0]?.replace('.png', '') || 'decoracao'
  const code = fileName.replace(/^decoracao_/, '')
  return {
    id: fileName,
    name: `Decoração ${code}`,
    category: 'Catálogo',
    thumbnail: asset,
    asset,
    tags: ['catálogo', 'png', code]
  } satisfies Decoration
})
const decorations = [...staticDecorations, ...catalogDecorations]
const baseCategories = ['Populares', 'Novidades', 'Animais', 'Fantasia', 'Halloween', 'Natal', 'Amor', 'Fogo', 'Anjos', 'Demônios', 'Natureza', 'Outros']
const categories = ['Todas', ...baseCategories.filter(c => decorations.some(d => d.category === c)), ...Array.from(new Set(decorations.map(d => d.category))).filter(c => !baseCategories.includes(c))]
const initialEditor: EditorState = { x: 0, y: 0, scale: 1, rotation: 0, zoom: 1 }

// Fallback placeholder SVG for broken decoration thumbnails
const BROKEN_THUMB = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45"><rect width="45" height="45" fill="%230d0e12" rx="8"/><text x="22" y="28" font-size="18" text-anchor="middle" fill="%23444">✦</text></svg>')}`

type View = 'editor' | 'library'

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [view, setView] = useState<View>('editor')
  const [avatar, setAvatar] = useState<HTMLImageElement | null>(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [gifPreviewUrl, setGifPreviewUrl] = useState('')
  const [selected, setSelected] = useState<Decoration | null>(decorations[0] ?? null)
  const [decorationImage, setDecorationImage] = useState<HTMLImageElement | null>(null)
  const [editor, setEditor] = useState<EditorState>(initialEditor)
  const [history, setHistory] = useState<EditorState[]>([])
  const [future, setFuture] = useState<EditorState[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')
  const [favorites, setFavorites] = useState<string[]>(() => JSON.parse(localStorage.getItem('pulso-favorites') || '[]'))
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [notice, setNotice] = useState('')
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null)
  const [gifExporting, setGifExporting] = useState(false)

  const filtered = useMemo(() => decorations.filter(d =>
    (category === 'Todas' || d.category === category) &&
    (!onlyFavorites || favorites.includes(d.id)) &&
    `${d.name} ${d.category} ${d.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())
  ), [category, favorites, onlyFavorites, query])

  useEffect(() => { localStorage.setItem('pulso-favorites', JSON.stringify(favorites)) }, [favorites])
  useEffect(() => {
    if (!selected) return
    const img = new Image()
    img.src = selected.asset
    img.onload = () => setDecorationImage(img)
    img.onerror = () => setNotice('Não foi possível carregar esta decoração.')
  }, [selected])
  useEffect(() => { draw() }, [avatar, decorationImage, editor])
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 2800)
    return () => window.clearTimeout(timer)
  }, [notice])

  function updateEditor(patch: Partial<EditorState>, save = true) {
    if (save) { setHistory(h => [...h.slice(-29), editor]); setFuture([]) }
    setEditor(e => ({ ...e, ...patch }))
  }

  function handleFile(file?: File) {
    if (!file) return
    const isGif = file.type === 'image/gif'
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) return setNotice('Formato inválido. Use PNG, JPG, WebP ou GIF.')
    if (file.size > 8 * 1024 * 1024) return setNotice('A imagem deve ter no máximo 8 MB.')
    const url = URL.createObjectURL(file)
    if (isGif) {
      // For GIF: keep the animated URL for preview, draw first frame via Image
      setGifPreviewUrl(url)
      const img = new Image()
      img.onload = () => {
        if (img.width > 6000 || img.height > 6000) return setNotice('A imagem é grande demais. Limite: 6000×6000 px.')
        setAvatar(img); setAvatarUrl(url); setEditor(initialEditor); setHistory([]); setFuture([])
        setNotice('GIF carregado. Preview animado disponível abaixo do canvas.')
        setView('editor')
      }
      img.onerror = () => setNotice('Não foi possível abrir o GIF.')
      img.src = url
    } else {
      setGifPreviewUrl('')
      const img = new Image()
      img.onload = () => {
        if (img.width > 6000 || img.height > 6000) return setNotice('A imagem é grande demais. Limite: 6000×6000 px.')
        setAvatar(img); setAvatarUrl(url); setEditor(initialEditor); setHistory([]); setFuture([])
        setNotice('Avatar carregado com sucesso.')
        setView('editor')
      }
      img.onerror = () => setNotice('Não foi possível abrir a imagem.')
      img.src = url
    }
  }

  function draw() {
    const canvas = canvasRef.current
    if (!canvas) return
    const size = 720
    canvas.width = size; canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, size, size)
    if (!avatar) return
    const side = Math.min(avatar.width, avatar.height)
    const sx = (avatar.width - side) / 2; const sy = (avatar.height - side) / 2
    ctx.save(); ctx.beginPath(); ctx.arc(size / 2, size / 2, size * .38, 0, Math.PI * 2); ctx.clip()
    ctx.drawImage(avatar, sx, sy, side, side, size * .12, size * .12, size * .76, size * .76); ctx.restore()
    if (decorationImage) {
      const base = size * .88 * editor.scale
      ctx.save(); ctx.translate(size / 2 + editor.x, size / 2 + editor.y); ctx.rotate(editor.rotation * Math.PI / 180)
      ctx.drawImage(decorationImage, -base / 2, -base / 2, base, base); ctx.restore()
    }
  }

  function pointerPosition(e: PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: (e.clientX - r.left) * (720 / r.width) - 360, y: (e.clientY - r.top) * (720 / r.height) - 360 }
  }
  function onPointerDown(e: PointerEvent<HTMLCanvasElement>) { if (!avatar) return; e.currentTarget.setPointerCapture(e.pointerId); setDrag(pointerPosition(e)) }
  function onPointerMove(e: PointerEvent<HTMLCanvasElement>) { if (!drag) return; const p = pointerPosition(e); updateEditor({ x: editor.x + p.x - drag.x, y: editor.y + p.y - drag.y }, false); setDrag(p) }
  function onPointerUp() { if (drag) { setHistory(h => [...h.slice(-29), editor]); setFuture([]) }; setDrag(null) }
  function undo() { const previous = history.slice(-1)[0]; if (!previous) return; setFuture(f => [...f, editor]); setEditor(previous); setHistory(h => h.slice(0, -1)) }
  function redo() { const next = future.slice(-1)[0]; if (!next) return; setHistory(h => [...h, editor]); setEditor(next); setFuture(f => f.slice(0, -1)) }
  function reset() { updateEditor(initialEditor) }
  function toggleFavorite(id: string) { setFavorites(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]) }
  function chooseDecoration(d: Decoration) { setSelected(d); setNotice(`${d.name} aplicada ao editor.`); setView('editor') }

  function exportPng() {
    if (!avatar) return setNotice('Envie um avatar antes de exportar.')
    draw()
    const canvas = canvasRef.current; if (!canvas) return
    const link = document.createElement('a'); link.download = 'pulso-gifs-avatar.png'; link.href = canvas.toDataURL('image/png'); link.click()
    setNotice('PNG exportado com sucesso.')
  }

  function exportGif() {
    if (!avatar) return setNotice('Envie um avatar antes de exportar.')
    draw()
    const canvas = canvasRef.current; if (!canvas) return
    setGifExporting(true)
    const dataUrl = canvas.toDataURL('image/png')
    gifshot.createGIF(
      { images: [dataUrl], gifWidth: 512, gifHeight: 512, interval: 0.1, numFrames: 1 },
      (result) => {
        setGifExporting(false)
        if (result.error) return setNotice('Erro ao gerar GIF. Tente novamente.')
        const link = document.createElement('a'); link.download = 'pulso-gifs-avatar.gif'; link.href = result.image; link.click()
        setNotice('GIF exportado com sucesso. Nota: arquivo estático (1 frame).')
      }
    )
  }

  const thumbFallback = (e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.src = BROKEN_THUMB }

  // Deterrence handlers – applied only to protected catalog/preview surfaces
  const noContextMenu = PROTECTION_CONFIG.disableContextMenu
    ? (e: React.MouseEvent) => e.preventDefault()
    : undefined
  const noDrag = PROTECTION_CONFIG.preventImageDrag
    ? (e: React.DragEvent) => e.preventDefault()
    : undefined

  const decorationCard = (d: Decoration) => <article
    className={selected?.id === d.id ? 'decoration-card selected' : 'decoration-card'}
    key={d.id}
    onClick={() => chooseDecoration(d)}
    style={PROTECTION_CONFIG.noSelectOnCards ? { userSelect: 'none' } : undefined}
  >
    <div className="thumb" onContextMenu={noContextMenu}>
      <img
        src={d.thumbnail}
        alt={d.name}
        loading="lazy"
        onError={thumbFallback}
        onDragStart={noDrag}
        draggable={!PROTECTION_CONFIG.preventImageDrag}
      />
    </div>
    <div className="card-info"><strong>{d.name}</strong><span>{d.category}</span></div>
    <button className="favorite" onClick={e => { e.stopPropagation(); toggleFavorite(d.id) }} aria-label={`Favoritar ${d.name}`}><Heart size={16} fill={favorites.includes(d.id) ? 'currentColor' : 'none'} /></button>
  </article>

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><Sparkles size={17} /></span><span>PULSO <b>GIFS</b></span></div>
      <nav className="main-nav" aria-label="Navegação principal">
        <div className="nav-segment" role="tablist">
          <button role="tab" aria-selected={view === 'editor'} className={view === 'editor' ? 'nav-tab active' : 'nav-tab'} onClick={() => setView('editor')}>
            <Sparkles size={14} /> <span>Editor</span>
          </button>
          <button role="tab" aria-selected={view === 'library'} className={view === 'library' ? 'nav-tab active' : 'nav-tab'} onClick={() => setView('library')}>
            <Grid3X3 size={14} /> <span>Todas as decorações</span><span className="count-badge">{decorations.length}</span>
          </button>
        </div>
      </nav>
      <div className="top-actions">
        <a className="discord-link" href="https://discord.gg/52vcE7dpnQ" target="_blank" rel="noopener noreferrer"><LinkIcon size={15} /> Comunidade Discord</a>
        <button className="icon-btn mobile-menu" aria-label="Abrir menu"><Menu size={20} /></button>
      </div>
    </header>

    {view === 'library'
      ? <main className="workspace library-page">
          <section className="library-hero"><p className="eyebrow">BIBLIOTECA PULSO GIFS</p><h1>Todas as <span>decorações.</span></h1><p>Explore a coleção completa disponível no site. Clique em qualquer item para aplicar no editor.</p>
            {PROTECTION_CONFIG.showCopyrightNotice && <p className="copyright-notice"><ShieldCheck size={14} aria-hidden="true" /> {COPYRIGHT.noticeShort}</p>}
          </section>
          <section className="library-toolbar"><label className="search-box"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nome, categoria ou tag..." /><kbd>/</kbd></label><button className={onlyFavorites ? 'filter-btn active' : 'filter-btn'} onClick={() => setOnlyFavorites(!onlyFavorites)}><Heart size={16} fill={onlyFavorites ? 'currentColor' : 'none'} /> Favoritas</button></section>
          <div className="category-row library-categories">{categories.map(c => <button key={c} className={category === c ? 'category active' : 'category'} onClick={() => setCategory(c)}>{c}</button>)}</div>
          <div className="library-grid">{filtered.map(decorationCard)}{filtered.length === 0 && <div className="empty library-empty"><Sparkles size={25} /><p>Nenhuma decoração encontrada.</p><small>Tente outro termo ou categoria.</small></div>}</div>
          <div className="library-total">Exibindo <strong>{filtered.length}</strong> de <strong>{decorations.length}</strong> decorações disponíveis</div>
        </main>
      : <main className="workspace">
          <section className="intro"><div><p className="eyebrow">AVATAR DECORATION STUDIO</p><h1>Seu avatar.<br /><span>Sua identidade.</span></h1><p className="intro-copy">Crie composições únicas para usar onde quiser. Escolha uma decoração, ajuste cada detalhe e baixe sua arte.</p></div><div className="intro-badge"><Sparkles size={18} /><span>100% no navegador<br /><small>seus arquivos ficam com você</small></span></div></section>
          <div className="studio-grid">
            <aside className="catalog panel">
              <div className="panel-heading"><div><p className="eyebrow">EXPLORE</p><h2>Decorações</h2></div><button className={onlyFavorites ? 'filter-btn active' : 'filter-btn'} onClick={() => setOnlyFavorites(!onlyFavorites)} aria-label="Mostrar favoritos"><Heart size={17} fill={onlyFavorites ? 'currentColor' : 'none'} /></button></div>
              <label className="search-box"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar decoração..." /><kbd>/</kbd></label>
              <div className="category-row">{categories.map(c => <button key={c} className={category === c ? 'category active' : 'category'} onClick={() => setCategory(c)}>{c}</button>)}</div>
              <div className="decoration-list">{filtered.map(decorationCard)}{filtered.length === 0 && <div className="empty"><Sparkles size={25} /><p>Nenhuma decoração encontrada.</p><small>Tente outro termo ou categoria.</small></div>}</div>
              <button className="view-all-btn" onClick={() => setView('library')}>
                <span className="view-all-text">Ver todas as <strong>{decorations.length}</strong> decorações</span>
                <ArrowRight size={14} className="view-all-arrow" />
              </button>
            </aside>

            <section className="canvas-panel panel">
              <div className="canvas-header"><div><p className="eyebrow">PREVIEW</p><h2>Área de criação</h2></div><div className="history-actions"><button className="icon-btn" disabled={!history.length} onClick={undo} aria-label="Desfazer"><Undo2 size={17} /></button><button className="icon-btn" disabled={!future.length} onClick={redo} aria-label="Refazer"><Redo2 size={17} /></button></div></div>
              <div className="canvas-stage" onContextMenu={noContextMenu}>
                <div className="grid-lines" />
                <canvas ref={canvasRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} aria-label="Preview do avatar" style={{ transform: `scale(${editor.zoom})` }} />
                {!avatar && <div className="canvas-empty"><div className="upload-icon"><ImagePlus size={26} /></div><strong>Comece pelo seu avatar</strong><span>Envie uma imagem para visualizar a composição</span><button className="primary-btn" onClick={() => fileRef.current?.click()}>Enviar imagem</button></div>}
              </div>
              {gifPreviewUrl && <div className="gif-preview-row"><span className="eyebrow">PREVIEW ANIMADO</span><img src={gifPreviewUrl} alt="Preview do GIF animado" className="gif-preview-img" /></div>}
              <div className="canvas-footer"><span><span className="status-dot" /> {avatar ? (gifPreviewUrl ? 'GIF carregado — canvas mostra 1.º frame' : 'Pronto para editar') : 'Aguardando imagem'}</span><div className="zoom-controls"><button className="icon-btn" onClick={() => updateEditor({ zoom: Math.max(.7, editor.zoom - .1) }, false)} aria-label="Diminuir zoom"><ZoomOut size={16} /></button><span>{Math.round(editor.zoom * 100)}%</span><button className="icon-btn" onClick={() => updateEditor({ zoom: Math.min(1.5, editor.zoom + .1) }, false)} aria-label="Aumentar zoom"><ZoomIn size={16} /></button></div></div>
            </section>

            <aside className="properties panel">
              <div className="panel-heading"><div><p className="eyebrow">AJUSTES</p><h2>Propriedades</h2></div><button className="text-btn" onClick={reset}><RotateCcw size={14} /> Resetar</button></div>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={e => handleFile(e.target.files?.[0])} />
              <button className="upload-box" onClick={() => fileRef.current?.click()}><ImagePlus size={19} /><span><b>{avatarUrl ? 'Trocar avatar' : 'Enviar avatar'}</b><small>PNG, JPG, WebP ou GIF · até 8 MB</small></span></button>
              <div className="selected-decoration"><img src={selected?.thumbnail} alt="" onError={thumbFallback} /><div><span>Decoração ativa</span><strong>{selected?.name || 'Nenhuma'}</strong></div></div>
              <div className="control-group"><label>Escala <output>{Math.round(editor.scale * 100)}%</output></label><input type="range" min=".45" max="1.5" step=".01" value={editor.scale} onChange={e => updateEditor({ scale: Number(e.target.value) })} /></div>
              <div className="control-group"><label>Rotação <output>{editor.rotation}°</output></label><input type="range" min="-180" max="180" value={editor.rotation} onChange={e => updateEditor({ rotation: Number(e.target.value) })} /></div>
              <div className="two-controls"><div className="control-group"><label>Posição X</label><input type="number" value={Math.round(editor.x)} onChange={e => updateEditor({ x: Number(e.target.value) })} /></div><div className="control-group"><label>Posição Y</label><input type="number" value={Math.round(editor.y)} onChange={e => updateEditor({ y: Number(e.target.value) })} /></div></div>
              <p className="drag-hint">Dica: arraste a decoração diretamente no preview.</p>
              <div className="export-buttons">
                <button className="download-btn download-png" onClick={exportPng} disabled={!avatar} aria-label="Baixar imagem em PNG">
                  <Download size={16} /> <span>Baixar PNG</span>
                </button>
                <button className="download-btn download-gif" onClick={exportGif} disabled={!avatar || gifExporting} aria-label="Baixar imagem em GIF">
                  <Film size={16} /> <span>{gifExporting ? 'Gerando…' : 'Baixar GIF'}</span>
                </button>
              </div>
              <p className="gif-note">GIF exportado como frame estático. Envie um GIF animado para usar nos campos de foto de perfil que aceitam GIF.</p>
            </aside>
          </div>
          <section className="trust-row"><span><span className="mini-dot" /> Processamento local</span><span>PNG e GIF em alta resolução</span><span>Sem login ou dados do Discord</span></section>
        </main>
    }
    <footer><span>© {COPYRIGHT.year} {COPYRIGHT.owner}</span><span>Ferramenta independente de criação de imagens. Não afiliada oficialmente ao Discord.</span><a href="https://discord.gg/52vcE7dpnQ" target="_blank" rel="noopener noreferrer">Entre na comunidade →</a>{PROTECTION_CONFIG.showCopyrightNotice && <span className="footer-copyright">{COPYRIGHT.notice}</span>}</footer>
    {notice && <div className="toast"><Sparkles size={16} />{notice}<button onClick={() => setNotice('')} aria-label="Fechar"><X size={14} /></button></div>}
  </div>
}
