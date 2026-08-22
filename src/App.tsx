import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, Heart, ImagePlus, Link as LinkIcon, Menu, RotateCcw, Search, Sparkles, Undo2, Redo2, X, ZoomIn, ZoomOut } from 'lucide-react'
import decorationData from '../data/decorations.json'
import type { Decoration, EditorState } from './types'

const decorations = decorationData as Decoration[]
const categories = ['Todas', 'Populares', 'Novidades', 'Animais', 'Fantasia', 'Halloween', 'Natal', 'Amor', 'Fogo', 'Anjos', 'Demônios', 'Natureza', 'Outros']
const initialEditor: EditorState = { x: 0, y: 0, scale: 1, rotation: 0, zoom: 1 }

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatar, setAvatar] = useState<HTMLImageElement | null>(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [selected, setSelected] = useState<Decoration | null>(decorations[0])
  const [decorationImage, setDecorationImage] = useState<HTMLImageElement | null>(null)
  const [editor, setEditor] = useState<EditorState>(initialEditor)
  const [history, setHistory] = useState<EditorState[]>([])
  const [future, setFuture] = useState<EditorState[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')
  const [favorites, setFavorites] = useState<string[]>(() => JSON.parse(localStorage.getItem('pulso-favorites') || '[]'))
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [notice, setNotice] = useState('')
  const [drag, setDrag] = useState<{x:number;y:number}|null>(null)

  const filtered = useMemo(() => decorations.filter(d => (category === 'Todas' || d.category === category) && (!onlyFavorites || favorites.includes(d.id)) && `${d.name} ${d.category} ${d.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())), [category, favorites, onlyFavorites, query])

  useEffect(() => { localStorage.setItem('pulso-favorites', JSON.stringify(favorites)) }, [favorites])
  useEffect(() => { if (!selected) return; const img = new Image(); img.src = selected.asset; img.onload = () => setDecorationImage(img) }, [selected])
  useEffect(() => { draw() }, [avatar, decorationImage, editor])
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(''), 2800); return () => window.clearTimeout(timer) }, [notice])

  function updateEditor(patch: Partial<EditorState>, save = true) {
    if (save) { setHistory(h => [...h.slice(-29), editor]); setFuture([]) }
    setEditor(e => ({ ...e, ...patch }))
  }

  function handleFile(file?: File) {
    if (!file) return
    if (!['image/png','image/jpeg','image/webp'].includes(file.type)) return setNotice('Formato inválido. Use PNG, JPG ou WebP.')
    if (file.size > 8 * 1024 * 1024) return setNotice('A imagem deve ter no máximo 8 MB.')
    const url = URL.createObjectURL(file); const img = new Image(); img.onload = () => { if (img.width > 6000 || img.height > 6000) return setNotice('A imagem é grande demais. Limite: 6000×6000 px.'); setAvatar(img); setAvatarUrl(url); setEditor(initialEditor); setHistory([]); setFuture([]); setNotice('Avatar carregado com sucesso.') }; img.src = url
  }

  function draw() {
    const canvas = canvasRef.current; if (!canvas) return
    const size = 720; canvas.width = size; canvas.height = size; const ctx = canvas.getContext('2d'); if (!ctx) return
    ctx.clearRect(0,0,size,size)
    if (!avatar) return
    const side = Math.min(avatar.width, avatar.height); const sx = (avatar.width-side)/2; const sy = (avatar.height-side)/2
    ctx.save(); ctx.beginPath(); ctx.arc(size/2,size/2,size*.38,0,Math.PI*2); ctx.clip(); ctx.drawImage(avatar,sx,sy,side,side,size*.12,size*.12,size*.76,size*.76); ctx.restore()
    if (decorationImage) { const base = size*.88*editor.scale; ctx.save(); ctx.translate(size/2 + editor.x, size/2 + editor.y); ctx.rotate(editor.rotation*Math.PI/180); ctx.drawImage(decorationImage,-base/2,-base/2,base,base); ctx.restore() }
  }

  function pointerPosition(e: React.PointerEvent<HTMLCanvasElement>) { const r = e.currentTarget.getBoundingClientRect(); return { x: (e.clientX-r.left)*(720/r.width)-360, y: (e.clientY-r.top)*(720/r.height)-360 } }
  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) { if (!avatar) return; e.currentTarget.setPointerCapture(e.pointerId); setDrag(pointerPosition(e)) }
  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) { if (!drag) return; const p = pointerPosition(e); updateEditor({x: editor.x + p.x-drag.x, y: editor.y + p.y-drag.y}, false); setDrag(p) }
  function onPointerUp() { if (drag) { setHistory(h => [...h.slice(-29), editor]); setFuture([]) }; setDrag(null) }

  function undo() { const previous = history.at(-1); if (!previous) return; setFuture(f => [...f, editor]); setEditor(previous); setHistory(h => h.slice(0,-1)) }
  function redo() { const next = future.at(-1); if (!next) return; setHistory(h => [...h, editor]); setEditor(next); setFuture(f => f.slice(0,-1)) }
  function reset() { updateEditor(initialEditor) }
  function toggleFavorite(id: string) { setFavorites(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]) }
  function chooseDecoration(d: Decoration) { setSelected(d); setNotice(`${d.name} aplicada ao editor.`) }

  function exportPng() {
    if (!avatar) return setNotice('Envie um avatar antes de exportar.')
    draw(); const canvas = canvasRef.current; if (!canvas) return; const link = document.createElement('a'); link.download = 'pulso-gifs-avatar.png'; link.href = canvas.toDataURL('image/png'); link.click(); setNotice('PNG exportado com sucesso.')
  }

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark"><Sparkles size={17}/></span><span>PULSO <b>GIFS</b></span></div><div className="top-actions"><a className="discord-link" href="https://discord.gg/52vcE7dpnQ" target="_blank" rel="noopener noreferrer"><LinkIcon size={15}/> Comunidade Discord</a><button className="icon-btn mobile-menu" aria-label="Abrir menu"><Menu size={20}/></button></div></header>
    <main className="workspace">
      <section className="intro"><div><p className="eyebrow">AVATAR DECORATION STUDIO</p><h1>Seu avatar.<br/><span>Sua identidade.</span></h1><p className="intro-copy">Crie composições únicas para usar onde quiser. Escolha uma decoração, ajuste cada detalhe e baixe sua arte.</p></div><div className="intro-badge"><Sparkles size={18}/><span>100% no navegador<br/><small>seus arquivos ficam com você</small></span></div></section>
      <div className="studio-grid">
        <aside className="catalog panel"><div className="panel-heading"><div><p className="eyebrow">EXPLORE</p><h2>Decorações</h2></div><button className={onlyFavorites ? 'filter-btn active' : 'filter-btn'} onClick={() => setOnlyFavorites(!onlyFavorites)} aria-label="Mostrar favoritos"><Heart size={17} fill={onlyFavorites ? 'currentColor' : 'none'}/></button></div><label className="search-box"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar decoração..."/><kbd>/</kbd></label><div className="category-row">{categories.map(c => <button key={c} className={category===c?'category active':'category'} onClick={() => setCategory(c)}>{c}</button>)}</div><div className="decoration-list">{filtered.map(d => <article className={selected?.id===d.id?'decoration-card selected':'decoration-card'} key={d.id} onClick={() => chooseDecoration(d)}><div className="thumb"><img src={d.thumbnail} alt=""/></div><div className="card-info"><strong>{d.name}</strong><span>{d.category}</span></div><button className="favorite" onClick={e => {e.stopPropagation(); toggleFavorite(d.id)}} aria-label={`Favoritar ${d.name}`}><Heart size={16} fill={favorites.includes(d.id) ? 'currentColor' : 'none'}/></button></article>)}{filtered.length===0 && <div className="empty"><Sparkles size={25}/><p>Nenhuma decoração encontrada.</p><small>Tente outro termo ou categoria.</small></div>}</div></aside>
        <section className="canvas-panel panel"><div className="canvas-header"><div><p className="eyebrow">PREVIEW</p><h2>Área de criação</h2></div><div className="history-actions"><button className="icon-btn" disabled={!history.length} onClick={undo} aria-label="Desfazer"><Undo2 size={17}/></button><button className="icon-btn" disabled={!future.length} onClick={redo} aria-label="Refazer"><Redo2 size={17}/></button></div></div><div className="canvas-stage"><div className="grid-lines"/><canvas ref={canvasRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} aria-label="Preview do avatar"/>{!avatar && <div className="canvas-empty"><div className="upload-icon"><ImagePlus size={26}/></div><strong>Comece pelo seu avatar</strong><span>Envie uma imagem para visualizar a composição</span><button className="primary-btn" onClick={() => fileRef.current?.click()}>Enviar imagem</button></div>}</div><div className="canvas-footer"><span><span className="status-dot"/> {avatar ? 'Pronto para editar' : 'Aguardando imagem'}</span><div className="zoom-controls"><button className="icon-btn" onClick={() => updateEditor({zoom: Math.max(.7, editor.zoom-.1)}, false)} aria-label="Diminuir zoom"><ZoomOut size={16}/></button><span>{Math.round(editor.zoom*100)}%</span><button className="icon-btn" onClick={() => updateEditor({zoom: Math.min(1.5, editor.zoom+.1)}, false)} aria-label="Aumentar zoom"><ZoomIn size={16}/></button></div></div></section>
        <aside className="properties panel"><div className="panel-heading"><div><p className="eyebrow">AJUSTES</p><h2>Propriedades</h2></div><button className="text-btn" onClick={reset}><RotateCcw size={14}/> Resetar</button></div><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e => handleFile(e.target.files?.[0])}/><button className="upload-box" onClick={() => fileRef.current?.click()}><ImagePlus size={19}/><span><b>{avatarUrl ? 'Trocar avatar' : 'Enviar avatar'}</b><small>PNG, JPG ou WebP · até 8 MB</small></span></button><div className="selected-decoration"><img src={selected?.thumbnail} alt=""/><div><span>Decoração ativa</span><strong>{selected?.name || 'Nenhuma'}</strong></div></div><div className="control-group"><label>Escala <output>{Math.round(editor.scale*100)}%</output></label><input type="range" min=".45" max="1.5" step=".01" value={editor.scale} onChange={e => updateEditor({scale:Number(e.target.value)})}/></div><div className="control-group"><label>Rotação <output>{editor.rotation}°</output></label><input type="range" min="-180" max="180" value={editor.rotation} onChange={e => updateEditor({rotation:Number(e.target.value)})}/></div><div className="two-controls"><div className="control-group"><label>Posição X</label><input type="number" value={Math.round(editor.x)} onChange={e => updateEditor({x:Number(e.target.value)})}/></div><div className="control-group"><label>Posição Y</label><input type="number" value={Math.round(editor.y)} onChange={e => updateEditor({y:Number(e.target.value)})}/></div></div><p className="drag-hint">Dica: arraste a decoração diretamente no preview.</p><button className="download-btn" onClick={exportPng}><Download size={18}/> Baixar PNG <span>↗</span></button></aside>
      </div>
      <section className="trust-row"><span><span className="mini-dot"/> Processamento local</span><span>PNG transparente em alta resolução</span><span>Sem login ou dados do Discord</span></section>
    </main>
    <footer><span>© 2026 PULSO GIFS</span><span>Ferramenta independente de criação de imagens. Não afiliada oficialmente ao Discord.</span><a href="https://discord.gg/52vcE7dpnQ" target="_blank" rel="noopener noreferrer">Entre na comunidade →</a></footer>
    {notice && <div className="toast"><Sparkles size={16}/>{notice}<button onClick={() => setNotice('')} aria-label="Fechar"><X size={14}/></button></div>}
  </div>
}
