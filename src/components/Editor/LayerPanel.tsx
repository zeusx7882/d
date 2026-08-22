import { Eye, EyeOff, GripVertical, Trash2 } from 'lucide-react'
import type { Layer } from '../../types'

type LayerPanelProps = {
  layers: Layer[]
  selectedLayerId: string | null
  onSelect: (id: string) => void
  onReorder: (sourceId: string, targetId: string) => void
  onToggleVisibility: (id: string) => void
  onDelete: (id: string) => void
  readOnly?: boolean
}

function layerLabel(layer: Layer) {
  switch (layer.type) {
    case 'avatar':
      return 'Avatar base'
    case 'decoration':
      return 'Decoração'
    case 'text':
      return 'Texto'
    case 'emoji':
      return 'Emoji'
    case 'upload':
      return 'Upload'
    default:
      return 'Camada'
  }
}

export function LayerPanel({ layers, selectedLayerId, onSelect, onReorder, onToggleVisibility, onDelete, readOnly = false }: LayerPanelProps) {
  const orderedLayers = [...layers].sort((left, right) => right.zIndex - left.zIndex)

  return (
    <section className="layer-panel">
      <div className="panel-heading compact-heading">
        <div>
          <p className="eyebrow">CAMADAS</p>
          <h3>Ordem visual</h3>
        </div>
        <span className="count-badge">{layers.length}</span>
      </div>
      <div className="layer-list">
        {orderedLayers.map((layer) => (
          <button
            key={layer.id}
            className={selectedLayerId === layer.id ? 'layer-row active' : 'layer-row'}
            onClick={() => onSelect(layer.id)}
            draggable={!readOnly}
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', layer.id)
            }}
            onDragOver={(event) => {
              event.preventDefault()
            }}
            onDrop={(event) => {
              event.preventDefault()
              const sourceId = event.dataTransfer.getData('text/plain')
              if (sourceId && sourceId !== layer.id) {
                onReorder(sourceId, layer.id)
              }
            }}
          >
            <span className="layer-grip"><GripVertical size={14} /></span>
            <span className="layer-copy">
              <strong>{layerLabel(layer)}</strong>
              <small>{layer.type} · opacidade {layer.opacity}%</small>
            </span>
            <span className="layer-actions">
              <span
                className="layer-icon-btn"
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation()
                  onToggleVisibility(layer.id)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onToggleVisibility(layer.id)
                  }
                }}
              >
                {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </span>
              {layer.type !== 'avatar' && !readOnly && (
                <span
                  className="layer-icon-btn danger"
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation()
                    onDelete(layer.id)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onDelete(layer.id)
                    }
                  }}
                >
                  <Trash2 size={14} />
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
