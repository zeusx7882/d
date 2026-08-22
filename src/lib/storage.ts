export async function getAssetUrl(assetPath: string): Promise<string> {
  if (import.meta.env.VITE_USE_SIGNED_URLS !== 'true') return assetPath
  const response = await fetch(`/api/storage/sign?path=${encodeURIComponent(assetPath)}`, {
    credentials: 'include',
  })
  if (!response.ok) return assetPath
  const payload = (await response.json()) as { url?: string }
  return payload.url || assetPath
}
