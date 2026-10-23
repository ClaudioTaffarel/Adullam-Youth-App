import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useProfile } from '../context/profile-context'
import { uploadMyAvatar } from '../services/api'

function AvatarUploader() {
  const { setProfile } = useProfile()

  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }

    const url = URL.createObjectURL(file)
    setPreview(url)

    return () => URL.revokeObjectURL(url)
  }, [file])

  function handleSelect(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0]

    // Memungkinkan pengguna memilih ulang file yang sama.
    event.target.value = ''

    if (!selectedFile) return

    setError(null)
    setMessage(null)
    setFile(null)

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Pilih foto JPG, PNG, atau WebP.')
      return
    }

    if (
      selectedFile.size === 0 ||
      selectedFile.size > 2 * 1024 * 1024
    ) {
      setError('Ukuran foto harus lebih dari 0 dan maksimal 2 MB.')
      return
    }

    setFile(selectedFile)
  }

  function cancelSelection() {
    setFile(null)
    setError(null)
    setMessage(null)
  }

  async function handleUpload() {
    if (!file || isUploading) return

    setIsUploading(true)
    setError(null)
    setMessage(null)

    try {
      const updatedProfile = await uploadMyAvatar(file)

      setProfile(updatedProfile)
      setFile(null)
      setMessage('Foto profil berhasil diperbarui!')
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Foto belum berhasil di-upload.',
      )
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="avatar-uploader">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Pilih foto profil"
        onChange={handleSelect}
        disabled={isUploading}
        hidden
      />

      <div className="avatar-upload-row">
        {file && preview && (
          <img
            className="avatar-upload-preview"
            src={preview}
            alt="Preview foto profil baru"
          />
        )}

        <div className="avatar-upload-options">
          <button
            type="button"
            className="profile-action-button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {file ? 'Pilih foto lain' : 'Ganti foto profil ↗'}
          </button>

          {file && (
            <div className="avatar-upload-actions">
              <button
                type="button"
                className="button"
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? 'Mengunggah...' : 'Simpan foto'}
              </button>

              <button
                type="button"
                className="auth-switch"
                onClick={cancelSelection}
                disabled={isUploading}
              >
                Batal
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="auth-message auth-error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="auth-message auth-success" role="status">
          {message}
        </p>
      )}
    </div>
  )
}

export default AvatarUploader