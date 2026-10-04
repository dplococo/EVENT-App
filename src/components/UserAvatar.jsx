import { useState } from 'react'
import { resolveAssetUrl } from '../utils/assetUrl'

// Foto del usuario; no muestra nada si no tiene una cargada (o si no carga).
export default function UserAvatar({ imageUrl, size = 36 }) {
  const [failed, setFailed] = useState(false)
  const src = resolveAssetUrl(imageUrl)
  if (!src || failed) return null

  return (
    <img
      src={src}
      alt=""
      className="user-avatar"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  )
}
