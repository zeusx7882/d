export type Decoration = {
  id: string
  name: string
  category: string
  thumbnail: string
  asset: string
  tags: string[]
  featured?: boolean
}

export type EditorState = {
  x: number
  y: number
  scale: number
  rotation: number
  zoom: number
}
