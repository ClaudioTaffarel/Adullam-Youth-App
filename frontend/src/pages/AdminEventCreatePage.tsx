import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'

import {
  createAdminEvent,
  updateAdminEvent,
} from '../services/admin-events'
import type { AdminEvent } from '../services/admin-events'

const categories = ['KOMSEL', 'PRAYER NIGHT', 'FELLOWSHIP', 'LAINNYA']

type AdminEventCreatePageProps = {
  initialEvent?: AdminEvent
}

function CoverPreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  return url ? <img src={url} alt="Preview cover event" /> : null
}

function AdminEventCreatePage({
  initialEvent,
}: AdminEventCreatePageProps) {
  const navigate = useNavigate()
  const isEditing = initialEvent !== undefined

  const initialCategory = initialEvent?.category ?? 'KOMSEL'
  const isStandardCategory = categories
    .filter((item) => item !== 'LAINNYA')
    .includes(initialCategory)

  const [title, setTitle] = useState(initialEvent?.title ?? '')
  const [category, setCategory] = useState(
    isStandardCategory ? initialCategory : 'LAINNYA',
  )
  const [customCategory, setCustomCategory] = useState(
    isStandardCategory ? '' : initialCategory,
  )
  const [description, setDescription] = useState(
    initialEvent?.description ?? '',
  )
  const [isPublished, setIsPublished] = useState(
    initialEvent?.is_published ?? false,
  )
  const [cover, setCover] = useState<File | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submittingRef = useRef(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  function clearSelectedCover() {
    setCover(null)

    if (coverInputRef.current) {
      coverInputRef.current.value = ''
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submittingRef.current) return

    setError(null)

    const cleanTitle = title.trim()
    const cleanCategory =
      category === 'LAINNYA' ? customCategory.trim() : category
    const cleanDescription = description.trim()

    if (cleanTitle.length < 3 || cleanTitle.length > 160) {
      setError('Judul harus terdiri dari 3 sampai 160 karakter.')
      return
    }

    if (cleanCategory.length < 2 || cleanCategory.length > 50) {
      setError('Kategori harus terdiri dari 2 sampai 50 karakter.')
      return
    }

    if (
      cleanDescription.length < 10 ||
      cleanDescription.length > 10_000
    ) {
      setError('Isi cerita harus terdiri dari 10 sampai 10.000 karakter.')
      return
    }

    if (!isEditing && !cover) {
      setError('Pilih foto cover terlebih dahulu.')
      return
    }

    submittingRef.current = true
    setIsSubmitting(true)

    try {
      const input = {
        title: cleanTitle,
        category: cleanCategory,
        description: cleanDescription,
        is_published: isPublished,
      }

      if (initialEvent) {
        await updateAdminEvent(initialEvent.id, {
          ...input,
          cover,
        })
      } else {
        if (!cover) {
          throw new Error('Pilih foto cover terlebih dahulu.')
        }

        await createAdminEvent({
          ...input,
          cover,
        })
      }

      navigate('/admin/events', {
        replace: true,
        state: {
          notice: initialEvent
            ? 'Perubahan event berhasil disimpan.'
            : 'Event berhasil ditambahkan.',
        },
      })
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Event belum berhasil disimpan.',
      )
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <header className="ay-admin-page-heading">
        <div>
          <p className="ay-admin-label">
            {isEditing ? 'REFINE THE STORY' : 'A NEW COMMUNITY STORY'}
          </p>

          <h1>
            {isEditing ? 'Edit event' : 'Tambah event'}
            <span>.</span>
          </h1>

          <p>
            {isEditing
              ? 'Perbarui cerita, cover, dan status kegiatan.'
              : 'Mulai cerita baru untuk komunitas.'}
          </p>
        </div>
      </header>

      <form className="ay-event-form" onSubmit={handleSubmit}>
        <fieldset disabled={isSubmitting}>
          <div className="ay-event-form-grid">
            <section
              className="ay-event-form-panel"
              aria-labelledby="event-content-title"
            >
              <h2 id="event-content-title">Tentang kegiatannya</h2>

              <div className="ay-event-field">
                <label htmlFor="event-title">Judul event</label>

                <input
                  id="event-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Misalnya: A weekend in Lembang"
                  minLength={3}
                  maxLength={160}
                  required
                />
              </div>

              <div className="ay-event-field">
                <label htmlFor="event-category">Kategori</label>

                <select
                  id="event-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item === 'LAINNYA' ? 'Lainnya' : item}
                    </option>
                  ))}
                </select>
              </div>

              {category === 'LAINNYA' && (
                <div className="ay-event-field">
                  <label htmlFor="event-custom-category">
                    Nama kategori
                  </label>

                  <input
                    id="event-custom-category"
                    type="text"
                    value={customCategory}
                    onChange={(event) =>
                      setCustomCategory(event.target.value)
                    }
                    placeholder="Misalnya: RETREAT"
                    minLength={2}
                    maxLength={50}
                    required
                  />
                </div>
              )}

              <div className="ay-event-field">
                <label htmlFor="event-description">Isi cerita</label>

                <textarea
                  id="event-description"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Ceritakan kegiatannya di sini..."
                  rows={10}
                  minLength={10}
                  maxLength={10_000}
                  required
                />

                <small>
                  {description.length.toLocaleString('id-ID')} / 10.000
                  karakter
                </small>
              </div>
            </section>

            <section
              className="ay-event-form-panel ay-event-form-side"
              aria-labelledby="event-cover-title"
            >
              <h2 id="event-cover-title">Foto & publikasi</h2>

              <div className="ay-event-cover-preview">
                {cover ? (
                  <CoverPreview file={cover} />
                ) : initialEvent?.image ? (
                  <img
                    src={initialEvent.image}
                    alt="Cover event saat ini"
                  />
                ) : (
                  <span>
                    Every photo,
                    <br />
                    a little story.
                  </span>
                )}
              </div>

              <div className="ay-event-field">
                <label htmlFor="event-cover">
                  {isEditing ? 'Ganti foto cover' : 'Foto cover'}
                </label>

                <input
                  ref={coverInputRef}
                  id="event-cover"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-describedby="event-cover-help"
                  required={!isEditing}
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null
                    setError(null)

                    if (!file) {
                      setCover(null)
                      return
                    }

                    if (
                      !['image/jpeg', 'image/png', 'image/webp'].includes(
                        file.type,
                      ) ||
                      file.size === 0 ||
                      file.size > 5 * 1024 * 1024
                    ) {
                      setError(
                        'Pilih foto JPG, PNG, atau WebP maksimal 5 MB.',
                      )
                      event.target.value = ''
                      setCover(null)
                      return
                    }

                    setCover(file)
                  }}
                />

                <small id="event-cover-help">
                  JPG, PNG, atau WebP. Maksimal 5 MB.
                  {isEditing &&
                    ' Tidak memilih foto baru? Cover lama tetap dipakai.'}
                </small>

                {cover && (
                  <button
                    type="button"
                    className="ay-admin-refresh"
                    onClick={clearSelectedCover}
                  >
                    {isEditing ? 'Pakai cover lama' : 'Batalkan pilihan foto'}
                  </button>
                )}
              </div>

              <div className="ay-event-field">
                <label htmlFor="event-status">Status</label>

                <select
                  id="event-status"
                  value={isPublished ? 'published' : 'draft'}
                  onChange={(event) =>
                    setIsPublished(event.target.value === 'published')
                  }
                >
                  <option value="draft">Simpan sebagai draft</option>
                  <option value="published">Publikasikan</option>
                </select>

                <small>
                  {isPublished
                    ? 'Setelah disimpan, event akan tampil di halaman member.'
                    : 'Setelah disimpan, event hanya tampil dalam daftar admin.'}
                </small>
              </div>
            </section>
          </div>

          {error && (
            <p className="ay-admin-stats-error" role="alert">
              {error}
            </p>
          )}

          <div className="ay-event-form-actions">
            {isSubmitting ? (
              <span role="status">
                {cover
                  ? 'Mengunggah foto dan menyimpan...'
                  : 'Menyimpan perubahan...'}
              </span>
            ) : (
              <Link to="/admin/events">Batal</Link>
            )}

            <button className="ay-admin-primary" type="submit">
              {isSubmitting
                ? 'Menyimpan...'
                : isEditing
                  ? 'Simpan perubahan'
                  : isPublished
                    ? 'Publikasikan event'
                    : 'Simpan draft'}
            </button>
          </div>
        </fieldset>
      </form>
    </>
  )
}

export default AdminEventCreatePage