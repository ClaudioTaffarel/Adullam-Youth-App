import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type AvatarProps = {
  path: string | null
  name: string
  className?: string
}

function Avatar({
  path,
  name,
  className = '',
}: AvatarProps) {
  const [photo, setPhoto] = useState<{
    path: string
    url: string
  } | null>(null)

  useEffect(() => {
    if (!path) return

    let cancelled = false
    let objectUrl: string | undefined

    async function loadPhoto() {
      try {
        const { data, error } = await supabase.storage
          .from('avatars')
          .download(path!)

        if (cancelled || error || !data) return

        objectUrl = URL.createObjectURL(data)

        setPhoto({
          path: path!,
          url: objectUrl,
        })
      } catch {
        // Jika foto gagal dimuat, tampilkan inisial.
      }
    }

    void loadPhoto()

    return () => {
      cancelled = true

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [path])

  const initial = name.trim().charAt(0).toUpperCase() || 'A'
  const photoUrl = photo?.path === path ? photo?.url : null

  return (
    <span
      className={`profile-avatar ${className}`}
      aria-hidden="true"
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt=""
          onError={() => setPhoto(null)}
        />
      ) : (
        initial
      )}
    </span>
  )
}

export default Avatar