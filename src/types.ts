export const DECORATION_CATEGORIES = ['Populares', 'Anime', 'Fantasia', 'Natureza', 'Amor', 'Halloween', 'Natal', 'Fogo', 'Anjos', 'Demônios', 'Animais', 'Outros'] as const

export type DecorationCategory = (typeof DECORATION_CATEGORIES)[number]

export type Decoration = {
  id: string
  name: string
  category: DecorationCategory | string
  thumbnail: string
  asset: string
  tags: string[]
  featured?: boolean
  visible?: boolean
}

export type LayerType = 'avatar' | 'decoration' | 'text' | 'emoji' | 'upload'

export type LayerBase = {
  id: string
  type: LayerType
  visible: boolean
  opacity: number
  x: number
  y: number
  scale: number
  rotation: number
  zIndex: number
  brightness: number
  contrast: number
  saturation: number
}

export type AvatarLayerData = {
  src: string
  mimeType: string
  animated?: boolean
  name: string
}

export type DecorationLayerData = {
  decorationId: string
  src: string
  name: string
  category: string
  tags: string[]
}

export type TextLayerData = {
  text: string
  fontSize: number
  color: string
  shadow: boolean
}

export type EmojiLayerData = {
  emoji: string
  fontSize: number
}

export type UploadLayerData = {
  src: string
  name: string
  mimeType: string
}

export type LayerData = AvatarLayerData | DecorationLayerData | TextLayerData | EmojiLayerData | UploadLayerData

export type Layer = LayerBase & {
  data: LayerData
}

export type Project = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  layers: Layer[]
  readOnly?: boolean
}

export type DiscordUser = {
  id: string
  username: string
  avatar: string
  discriminator: string
}

export type AuthState = {
  user: DiscordUser | null
  loading: boolean
  error: string | null
}
