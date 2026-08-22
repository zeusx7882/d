import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Decoration, Layer, Project } from '../types'
import { useHistory } from './useHistory'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function makeId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export function normalizeLayerOrder(layers: Layer[]) {
  return [...layers]
    .sort((left, right) => left.zIndex - right.zIndex)
    .map((layer, index) => ({ ...layer, zIndex: index }))
}

export function createAvatarLayer(src: string, name: string, mimeType: string, animated = false): Layer {
  return {
    id: makeId('avatar'),
    type: 'avatar',
    visible: true,
    opacity: 100,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    zIndex: 0,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    data: { src, name, mimeType, animated },
  }
}

export function createDecorationLayer(decoration: Decoration, src: string): Layer {
  return {
    id: makeId('decoration'),
    type: 'decoration',
    visible: true,
    opacity: 100,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    zIndex: 1,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    data: {
      decorationId: decoration.id,
      src,
      name: decoration.name,
      category: decoration.category,
      tags: decoration.tags,
    },
  }
}

export function createTextLayer(): Layer {
  return {
    id: makeId('text'),
    type: 'text',
    visible: true,
    opacity: 100,
    x: 0,
    y: 220,
    scale: 1,
    rotation: 0,
    zIndex: 1,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    data: {
      text: 'Seu texto aqui',
      fontSize: 54,
      color: '#ffffff',
      shadow: true,
    },
  }
}

export function createEmojiLayer(emoji = '✨'): Layer {
  return {
    id: makeId('emoji'),
    type: 'emoji',
    visible: true,
    opacity: 100,
    x: 0,
    y: -220,
    scale: 1,
    rotation: 0,
    zIndex: 1,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    data: {
      emoji,
      fontSize: 88,
    },
  }
}

export function createUploadLayer(src: string, name: string, mimeType: string): Layer {
  return {
    id: makeId('upload'),
    type: 'upload',
    visible: true,
    opacity: 100,
    x: 0,
    y: 0,
    scale: 0.8,
    rotation: 0,
    zIndex: 1,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    data: {
      src,
      name,
      mimeType,
    },
  }
}

export function buildProject(name: string, layers: Layer[], readOnly = false): Project {
  const timestamp = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
    layers: normalizeLayerOrder(layers),
    readOnly,
  }
}

export function useLayers(initialLayers: Layer[] = []) {
  const history = useHistory<Layer[]>(normalizeLayerOrder(initialLayers), 30)
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(initialLayers.at(-1)?.id ?? null)

  const layers = history.present

  useEffect(() => {
    if (!layers.length) {
      setSelectedLayerId(null)
      return
    }
    if (!selectedLayerId || !layers.some((layer) => layer.id === selectedLayerId)) {
      setSelectedLayerId(layers[layers.length - 1]?.id ?? null)
    }
  }, [layers, selectedLayerId])

  const selectedLayer = useMemo(
    () => layers.find((layer) => layer.id === selectedLayerId) ?? null,
    [layers, selectedLayerId],
  )

  const commitLayers = useCallback((next: Layer[] | ((current: Layer[]) => Layer[])) => {
    history.set((current) => normalizeLayerOrder(typeof next === 'function' ? (next as (value: Layer[]) => Layer[])(current) : next))
  }, [history])

  const replaceLayers = useCallback((next: Layer[] | ((current: Layer[]) => Layer[])) => {
    history.set((current) => normalizeLayerOrder(typeof next === 'function' ? (next as (value: Layer[]) => Layer[])(current) : next), { record: false })
  }, [history])

  const commitSnapshot = useCallback((previous: Layer[], next: Layer[]) => {
    history.commit(normalizeLayerOrder(previous), normalizeLayerOrder(next))
  }, [history])

  const addLayer = useCallback((layer: Layer) => {
    const nextLayer = { ...layer, zIndex: layers.length }
    commitLayers((current) => [...current, nextLayer])
    setSelectedLayerId(nextLayer.id)
  }, [commitLayers, layers.length])

  const updateLayer = useCallback((id: string, patch: Partial<Layer>, recordHistory = true) => {
    const apply = (current: Layer[]) => current.map((layer) => layer.id === id ? {
      ...layer,
      ...patch,
      opacity: patch.opacity !== undefined ? clamp(patch.opacity, 0, 100) : layer.opacity,
      brightness: patch.brightness !== undefined ? clamp(patch.brightness, 0, 200) : layer.brightness,
      contrast: patch.contrast !== undefined ? clamp(patch.contrast, 0, 200) : layer.contrast,
      saturation: patch.saturation !== undefined ? clamp(patch.saturation, 0, 200) : layer.saturation,
    } : layer)

    if (recordHistory) {
      commitLayers(apply)
    } else {
      replaceLayers(apply)
    }
  }, [commitLayers, replaceLayers])

  const updateLayerData = useCallback((id: string, patch: Record<string, unknown>, recordHistory = true) => {
    const apply = (current: Layer[]) => current.map((layer) => layer.id === id ? {
      ...layer,
      data: {
        ...layer.data,
        ...patch,
      },
    } : layer)

    if (recordHistory) {
      commitLayers(apply)
    } else {
      replaceLayers(apply)
    }
  }, [commitLayers, replaceLayers])

  const removeLayer = useCallback((id: string) => {
    commitLayers((current) => current.filter((layer) => layer.id !== id))
    setSelectedLayerId((current) => current === id ? null : current)
  }, [commitLayers])

  const toggleVisibility = useCallback((id: string) => {
    updateLayer(id, { visible: !layers.find((layer) => layer.id === id)?.visible })
  }, [layers, updateLayer])

  const reorderLayers = useCallback((sourceId: string, targetId: string) => {
    commitLayers((current) => {
      const ordered = [...current]
      const sourceIndex = ordered.findIndex((layer) => layer.id === sourceId)
      const targetIndex = ordered.findIndex((layer) => layer.id === targetId)
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
        return current
      }
      const [moved] = ordered.splice(sourceIndex, 1)
      ordered.splice(targetIndex, 0, moved)
      return ordered
    })
  }, [commitLayers])

  const loadLayers = useCallback((nextLayers: Layer[], selectTop = true) => {
    const normalized = normalizeLayerOrder(nextLayers)
    history.replaceBaseline(normalized)
    setSelectedLayerId(selectTop ? normalized.at(-1)?.id ?? null : normalized[0]?.id ?? null)
  }, [history])

  return {
    layers,
    selectedLayerId,
    selectedLayer,
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
    resetLayers: history.reset,
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  }
}
