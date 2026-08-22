import { useEffect, useMemo, useState } from 'react'
import { Heart, Search, ShieldCheck, Sparkles, Star } from 'lucide-react'
import { PROTECTION_CONFIG, COPYRIGHT } from '../../security-config'
import { resolvePublicPath } from '../../lib/storage'
import type { Decoration } from '../../types'

const BROKEN_THUMB = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="12" fill="#111318"/><text x="32" y="38" text-anchor="middle" fill="#505360" font-size="24">✦</text></svg>')}`
const PAGE_SIZE = 48

type CatalogViewProps = {
  decorations: Decoration[]
  favorites: string[]
  onToggleFavorite: (id: string) => void
  onSelectDecoration: (decoration: Decoration) => void
  title?: string
  description?: string
  selectedDecorationId?: string | null
  mode?: 'compact' | 'full'
  showHeader?: boolean
}

export function CatalogView({
  decorations,
  favorites,
  onToggleFavorite,
  onSelectDecoration,
  title = 'Catálogo',
  description = 'Escolha uma decoração para adicionar como nova camada.',
  selectedDecorationId,
  mode = 'compact',
  showHeader = true,
}: CatalogViewProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const categories = useMemo(() => ['Todas', ...Array.from(new Set(decorations.map((item) => item.category)))], [decorations])

  const filtered = useMemo(() => decorations.filter((item) => {
    if (item.visible === false) return false
    if (category !== 'Todas' && item.category !== category) return false
    if (onlyFavorites && !favorites.includes(item.id)) return false
    const haystack = `${item.name} ${item.category} ${item.tags.join(' ')}`.toLowerCase()
    return haystack.includes(query.toLowerCase())
  }), [category, decorations, favorites, onlyFavorites, query])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [category, onlyFavorites, query])

  const visibleItems = filtered.slice(0, visibleCount)

  return (
    <section className={mode === 'full' ? 'catalog-surface catalog-full' : 'catalog-surface'}>
      {showHeader && (
        <div className="catalog-header-block">
          <div>
            <p className="eyebrow">BIBLIOTECA PULSO GIFS</p>
            <h2>{title}</h2>
            <p className="section-copy">{description}</p>
          </div>
          {PROTECTION_CONFIG.showCopyrightNotice && (
            <p className="copyright-notice"><ShieldCheck size={14} /> {COPYRIGHT.noticeShort}</p>
          )}
        </div>
      )}

      <div className="library-toolbar">
        <label className="search-box">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, categoria ou tag..." />
          <kbd>/</kbd>
        </label>
        <button className={onlyFavorites ? 'secondary-btn active' : 'secondary-btn'} onClick={() => setOnlyFavorites((value) => !value)}>
          <Heart size={16} fill={onlyFavorites ? 'currentColor' : 'none'} /> Favoritas
        </button>
      </div>

      <div className="category-row library-categories">
        {categories.map((item) => (
          <button key={item} className={category === item ? 'category active' : 'category'} onClick={() => setCategory(item)}>
            {item}
          </button>
        ))}
      </div>

      <div className={mode === 'full' ? 'library-grid' : 'decoration-grid'}>
        {visibleItems.map((decoration) => (
          <article
            className={selectedDecorationId === decoration.id ? 'decoration-card selected' : 'decoration-card'}
            key={decoration.id}
            onClick={() => onSelectDecoration(decoration)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelectDecoration(decoration)
              }
            }}
            role="button"
            tabIndex={0}
            style={PROTECTION_CONFIG.noSelectOnCards ? { userSelect: 'none' } : undefined}
          >
            <div className="thumb" onContextMenu={PROTECTION_CONFIG.disableContextMenu ? (event) => event.preventDefault() : undefined}>
              <img
                src={resolvePublicPath(decoration.thumbnail)}
                alt={decoration.name}
                loading="lazy"
                draggable={!PROTECTION_CONFIG.preventImageDrag}
                onDragStart={PROTECTION_CONFIG.preventImageDrag ? (event) => event.preventDefault() : undefined}
                onError={(event) => {
                  event.currentTarget.src = BROKEN_THUMB
                }}
              />
              {PROTECTION_CONFIG.enableWatermarkOverlay && (
                <span className="thumb-watermark">{PROTECTION_CONFIG.watermarkText}</span>
              )}
            </div>
            <div className="card-info">
              <strong>{decoration.name}</strong>
              <span>{decoration.category}</span>
              <small>{decoration.tags.slice(0, 3).join(' · ')}</small>
            </div>
            <div className="card-actions">
              {decoration.featured && <span className="feature-chip"><Star size={12} /> Destaque</span>}
              <button
                className="favorite"
                onClick={(event) => {
                  event.stopPropagation()
                  onToggleFavorite(decoration.id)
                }}
                aria-label={`Favoritar ${decoration.name}`}
              >
                <Heart size={16} fill={favorites.includes(decoration.id) ? 'currentColor' : 'none'} />
              </button>
            </div>
          </article>
        ))}

        {visibleItems.length === 0 && (
          <div className="empty library-empty">
            <Sparkles size={28} />
            <p>Nenhuma decoração encontrada.</p>
            <small>Tente outro termo ou categoria.</small>
          </div>
        )}
      </div>

      {visibleCount < filtered.length && (
        <div className="load-more-row">
          <button className="primary-btn" onClick={() => setVisibleCount((value) => value + PAGE_SIZE)}>Carregar mais</button>
        </div>
      )}

      <div className="library-total">Exibindo <strong>{visibleItems.length}</strong> de <strong>{filtered.length}</strong> resultados</div>
    </section>
  )
}
