import { FolderOpen, ImagePlus, Redo2, RotateCcw, Save, Share2, Sparkles, Type, Undo2, UploadCloud } from 'lucide-react'
import type { EmojiLayerData, Layer, TextLayerData } from '../../types'

const EMOJIS = ['✨', '🔥', '💖', '🌙', '⭐', '🪽', '😈', '🐺', '🎃', '🎄', '🌸', '💀']

type LayerControlsProps = {
  selectedLayer: Layer | null
  readOnly: boolean
  canUndo: boolean
  canRedo: boolean
  gifExporting: boolean
  shareUrl: string
  hasAvatar: boolean
  onUndo: () => void
  onRedo: () => void
  onReset: () => void
  onUploadAvatar: () => void
  onUploadLayer: () => void
  onAddTextLayer: () => void
  onAddEmojiLayer: (emoji?: string) => void
  onUpdateLayer: (id: string, patch: Partial<Layer>, recordHistory?: boolean) => void
  onUpdateLayerData: (id: string, patch: Record<string, unknown>, recordHistory?: boolean) => void
  onDeleteLayer: (id: string) => void
  onExportPng: () => void
  onExportGif: () => void
  onSaveProject: () => void
  onOpenProjects: () => void
  onShareProject: () => void
}

export function LayerControls({
  selectedLayer,
  readOnly,
  canUndo,
  canRedo,
  gifExporting,
  shareUrl,
  hasAvatar,
  onUndo,
  onRedo,
  onReset,
  onUploadAvatar,
  onUploadLayer,
  onAddTextLayer,
  onAddEmojiLayer,
  onUpdateLayer,
  onUpdateLayerData,
  onDeleteLayer,
  onExportPng,
  onExportGif,
  onSaveProject,
  onOpenProjects,
  onShareProject,
}: LayerControlsProps) {
  const textData = selectedLayer?.type === 'text' ? selectedLayer.data as TextLayerData : null
  const emojiData = selectedLayer?.type === 'emoji' ? selectedLayer.data as EmojiLayerData : null

  return (
    <section className="properties panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">AJUSTES</p>
          <h2>Editor por camadas</h2>
        </div>
        <div className="history-actions wrap-actions">
          <button className="icon-btn" onClick={onUndo} disabled={!canUndo} aria-label="Desfazer"><Undo2 size={16} /></button>
          <button className="icon-btn" onClick={onRedo} disabled={!canRedo} aria-label="Refazer"><Redo2 size={16} /></button>
          <button className="icon-btn" onClick={onReset} aria-label="Resetar"><RotateCcw size={16} /></button>
        </div>
      </div>

      <div className="control-stack">
        <button className="upload-box" onClick={onUploadAvatar} disabled={readOnly}>
          <ImagePlus size={18} />
          <span><b>Enviar avatar base</b><small>PNG, JPG, WebP ou GIF · até 8 MB</small></span>
        </button>
        <button className="upload-box" onClick={onUploadLayer} disabled={readOnly}>
          <UploadCloud size={18} />
          <span><b>Adicionar camada de upload</b><small>Elementos extras sobre a arte final</small></span>
        </button>
      </div>

      <div className="quick-add-grid">
        <button className="secondary-btn" onClick={onAddTextLayer} disabled={readOnly}><Type size={16} /> Texto</button>
        <button className="secondary-btn" onClick={() => onAddEmojiLayer()} disabled={readOnly}><Sparkles size={16} /> Emoji</button>
        <button className="secondary-btn" onClick={onSaveProject} disabled={readOnly}><Save size={16} /> Salvar projeto</button>
        <button className="secondary-btn" onClick={onOpenProjects}><FolderOpen size={16} /> Meus projetos</button>
      </div>

      <div className="quick-add-grid share-grid">
        <button className="secondary-btn" onClick={onShareProject}><Share2 size={16} /> Compartilhar</button>
        <button className="secondary-btn" onClick={onExportPng} disabled={!hasAvatar}><ImagePlus size={16} /> Exportar PNG</button>
        <button className="secondary-btn" onClick={onExportGif} disabled={!hasAvatar || gifExporting}><Sparkles size={16} /> {gifExporting ? 'Gerando GIF…' : 'Exportar GIF'}</button>
      </div>

      <p className="gif-note">GIF exportado com 1 frame estático. Para avatares animados, envie um GIF como base e o resultado mantém a animação original.</p>
      {shareUrl && <p className="share-url">Link pronto: <a href={shareUrl}>{shareUrl}</a></p>}

      {selectedLayer ? (
        <div className="selected-layer-box">
          <div className="panel-heading compact-heading">
            <div>
              <p className="eyebrow">CAMADA ATIVA</p>
              <h3>{selectedLayer.type}</h3>
            </div>
            {selectedLayer.type !== 'avatar' && !readOnly && (
              <button className="text-btn danger" onClick={() => onDeleteLayer(selectedLayer.id)}>Remover camada</button>
            )}
          </div>

          <div className="two-controls">
            <div className="control-group">
              <label>Posição X</label>
              <input type="number" value={Math.round(selectedLayer.x)} onChange={(event) => onUpdateLayer(selectedLayer.id, { x: Number(event.target.value) })} disabled={readOnly} />
            </div>
            <div className="control-group">
              <label>Posição Y</label>
              <input type="number" value={Math.round(selectedLayer.y)} onChange={(event) => onUpdateLayer(selectedLayer.id, { y: Number(event.target.value) })} disabled={readOnly} />
            </div>
          </div>

          <div className="control-group">
            <label>Escala <output>{Math.round(selectedLayer.scale * 100)}%</output></label>
            <input type="range" min="0.2" max="2.5" step="0.01" value={selectedLayer.scale} onChange={(event) => onUpdateLayer(selectedLayer.id, { scale: Number(event.target.value) })} disabled={readOnly} />
          </div>
          <div className="control-group">
            <label>Rotação <output>{Math.round(selectedLayer.rotation)}°</output></label>
            <input type="range" min="-180" max="180" step="1" value={selectedLayer.rotation} onChange={(event) => onUpdateLayer(selectedLayer.id, { rotation: Number(event.target.value) })} disabled={readOnly} />
          </div>
          <div className="control-group">
            <label>Opacidade <output>{Math.round(selectedLayer.opacity)}%</output></label>
            <input type="range" min="0" max="100" step="1" value={selectedLayer.opacity} onChange={(event) => onUpdateLayer(selectedLayer.id, { opacity: Number(event.target.value) })} disabled={readOnly} />
          </div>
          <div className="control-group">
            <label>Brilho <output>{Math.round(selectedLayer.brightness)}%</output></label>
            <input type="range" min="0" max="200" step="1" value={selectedLayer.brightness} onChange={(event) => onUpdateLayer(selectedLayer.id, { brightness: Number(event.target.value) })} disabled={readOnly} />
          </div>
          <div className="control-group">
            <label>Contraste <output>{Math.round(selectedLayer.contrast)}%</output></label>
            <input type="range" min="0" max="200" step="1" value={selectedLayer.contrast} onChange={(event) => onUpdateLayer(selectedLayer.id, { contrast: Number(event.target.value) })} disabled={readOnly} />
          </div>
          <div className="control-group">
            <label>Saturação <output>{Math.round(selectedLayer.saturation)}%</output></label>
            <input type="range" min="0" max="200" step="1" value={selectedLayer.saturation} onChange={(event) => onUpdateLayer(selectedLayer.id, { saturation: Number(event.target.value) })} disabled={readOnly} />
          </div>

          {textData && (
            <>
              <div className="control-group">
                <label>Texto</label>
                <input type="text" value={textData.text} onChange={(event) => onUpdateLayerData(selectedLayer.id, { text: event.target.value })} disabled={readOnly} />
              </div>
              <div className="two-controls">
                <div className="control-group">
                  <label>Tamanho</label>
                  <input type="number" value={textData.fontSize} onChange={(event) => onUpdateLayerData(selectedLayer.id, { fontSize: Number(event.target.value) })} disabled={readOnly} />
                </div>
                <div className="control-group">
                  <label>Cor</label>
                  <input type="color" value={textData.color} onChange={(event) => onUpdateLayerData(selectedLayer.id, { color: event.target.value })} disabled={readOnly} />
                </div>
              </div>
              <label className="checkbox-row">
                <input type="checkbox" checked={textData.shadow} onChange={(event) => onUpdateLayerData(selectedLayer.id, { shadow: event.target.checked })} disabled={readOnly} />
                Aplicar sombra
              </label>
            </>
          )}

          {emojiData && (
            <>
              <div className="control-group">
                <label>Tamanho do emoji</label>
                <input type="number" value={emojiData.fontSize} onChange={(event) => onUpdateLayerData(selectedLayer.id, { fontSize: Number(event.target.value) })} disabled={readOnly} />
              </div>
              <div className="emoji-grid">
                {EMOJIS.map((emoji) => (
                  <button key={emoji} className={emojiData.emoji === emoji ? 'emoji-btn active' : 'emoji-btn'} onClick={() => onUpdateLayerData(selectedLayer.id, { emoji })} disabled={readOnly}>{emoji}</button>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="empty state-box"><Sparkles size={26} /><p>Selecione uma camada para editar.</p></div>
      )}
    </section>
  )
}
