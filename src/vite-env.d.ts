/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_ENABLED?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_USE_SIGNED_URLS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
