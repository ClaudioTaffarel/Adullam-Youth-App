import { useEffect, useRef, useState } from 'react'
import {
  getWebsitePhotos,
  uploadWebsitePhoto,
  websitePhotoSlots,
} from '../services/website-photos'
import type {
  WebsitePhotos,
  WebsitePhotoSlot,
} from '../services/website-photos'

const labels: Record<WebsitePhotoSlot, string> = {
  hero_1: 'Polaroid 01',
  hero_2: 'Polaroid 02',
  hero_3: 'Polaroid 03',
  hero_4: 'Polaroid 04',
  hero_5: 'Polaroid 05',
  hero_6: 'Polaroid 06',
  about: 'Foto About Us',
}

function PhotoPreview({
  src,
  title,
}: {
  src: string
  title: string
}) {
  const [failed, setFailed] = useState(false)

  return failed ? (
    <span>Foto belum dapat ditampilkan.</span>
  ) : (
    <img
      src={src}
      alt={title}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

function LocalPhotoPreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  return url ? (
    <PhotoPreview key={url} src={url} title="Preview foto pengganti" />
  ) : null
}

function PhotoEditor({
  slot,
  initialUrl,
}: {
  slot: WebsitePhotoSlot
  initialUrl: string
}) {
  const [currentUrl, setCurrentUrl] = useState(initialUrl)
  const [file, setFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const busyRef = useRef(false)

  function clearFile() {
    setFile(null)

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  async function savePhoto() {
    if (!file || busyRef.current) return

    busyRef.current = true
    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      const url = await uploadWebsitePhoto(slot, file)

      setCurrentUrl(url)
      clearFile()
      setMessage('Foto berhasil diperbarui.')
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Foto belum berhasil disimpan.',
      )
    } finally {
      busyRef.current = false
      setIsSaving(false)
    }
  }

  return (
    <article className="ay-website-photo-card">
      <div className="ay-website-photo-heading">
        <h2>{labels[slot]}</h2>
        <span>{slot === 'about' ? 'ABOUT US' : 'HERO'}</span>
      </div>

      <div className="ay-website-photo-preview">
        {file ? (
          <LocalPhotoPreview file={file} />
        ) : (
          <PhotoPreview
            key={currentUrl}
            src={currentUrl}
            title={labels[slot]}
          />
        )}
      </div>

      <div className="ay-event-field">
        <label htmlFor={`photo-${slot}`}>Pilih foto pengganti</label>

        <input
          ref={inputRef}
          id={`photo-${slot}`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={isSaving}
          aria-describedby={`photo-help-${slot}`}
          onChange={(event) => {
            const selected = event.target.files?.[0] ?? null

            setError(null)
            setMessage(null)

            if (!selected) {
              setFile(null)
              return
            }

            if (
              !['image/jpeg', 'image/png', 'image/webp'].includes(
                selected.type,
              ) ||
              selected.size === 0 ||
              selected.size > 5 * 1024 * 1024
            ) {
              setError('Pilih JPG, PNG, atau WebP maksimal 5 MB.')
              event.target.value = ''
              setFile(null)
              return
            }

            setFile(selected)
          }}
        />

        <small id={`photo-help-${slot}`}>
          JPG, PNG, atau WebP. Maksimal 5 MB.
        </small>
      </div>

      {error && (
        <p className="ay-admin-stats-error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="ay-admin-success" role="status">
          {message}
        </p>
      )}

      <div className="ay-website-photo-actions">
        {file && (
          <button
            type="button"
            className="ay-admin-refresh"
            disabled={isSaving}
            onClick={() => {
              clearFile()
              setError(null)
            }}
          >
            Batal
          </button>
        )}

        <button
          type="button"
          className="ay-admin-primary"
          disabled={!file || isSaving}
          onClick={savePhoto}
        >
          {isSaving ? 'Menyimpan...' : 'Simpan foto'}
        </button>
      </div>

      {isSaving && (
        <p className="ay-website-photo-saving" role="status">
          Mengunggah dan memproses foto...
        </p>
      )}
    </article>
  )
}

function AdminWebsitePhotosPage() {
  const [photos, setPhotos] = useState<WebsitePhotos | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    const timeoutId = window.setTimeout(() => {
      controller.abort()
    }, 15_000)

    async function loadPhotos() {
      setIsLoading(true)
      setError(null)

      try {
        const result = await getWebsitePhotos(controller.signal)

        if (active) setPhotos(result)
      } catch (error) {
        if (!active) return

        setError(
          controller.signal.aborted
            ? 'Server terlalu lama merespons. Coba lagi, ya.'
            : error instanceof Error
              ? error.message
              : 'Foto website belum berhasil dimuat.',
        )
      } finally {
        window.clearTimeout(timeoutId)
        if (active) setIsLoading(false)
      }
    }

    void loadPhotos()

    return () => {
      active = false
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [reloadKey])

  return (
    <>
      <header className="ay-admin-page-heading">
        <div>
          <p className="ay-admin-label">THE FACES OF OUR COMMUNITY</p>
          <h1>Foto website<span>.</span></h1>
          <p>Perbarui kenangan di hero dan About Us.</p>
        </div>
      </header>

      {isLoading ? (
        <p role="status">Mengambil foto website...</p>
      ) : error ? (
        <section className="ay-admin-empty">
          <p role="alert">{error}</p>

          <button
            type="button"
            className="ay-admin-refresh"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            Coba lagi
          </button>
        </section>
      ) : photos ? (
        <div className="ay-website-photos-grid">
          {websitePhotoSlots.map((slot) => (
            <PhotoEditor
              key={slot}
              slot={slot}
              initialUrl={photos[slot]}
            />
          ))}
        </div>
      ) : null}
    </>
  )
}

export default AdminWebsitePhotosPage