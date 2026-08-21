export function resolveAssetUrl(assetPath, apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api') {
  if (!assetPath) return null
  if (/^https?:\/\//i.test(assetPath)) return assetPath

  const normalizedBase = apiUrl.replace(/\/api\/?$/, '')
  const normalizedPath = assetPath.startsWith('/api/')
    ? assetPath
    : assetPath.startsWith('/uploads/')
      ? `/api${assetPath}`
      : assetPath.startsWith('/')
        ? assetPath
        : `/${assetPath}`

  return `${normalizedBase}${normalizedPath}`
}
