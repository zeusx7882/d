/**
 * Resolve a public-folder asset path to the correct URL taking Vite's base
 * into account. Paths that start with "/" are relative to the site root, so
 * we prepend BASE_URL (e.g. "/d/" on GitHub Pages). External URLs are
 * returned unchanged.
 */
export function resolvePublicPath(path: string): string {
  if (!path || path.startsWith('http') || path.startsWith('data:')) return path
  if (path.startsWith('/')) {
    const base = import.meta.env.BASE_URL ?? '/'
    return base.replace(/\/$/, '') + path
  }
  return path
}

export async function getAssetUrl(assetPath: string): Promise<string> {
  const resolved = resolvePublicPath(assetPath)
  if (import.meta.env.VITE_USE_SIGNED_URLS !== 'true') return resolved
  const response = await fetch(`/api/storage/sign?path=${encodeURIComponent(assetPath)}`, {
    credentials: 'include',
  })
  if (!response.ok) return resolved
  const payload = (await response.json()) as { url?: string }
  return payload.url || resolved
}
