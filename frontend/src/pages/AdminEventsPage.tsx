import { useEffect, useState } from 'react'
import { useAuth } from '../context/auth-context'
import { getAdminEvents } from '../services/admin-events'
import type { EventStatusFilter } from '../services/admin-events'
import { Link, useLocation } from 'react-router'
import { useRef } from 'react'
import DeleteEventButton from '../components/DeleteEventButton'

type EventsResult = Awaited<ReturnType<typeof getAdminEvents>>

const filters: { value: EventStatusFilter; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'published', label: 'Terpublikasi' },
  { value: 'draft', label: 'Draft' },
]

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function EventCover({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false)

  return (
    <div className="ay-admin-event-cover">
      {src && !failed ? (
        <img
          src={src}
          alt={`Cover ${title}`}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>ADULLAM<br />TOGETHER.</span>
      )}
    </div>
  )
}

function AdminEventsPage() {
  const { session, isChecking } = useAuth()

  if (isChecking) {
    return <p role="status">Memeriksa sesi login...</p>
  }

  if (!session) return null

  return (
    <AdminEventsContent
      key={`${session.user.id}:${session.access_token}`}
      accessToken={session.access_token}
    />
  )
}

function AdminEventsContent({ accessToken }: { accessToken: string }) {
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null)
  const refreshButtonRef = useRef<HTMLButtonElement>(null)
  const location = useLocation()
  const notice = location.state?.notice
  const [status, setStatus] = useState<EventStatusFilter>('all')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)

  const [result, setResult] = useState<EventsResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let isActive = true

    const timeoutId = window.setTimeout(() => {
      controller.abort()
    }, 15_000)

    async function loadEvents() {
      setIsLoading(true)
      setError(null)
      setResult(null)

      try {
        const response = await getAdminEvents({
          accessToken,
          page,
          status,
          signal: controller.signal,
        })

        if (!isActive) return

        // Jika jumlah halaman berkurang, pindah ke halaman terakhir.
        const lastPage = Math.max(1, response.pagination.total_pages)

        if (page > lastPage) {
          setPage(lastPage)
          return
        }

        setResult(response)
      } catch (error) {
        if (!isActive) return

        setError(
          controller.signal.aborted
            ? 'Server terlalu lama merespons. Coba lagi, ya.'
            : error instanceof Error
              ? error.message
              : 'Belum berhasil terhubung ke server.',
        )
      } finally {
        window.clearTimeout(timeoutId)

        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadEvents()

    return () => {
      isActive = false
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [accessToken, page, status, reloadKey])

  function changeFilter(value: EventStatusFilter) {
    setStatus(value)
    setPage(1)
  }

  return (
    <>
      <header className="ay-admin-page-heading">
        <div>
          <p className="ay-admin-label">COMMUNITY STORIES</p>
          <h1>Events<span>.</span></h1>
          <p>Daftar kegiatan dan cerita komunitas.</p>
        </div>

        <Link className="ay-admin-primary" to="/admin/events/new">
          + Tambah event
        </Link>
      </header>

      {(deleteNotice || typeof notice === 'string') && (
        <p className="ay-admin-success" role="status">
          {deleteNotice ?? notice}
        </p>
      )}

      <div className="ay-admin-events-toolbar">
        <div
          className="ay-admin-event-filters"
          role="group"
          aria-label="Filter status event"
        >
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={status === filter.value}
              onClick={() => changeFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <button
          className="ay-admin-refresh"
          type="button"
          disabled={isLoading}
          onClick={() => setReloadKey((value) => value + 1)}
        >
          {isLoading ? 'Memuat...' : 'Perbarui'}
        </button>
      </div>

      {isLoading && (
        <p className="ay-admin-events-message" role="status">
          Mengambil daftar event...
        </p>
      )}

      {!isLoading && error && (
        <div className="ay-admin-empty">
          <p role="alert">{error}</p>

          <button
            className="ay-admin-refresh"
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            Coba lagi
          </button>
        </div>
      )}

      {!isLoading && result && (
        <>
          <p className="ay-admin-events-count" role="status">
            {result.pagination.total} event
            {status === 'published'
              ? ' terpublikasi'
              : status === 'draft'
                ? ' dalam draft'
                : ' ditemukan'}
          </p>

          {result.data.length === 0 ? (
            <section className="ay-admin-empty">
              <h2>Belum ada event.</h2>
              <p>
                {status === 'all'
                  ? 'Belum ada data event tersimpan di database.'
                  : 'Belum ada event yang sesuai dengan filter ini.'}
              </p>
            </section>
          ) : (
            <div className="ay-admin-events-list">
              {result.data.map((event) => (
                <article className="ay-admin-event-row" key={event.id}>
                  <EventCover
                    key={`${event.id}:${event.image}`}
                    src={event.image}
                    title={event.title}
                  />

                  <div className="ay-admin-event-info">
                    <span className="ay-admin-event-category">
                      {event.category}
                    </span>

                    <h2>{event.title}</h2>
                    <p>{event.description}</p>

                    <span className="ay-admin-event-date">
                      Dibuat{' '}
                      <time dateTime={event.created_at}>
                        {dateFormatter.format(new Date(event.created_at))}
                      </time>
                    </span>
                  </div>

                  <div className="ay-admin-event-actions">
                    <span
                      className={`ay-admin-event-status ${
                        event.is_published ? 'is-published' : 'is-draft'
                      }`}
                    >
                      {event.is_published ? 'Terpublikasi' : 'Draft'}
                    </span>

                    <Link
                      className="ay-admin-edit-link"
                      to={`/admin/events/${event.id}/edit`}
                      aria-label={`Edit event ${event.title}`}
                    >
                      Edit event
                    </Link>

                    <DeleteEventButton
                      eventId={event.id}
                      title={event.title}
                      onDeleted={() => {
                        setDeleteNotice(`Event “${event.title}” berhasil dihapus.`)
                        refreshButtonRef.current?.focus()
                        setReloadKey((value) => value + 1)
                      }}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}

          {result.pagination.total_pages > 1 && (
            <nav
              className="ay-admin-pagination"
              aria-label="Halaman daftar event"
            >
              <button
                ref={refreshButtonRef}
                className="ay-admin-refresh"
                type="button"
                disabled={page === 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Sebelumnya
              </button>

              <span>
                {page} / {result.pagination.total_pages}
              </span>

              <button
                className="ay-admin-refresh"
                type="button"
                disabled={page >= result.pagination.total_pages}
                onClick={() => setPage((value) => value + 1)}
              >
                Berikutnya
              </button>
            </nav>
          )}
        </>
      )}
    </>
  )
}

export default AdminEventsPage