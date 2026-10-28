import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'

import { useAuth } from '../context/auth-context'
import {
  getAdminDevotions,
  setDevotionVisibility,
} from '../services/admin-devotions'
import type {
  AdminDevotion,
  AdminDevotionsResponse,
  DevotionFilterStatus,
} from '../services/admin-devotions'

const emptyFilters = {
  search: '',
  date: '',
  status: 'all' as DevotionFilterStatus,
}

const timeFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function reference(devotion: AdminDevotion) {
  const end =
    devotion.verse_end && devotion.verse_end !== devotion.verse_start
      ? `–${devotion.verse_end}`
      : ''

  return `${devotion.book} ${devotion.chapter}:${devotion.verse_start}${end}`
}

function DevotionDetail({
  devotion,
  onClose,
  onChanged,
}: {
  devotion: AdminDevotion
  onClose: () => void
  onChanged: (message: string) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const busyRef = useRef(false)

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'

    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [])

  function close() {
    if (!busyRef.current) onClose()
  }

  async function changeVisibility() {
    if (busyRef.current) return

    const nextHidden = !devotion.is_hidden

    const confirmed = window.confirm(
      nextHidden
        ? `Sembunyikan renungan ${devotion.author_name}?\n\nRiwayat kontribusi tetap dihitung untuk streak.`
        : 'Tampilkan kembali renungan ini?\n\nFeed member tetap hanya menampilkan renungan hari ini.',
    )

    if (!confirmed) return

    busyRef.current = true
    setIsSaving(true)
    setError(null)

    try {
      await setDevotionVisibility(devotion.id, nextHidden)
    } catch (error) {
      setError(
        error instanceof Error &&
          !['TimeoutError', 'AbortError', 'TypeError'].includes(error.name)
          ? error.message
          : 'Respons belum diterima. Tutup popup dan perbarui daftar untuk memeriksa statusnya.',
      )
      return
    } finally {
      busyRef.current = false
      setIsSaving(false)
    }

    onChanged(
      nextHidden
        ? 'Renungan berhasil disembunyikan.'
        : 'Renungan berhasil ditampilkan kembali.',
    )
  }

  return (
    <dialog
      ref={dialogRef}
      className="ay-devotion-dialog"
      aria-labelledby="admin-devotion-title"
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
    >
      <div className="ay-devotion-dialog-panel">
        <div className="ay-devotion-dialog-top">
          <p className="ay-admin-label">DEVOTION DETAIL</p>
          <button
            type="button"
            className="ay-admin-refresh"
            disabled={isSaving}
            onClick={close}
            autoFocus
          >
            Tutup
          </button>
        </div>

        <h2 id="admin-devotion-title">{reference(devotion)}</h2>
        <p className="ay-devotion-author">{devotion.author_name}</p>

        <p className="ay-devotion-time">
          {timeFormatter.format(new Date(devotion.created_at))} WIB
          {' · '}
          {devotion.is_hidden ? 'Tersembunyi' : 'Terlihat'}
        </p>

        <div className="ay-devotion-reflection">
          {devotion.reflection}
        </div>

        {error && (
          <p className="ay-admin-stats-error" role="alert">
            {error}
          </p>
        )}

        <div className="ay-devotion-moderation">
          <p>Mengubah visibilitas tidak menghapus riwayat streak.</p>

          <button
            type="button"
            className={
              devotion.is_hidden
                ? 'ay-admin-primary'
                : 'ay-admin-delete-trigger'
            }
            disabled={isSaving}
            onClick={changeVisibility}
          >
            {isSaving
              ? 'Menyimpan...'
              : devotion.is_hidden
                ? 'Tampilkan kembali'
                : 'Sembunyikan'}
          </button>
        </div>
      </div>
    </dialog>
  )
}

function AdminDevotionsPage() {
  const { session, isChecking } = useAuth()

  if (isChecking) return <p role="status">Memeriksa sesi login...</p>
  if (!session) return null

  return <DevotionsContent key={session.user.id} />
}

function DevotionsContent() {
  const [draft, setDraft] = useState(emptyFilters)
  const [query, setQuery] = useState({ ...emptyFilters, page: 1 })
  const [reloadKey, setReloadKey] = useState(0)

  const [result, setResult] = useState<AdminDevotionsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [selected, setSelected] = useState<AdminDevotion | null>(null)

  const refreshRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    const timeoutId = window.setTimeout(() => controller.abort(), 15_000)

    async function load() {
      setIsLoading(true)
      setError(null)
      setResult(null)

      try {
        const response = await getAdminDevotions(query, controller.signal)

        if (!active) return

        const lastPage = Math.max(1, response.pagination.total_pages)

        if (query.page > lastPage) {
          setQuery((current) => ({ ...current, page: lastPage }))
          return
        }

        setResult(response)
      } catch (error) {
        if (!active) return

        setError(
          controller.signal.aborted
            ? 'Server terlalu lama merespons. Coba lagi.'
            : error instanceof Error
              ? error.message
              : 'Renungan belum berhasil dimuat.',
        )
      } finally {
        window.clearTimeout(timeoutId)
        if (active) setIsLoading(false)
      }
    }

    void load()

    return () => {
      active = false
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [query, reloadKey])

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    setQuery({ ...draft, search: draft.search.trim(), page: 1 })
  }

  return (
    <>
      <header className="ay-admin-page-heading">
        <div>
          <p className="ay-admin-label">WORDS THAT HELP US GROW</p>
          <h1>Devotions<span>.</span></h1>
          <p>Lihat dan kelola renungan komunitas.</p>
        </div>
      </header>

      <form className="ay-devotion-filters" onSubmit={applyFilters}>
        <div className="ay-event-field">
          <label htmlFor="devotion-author-search">Nama penulis</label>
          <input
            id="devotion-author-search"
            type="search"
            maxLength={100}
            placeholder="Cari penulis..."
            value={draft.search}
            onChange={(event) =>
              setDraft({ ...draft, search: event.target.value })
            }
          />
        </div>

        <div className="ay-event-field">
          <label htmlFor="devotion-date-filter">Tanggal WIB</label>
          <input
            id="devotion-date-filter"
            type="date"
            min="0001-01-01"
            max="9999-12-31"
            value={draft.date}
            onChange={(event) =>
              setDraft({ ...draft, date: event.target.value })
            }
          />
        </div>

        <div className="ay-event-field">
          <label htmlFor="devotion-status-filter">Status</label>
          <select
            id="devotion-status-filter"
            value={draft.status}
            onChange={(event) =>
              setDraft({
                ...draft,
                status: event.target.value as DevotionFilterStatus,
              })
            }
          >
            <option value="all">Semua</option>
            <option value="visible">Terlihat</option>
            <option value="hidden">Tersembunyi</option>
          </select>
        </div>

        <div className="ay-devotion-filter-actions">
          <button className="ay-admin-primary" type="submit">
            Terapkan
          </button>

          <button
            className="ay-admin-refresh"
            type="button"
            onClick={() => {
              setDraft(emptyFilters)
              setQuery({ ...emptyFilters, page: 1 })
              setNotice(null)
            }}
          >
            Reset
          </button>
        </div>
      </form>

      {notice && (
        <p className="ay-admin-success" role="status">{notice}</p>
      )}

      <div className="ay-admin-section-heading">
        <h2>Riwayat renungan</h2>
        <button
          ref={refreshRef}
          type="button"
          className="ay-admin-refresh"
          disabled={isLoading}
          onClick={() => setReloadKey((value) => value + 1)}
        >
          {isLoading ? 'Memuat...' : 'Perbarui'}
        </button>
      </div>

      {isLoading && <p role="status">Mengambil renungan...</p>}

      {!isLoading && error && (
        <div className="ay-admin-empty">
          <p role="alert">{error}</p>
          <button
            type="button"
            className="ay-admin-refresh"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            Coba lagi
          </button>
        </div>
      )}

      {!isLoading && result && (
        <>
          <p className="ay-members-count" role="status">
            {result.pagination.total} renungan ditemukan.
          </p>

          {result.data.length === 0 ? (
            <div className="ay-admin-empty">
              <h2>Belum ada hasil.</h2>
              <p>Coba ubah filter atau kosongkan tanggal.</p>
            </div>
          ) : (
            <div className="ay-admin-devotions-list">
              {result.data.map((devotion) => (
                <article className="ay-admin-devotion-row" key={devotion.id}>
                  <div className="ay-admin-devotion-copy">
                    <span className="ay-devotion-author">
                      {devotion.author_name}
                    </span>

                    <h3>{reference(devotion)}</h3>

                    <p className="ay-devotion-excerpt">
                      {devotion.reflection}
                    </p>

                    <p className="ay-devotion-time">
                      {timeFormatter.format(new Date(devotion.created_at))} WIB
                    </p>
                  </div>

                  <div className="ay-admin-devotion-actions">
                    <span
                      className={`ay-admin-event-status ${
                        devotion.is_hidden ? 'is-draft' : 'is-published'
                      }`}
                    >
                      {devotion.is_hidden ? 'Tersembunyi' : 'Terlihat'}
                    </span>

                    <button
                      type="button"
                      className="ay-admin-refresh"
                      aria-haspopup="dialog"
                      aria-label={`Baca renungan ${devotion.author_name}: ${reference(devotion)}`}
                      onClick={() => setSelected(devotion)}
                    >
                      Baca renungan
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {result.pagination.total_pages > 1 && (
            <nav className="ay-admin-pagination" aria-label="Halaman renungan">
              <button
                type="button"
                className="ay-admin-refresh"
                disabled={query.page === 1}
                onClick={() =>
                  setQuery((current) => ({
                    ...current,
                    page: current.page - 1,
                  }))
                }
              >
                Sebelumnya
              </button>

              <span>{query.page} / {result.pagination.total_pages}</span>

              <button
                type="button"
                className="ay-admin-refresh"
                disabled={query.page >= result.pagination.total_pages}
                onClick={() =>
                  setQuery((current) => ({
                    ...current,
                    page: current.page + 1,
                  }))
                }
              >
                Berikutnya
              </button>
            </nav>
          )}
        </>
      )}

      {selected && (
        <DevotionDetail
          key={selected.id}
          devotion={selected}
          onClose={() => setSelected(null)}
          onChanged={(message) => {
            setSelected(null)
            setNotice(message)
            refreshRef.current?.focus()
            setReloadKey((value) => value + 1)
          }}
        />
      )}
    </>
  )
}

export default AdminDevotionsPage