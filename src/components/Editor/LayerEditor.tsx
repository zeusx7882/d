import gifshot from 'gifshot'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type PointerEvent } from 'react'
import { ArrowRight, ImagePlus, Layers3, Lock, Sparkles, X, ZoomIn, ZoomOut } from 'lucide-react'
import { CatalogView } from '../Catalog/CatalogView'
import { LayerControls } from './LayerControls'
import { LayerPanel } from './LayerPanel'
import { getAssetUrl } from '../../lib/storage'
import { buildProject, createAvatarLayer, createDecorationLayer, createEmojiLayer, createTextLayer, createUploadLayer, useLayers } from '../../hooks/useLayers'
import type { Decoration, Layer, Project, TextLayerData, EmojiLayerData } from '../../types'

const CANVAS_SIZE = 720
const MAX_FILE_SIZE = 8 * 1024 * 1024
const MAX_DIMENSION = 6000
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

type LayerEditorProps = {
  decorations: Decoration[]
  favorites: string[]
  onToggleFavorite: (id: string) => void
  onOpenLibrary: () => void
  onNotice: (message: string) => void
  userId?: string | null
  sharedProject?: Project | null
  pendingDecoration?: Decoration | null
  onClearPendingDecoration?: () => void
}

export type LayerEditorHandle = {
  addDecorationLayer: (decoration: Decoration) => Promise<void>
}

type DragState = {
  pointerId: number
  startPointer: { x: number; y: number }
  startLayers: Layer[]
  selectedLayerId: string
}

function encodeProject(project: Project) {
  const json = JSON.stringify(project)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function drawTextLayer(ctx: CanvasRenderingContext2D, layer: Layer) {
  const data = layer.data as TextLayerData
  ctx.save()
  ctx.globalAlpha = layer.opacity / 100
  ctx.filter = `brightness(${layer.brightness}%) contrast(${layer.contrast}%) saturate(${layer.saturation}%)`
  ctx.translate(CANVAS_SIZE / 2 + layer.x, CANVAS_SIZE / 2 + layer.y)
  ctx.rotate((layer.rotation * Math.PI) / 180)
  ctx.scale(layer.scale, layer.scale)
  ctx.font = `${data.fontSize}px Manrope, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (data.shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
    ctx.shadowBlur = 14
    ctx.shadowOffsetY = 4
  }
  ctx.fillStyle = data.color
  const lines = data.text.split('\n')
  lines.forEach((line, index) => {
    ctx.fillText(line, 0, index * (data.fontSize + 8) - ((lines.length - 1) * (data.fontSize + 8)) / 2)
  })
  ctx.restore()
}

function drawEmojiLayer(ctx: CanvasRenderingContext2D, layer: Layer) {
  const data = layer.data as EmojiLayerData
  ctx.save()
  ctx.globalAlpha = layer.opacity / 100
  ctx.filter = `brightness(${layer.brightness}%) contrast(${layer.contrast}%) saturate(${layer.saturation}%)`
  ctx.translate(CANVAS_SIZE / 2 + layer.x, CANVAS_SIZE / 2 + layer.y)
  ctx.rotate((layer.rotation * Math.PI) / 180)
  ctx.scale(layer.scale, layer.scale)
  ctx.font = `${data.fontSize}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(data.emoji, 0, 0)
  ctx.restore()
}

export const LayerEditor = forwardRef<LayerEditorHandle, LayerEditorProps>(function LayerEditor({
  decorations,
  favorites,
  onToggleFavorite,
  onOpenLibrary,
  onNotice,
  userId,
  sharedProject,
  pendingDecoration,
  onClearPendingDecoration,
}, ref) {
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({})
  const [gifExporting, setGifExporting] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [readOnlyMode, setReadOnlyMode] = useState(Boolean(sharedProject?.readOnly))
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [shareUrl, setShareUrl] = useState('')
  const [projectsOpen, setProjectsOpen] = useState(false)
  const [savedProjects, setSavedProjects] = useState<Project[]>([])

  const projectStorageKey = userId ? `pulso-projects:${userId}` : 'pulso-projects'
  const isReadOnly = readOnlyMode

  const {
    layers,
    selectedLayer,
    selectedLayerId,
    setSelectedLayerId,
    addLayer,
    updateLayer,
    updateLayerData,
    removeLayer,
    toggleVisibility,
    reorderLayers,
    commitLayers,
    commitSnapshot,
    replaceLayers,
    loadLayers,
    resetLayers,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useLayers(sharedProject?.layers ?? [])

  const avatarLayer = useMemo(() => layers.find((layer) => layer.type === 'avatar') ?? null, [layers])
  const selectedDecorationId = useMemo(() => {
    if (selectedLayer?.type !== 'decoration') return null
    return 'decorationId' in selectedLayer.data ? selectedLayer.data.decorationId : null
  }, [selectedLayer])

  useEffect(() => {
    const raw = localStorage.getItem(projectStorageKey)
    if (raw) {
      try {
        setSavedProjects(JSON.parse(raw) as Project[])
      } catch {
        setSavedProjects([])
      }
    } else {
      setSavedProjects([])
    }
  }, [projectStorageKey])

  useEffect(() => {
    if (sharedProject?.layers?.length) {
      loadLayers(sharedProject.layers)
      setReadOnlyMode(true)
      setShareUrl(window.location.href)
    }
  }, [loadLayers, sharedProject])

  const persistProjects = useCallback((nextProjects: Project[]) => {
    setSavedProjects(nextProjects)
    localStorage.setItem(projectStorageKey, JSON.stringify(nextProjects))
  }, [projectStorageKey])

  const ensureImage = useCallback((src: string) => {
    const cached = imageCacheRef.current[src]
    if (cached && cached.complete) {
      return cached
    }
    if (cached) {
      return null
    }

    const image = new Image()
    image.onload = () => {
      drawCanvas()
    }
    image.onerror = () => {
      onNotice('Uma camada de imagem não pôde ser carregada.')
    }
    image.src = src
    imageCacheRef.current[src] = image
    return null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onNotice])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    canvas.width = CANVAS_SIZE
    canvas.height = CANVAS_SIZE
    context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    const orderedLayers = [...layers].filter((layer) => layer.visible).sort((left, right) => left.zIndex - right.zIndex)

    orderedLayers.forEach((layer) => {
      if (layer.type === 'text') {
        drawTextLayer(context, layer)
        return
      }
      if (layer.type === 'emoji') {
        drawEmojiLayer(context, layer)
        return
      }

      const source = 'src' in layer.data ? layer.data.src : null
      if (!source) return
      const image = ensureImage(source)
      if (!image) return

      context.save()
      context.globalAlpha = layer.opacity / 100
      context.filter = `brightness(${layer.brightness}%) contrast(${layer.contrast}%) saturate(${layer.saturation}%)`

      if (layer.type === 'avatar') {
        const side = Math.min(image.width, image.height)
        const sx = (image.width - side) / 2
        const sy = (image.height - side) / 2
        const diameter = CANVAS_SIZE * 0.76 * layer.scale
        context.beginPath()
        context.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE * 0.38, 0, Math.PI * 2)
        context.clip()
        context.translate(CANVAS_SIZE / 2 + layer.x, CANVAS_SIZE / 2 + layer.y)
        context.rotate((layer.rotation * Math.PI) / 180)
        context.drawImage(image, sx, sy, side, side, -diameter / 2, -diameter / 2, diameter, diameter)
        context.restore()
        return
      }

      const size = CANVAS_SIZE * 0.88 * layer.scale
      context.translate(CANVAS_SIZE / 2 + layer.x, CANVAS_SIZE / 2 + layer.y)
      context.rotate((layer.rotation * Math.PI) / 180)
      context.drawImage(image, -size / 2, -size / 2, size, size)
      context.restore()
    })

    if (selectedLayer && !isReadOnly) {
      context.save()
      context.setLineDash([10, 8])
      context.strokeStyle = '#cbd0ff'
      context.lineWidth = 2
      const highlight = CANVAS_SIZE * 0.44 * selectedLayer.scale
      context.translate(CANVAS_SIZE / 2 + selectedLayer.x, CANVAS_SIZE / 2 + selectedLayer.y)
      context.rotate((selectedLayer.rotation * Math.PI) / 180)
      context.strokeRect(-highlight, -highlight, highlight * 2, highlight * 2)
      context.restore()
    }
  }, [ensureImage, isReadOnly, layers, selectedLayer])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const loadFile = useCallback(async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Formato inválido. Use PNG, JPG, WebP ou GIF.')
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('A imagem deve ter no máximo 8 MB.')
    }

    const src = URL.createObjectURL(file)
    const image = new Image()
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      image.onload = () => resolve({ width: image.width, height: image.height })
      image.onerror = () => reject(new Error('Não foi possível abrir o arquivo selecionado.'))
      image.src = src
    })

    if (dimensions.width > MAX_DIMENSION || dimensions.height > MAX_DIMENSION) {
      throw new Error('A imagem é grande demais. Limite: 6000×6000 px.')
    }

    return { src, mimeType: file.type, name: file.name }
  }, [])

  const handleAvatarFile = useCallback(async (file?: File) => {
    if (!file) return
    try {
      const payload = await loadFile(file)
      const avatar = createAvatarLayer(payload.src, payload.name, payload.mimeType, payload.mimeType === 'image/gif')
      loadLayers([avatar])
      setReadOnlyMode(false)
      setZoom(1)
      setShareUrl('')
      onNotice(payload.mimeType === 'image/gif' ? 'GIF carregado com preview animado.' : 'Avatar carregado com sucesso.')
    } catch (error) {
      onNotice(error instanceof Error ? error.message : 'Falha ao enviar avatar.')
    } finally {
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }, [loadFile, loadLayers, onNotice])

  const handleUploadLayer = useCallback(async (file?: File) => {
    if (!file) return
    try {
      const payload = await loadFile(file)
      setReadOnlyMode(false)
      addLayer(createUploadLayer(payload.src, payload.name, payload.mimeType))
      onNotice('Camada de upload adicionada ao projeto.')
    } catch (error) {
      onNotice(error instanceof Error ? error.message : 'Falha ao adicionar camada.')
    } finally {
      if (uploadInputRef.current) uploadInputRef.current.value = ''
    }
  }, [addLayer, loadFile, onNotice])

  const addDecorationLayer = useCallback(async (decoration: Decoration) => {
    if (isReadOnly) {
      onNotice('Projeto compartilhado está em modo somente leitura.')
      return
    }
    try {
      const assetUrl = await getAssetUrl(decoration.asset)
      setReadOnlyMode(false)
      addLayer(createDecorationLayer(decoration, assetUrl))
      onNotice(`${decoration.name} adicionada como nova camada.`)
    } catch {
      onNotice('Não foi possível carregar a decoração selecionada.')
    }
  }, [addLayer, isReadOnly, onNotice])

  useImperativeHandle(ref, () => ({ addDecorationLayer }), [addDecorationLayer])

  useEffect(() => {
    if (!pendingDecoration) return
    void addDecorationLayer(pendingDecoration).finally(() => {
      onClearPendingDecoration?.()
    })
  }, [pendingDecoration]) // eslint-disable-line react-hooks/exhaustive-deps

  const exportPng = useCallback(() => {
    if (!avatarLayer) {
      onNotice('Envie um avatar antes de exportar.')
      return
    }
    drawCanvas()
    canvasRef.current?.toBlob((blob) => {
      if (!blob) {
        onNotice('Não foi possível exportar o PNG.')
        return
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = 'pulso-gifs-avatar.png'
      link.href = url
      link.click()
      onNotice('PNG exportado com todas as camadas.')
    }, 'image/png')
  }, [avatarLayer, drawCanvas, onNotice])

  const exportGif = useCallback(() => {
    if (!avatarLayer) {
      onNotice('Envie um avatar antes de exportar.')
      return
    }
    drawCanvas()
    const canvas = canvasRef.current
    if (!canvas) return
    setGifExporting(true)
    gifshot.createGIF({ images: [canvas.toDataURL('image/png')], gifWidth: 512, gifHeight: 512, interval: 0.1, numFrames: 1 }, (result) => {
      setGifExporting(false)
      if (result.error) {
        onNotice('Erro ao gerar GIF. Tente novamente.')
        return
      }
      const link = document.createElement('a')
      link.download = 'pulso-gifs-avatar-estatico.gif'
      link.href = result.image
      link.click()
      onNotice('GIF exportado com 1 frame estático. Para avatares animados, envie um GIF como base e o resultado mantém a animação original.')
    })
  }, [avatarLayer, drawCanvas, onNotice])

  const saveProject = useCallback(() => {
    if (isReadOnly) {
      onNotice('Projeto compartilhado não pode ser salvo por cima. Duplique-o primeiro.')
      return
    }
    const suggested = `Projeto ${savedProjects.length + 1}`
    const name = window.prompt('Nome do projeto', suggested)
    if (!name) return
    const now = new Date().toISOString()
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      createdAt: now,
      updatedAt: now,
      layers,
    }
    const nextProjects = [project, ...savedProjects].slice(0, 20)
    persistProjects(nextProjects)
    onNotice('Projeto salvo localmente.')
  }, [isReadOnly, layers, onNotice, persistProjects, savedProjects])

  const shareProject = useCallback(() => {
    if (!layers.length) {
      onNotice('Crie algo antes de compartilhar.')
      return
    }
    const project = buildProject('Projeto compartilhado', layers, true)
    const encoded = encodeProject(project)
    const url = `${window.location.origin}${window.location.pathname}#share=${encoded}`
    setShareUrl(url)
    void navigator.clipboard?.writeText(url).catch(() => undefined)
    onNotice('Link compartilhável gerado em modo somente leitura.')
  }, [layers, onNotice])

  const loadProjectFromList = useCallback((project: Project) => {
    loadLayers(project.layers)
    setReadOnlyMode(false)
    setProjectsOpen(false)
    setShareUrl('')
    onNotice(`Projeto "${project.name}" carregado.`)
  }, [loadLayers, onNotice])

  const deleteProject = useCallback((projectId: string) => {
    const nextProjects = savedProjects.filter((project) => project.id !== projectId)
    persistProjects(nextProjects)
  }, [persistProjects, savedProjects])

  const pointerPosition = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    return {
      x: ((event.clientX - bounds.left) * CANVAS_SIZE) / bounds.width - CANVAS_SIZE / 2,
      y: ((event.clientY - bounds.top) * CANVAS_SIZE) / bounds.height - CANVAS_SIZE / 2,
    }
  }, [])

  const handlePointerDown = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    if (!selectedLayer || isReadOnly) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragState({
      pointerId: event.pointerId,
      startPointer: pointerPosition(event),
      startLayers: layers,
      selectedLayerId: selectedLayer.id,
    })
  }, [isReadOnly, layers, pointerPosition, selectedLayer])

  const handlePointerMove = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    if (!dragState) return
    const point = pointerPosition(event)
    const dx = point.x - dragState.startPointer.x
    const dy = point.y - dragState.startPointer.y
    replaceLayers(dragState.startLayers.map((layer) => layer.id === dragState.selectedLayerId ? {
      ...layer,
      x: layer.x + dx,
      y: layer.y + dy,
    } : layer))
  }, [dragState, pointerPosition, replaceLayers])

  const handlePointerUp = useCallback((event?: PointerEvent<HTMLCanvasElement>) => {
    if (event && dragState) {
      try {
        event.currentTarget.releasePointerCapture(dragState.pointerId)
      } catch {
        // ignore release errors
      }
    }
    if (!dragState) return
    const finalLayers = layers
    commitSnapshot(dragState.startLayers, finalLayers)
    setDragState(null)
  }, [commitSnapshot, dragState, layers])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isUndo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey
      const isRedo = (event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'y' || ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'z'))
      if (isUndo) {
        event.preventDefault()
        undo()
      }
      if (isRedo) {
        event.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [redo, undo])

  return (
    <>
      <input ref={avatarInputRef} type="file" accept={ALLOWED_TYPES.join(',')} hidden onChange={(event) => void handleAvatarFile(event.target.files?.[0])} />
      <input ref={uploadInputRef} type="file" accept={ALLOWED_TYPES.join(',')} hidden onChange={(event) => void handleUploadLayer(event.target.files?.[0])} />

      {isReadOnly && (
        <div className="readonly-banner"><Lock size={16} /> Projeto compartilhado em modo somente leitura.</div>
      )}

      <div className="studio-grid">
        <aside className="catalog panel mobile-section mobile-catalog">
          <CatalogView
            decorations={decorations}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            onSelectDecoration={(decoration) => void addDecorationLayer(decoration)}
            selectedDecorationId={selectedDecorationId}
            mode="compact"
            showHeader={false}
            title="Catálogo"
          />
          <button className="view-all-btn" onClick={onOpenLibrary}>
            <span className="view-all-text">Abrir catálogo completo</span>
            <ArrowRight size={14} className="view-all-arrow" />
          </button>
        </aside>

        <section className="canvas-panel panel mobile-section mobile-editor">
          <div className="canvas-header">
            <div>
              <p className="eyebrow">PREVIEW</p>
              <h2>Área de criação</h2>
            </div>
            <div className="zoom-controls big-controls">
              <button className="icon-btn" onClick={() => setZoom((value) => Math.max(0.7, value - 0.1))}><ZoomOut size={16} /></button>
              <span>{Math.round(zoom * 100)}%</span>
              <button className="icon-btn" onClick={() => setZoom((value) => Math.min(1.6, value + 0.1))}><ZoomIn size={16} /></button>
            </div>
          </div>
          <div className="canvas-stage">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              aria-label="Preview do avatar"
              style={{ transform: `scale(${zoom})` }}
            />
            {!avatarLayer && (
              <div className="canvas-empty">
                <div className="upload-icon"><ImagePlus size={26} /></div>
                <strong>Comece pelo seu avatar</strong>
                <span>Depois adicione quantas decorações, textos, emojis e uploads quiser.</span>
                <button className="primary-btn" onClick={() => avatarInputRef.current?.click()}>Enviar imagem</button>
              </div>
            )}
          </div>
          {avatarLayer?.type === 'avatar' && (avatarLayer.data as import('../../types').AvatarLayerData).animated && (
            <div className="gif-preview-row">
              <span className="eyebrow">PREVIEW ANIMADO</span>
              <img src={(avatarLayer.data as import('../../types').AvatarLayerData).src} alt="Preview do GIF animado" className="gif-preview-img" />
            </div>
          )}
          <div className="canvas-footer">
            <span><span className="status-dot" /> {avatarLayer ? 'Arraste a camada ativa no canvas para reposicionar.' : 'Aguardando avatar base'}</span>
            <span className="hint-inline"><Layers3 size={14} /> {layers.length} camadas</span>
          </div>
        </section>

        <aside className="side-stack mobile-section mobile-create">
          <LayerPanel
            layers={layers}
            selectedLayerId={selectedLayerId}
            onSelect={setSelectedLayerId}
            onReorder={reorderLayers}
            onToggleVisibility={toggleVisibility}
            onDelete={removeLayer}
            readOnly={isReadOnly}
          />
          <LayerControls
            selectedLayer={selectedLayer}
            readOnly={isReadOnly}
            canUndo={canUndo}
            canRedo={canRedo}
            gifExporting={gifExporting}
            shareUrl={shareUrl}
            hasAvatar={Boolean(avatarLayer)}
            onUndo={undo}
            onRedo={redo}
            onReset={resetLayers}
            onUploadAvatar={() => avatarInputRef.current?.click()}
            onUploadLayer={() => uploadInputRef.current?.click()}
            onAddTextLayer={() => { setReadOnlyMode(false); addLayer(createTextLayer()) }}
            onAddEmojiLayer={(emoji) => { setReadOnlyMode(false); addLayer(createEmojiLayer(emoji)) }}
            onUpdateLayer={updateLayer}
            onUpdateLayerData={updateLayerData}
            onDeleteLayer={removeLayer}
            onExportPng={exportPng}
            onExportGif={exportGif}
            onSaveProject={saveProject}
            onOpenProjects={() => setProjectsOpen(true)}
            onShareProject={shareProject}
          />
        </aside>
      </div>

      {projectsOpen && (
        <div className="modal-backdrop" onClick={() => setProjectsOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">LOCALSTORAGE</p>
                <h2>Meus projetos</h2>
              </div>
              <button className="icon-btn" onClick={() => setProjectsOpen(false)} aria-label="Fechar modal"><X size={16} /></button>
            </div>
            <div className="project-list">
              {savedProjects.length === 0 && <div className="empty state-box"><Sparkles size={26} /><p>Nenhum projeto salvo ainda.</p></div>}
              {savedProjects.map((project) => (
                <article key={project.id} className="project-card">
                  <div>
                    <strong>{project.name}</strong>
                    <small>{new Date(project.updatedAt).toLocaleString('pt-BR')}</small>
                  </div>
                  <div className="project-actions">
                    <button className="secondary-btn" onClick={() => loadProjectFromList(project)}>Carregar</button>
                    <button className="secondary-btn danger" onClick={() => deleteProject(project.id)}>Excluir</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
})
