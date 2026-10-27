import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

import { getAdminEvent } from '../services/admin-events'
import type { AdminEvent } from '../services/admin-events'
import AdminEventCreatePage from './AdminEventCreatePage'

function AdminEventEditPage() {
  const { id } = useParams()
  const eventId = Number(id)

  if (
    !id ||
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(eventId) ||
    eventId > 2_147_483_647
  ) {
    return (
      <section className="ay-admin-empty">
        <h1>ID event tidak valid.</h1>
        <Link className="ay-admin-link" to="/admin/events">
          Kembali ke Events
        </Link>
      </section>
    )
  }

  return <EditEventLoader key={eventId} id={eventId} />
}

function EditEventLoader({ id }: { id: number }) {
  const [event, setEvent] = useState<AdminEvent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    const timeoutId = window.setTimeout(() => {
      controller.abort()
    }, 15_000)

    async function loadEvent() {
      setIsLoading(true)
      setError(null)

      try {
        const data = await getAdminEvent(id, controller.signal)

        if (active) setEvent(data)
      } catch (error) {
        if (!active) return

        setError(
          controller.signal.aborted
            ? 'Server terlalu lama merespons. Coba lagi, ya.'
            : error instanceof Error
              ? error.message
              : 'Detail event belum berhasil dimuat.',
        )
      } finally {
        window.clearTimeout(timeoutId)
        if (active) setIsLoading(false)
      }
    }

    void loadEvent()

    return () => {
      active = false
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [id, reloadKey])

  if (isLoading) {
    return <p role="status">Mengambil detail event...</p>
  }

  if (error || !event) {
    return (
      <section className="ay-admin-empty">
        <h1>Event belum bisa dibuka.</h1>
        <p role="alert">{error ?? 'Data event tidak tersedia.'}</p>

        <button
          type="button"
          className="ay-admin-refresh"
          onClick={() => setReloadKey((value) => value + 1)}
        >
          Coba lagi
        </button>

        <Link className="ay-admin-link" to="/admin/events">
          Kembali ke Events
        </Link>
      </section>
    )
  }

  return <AdminEventCreatePage key={event.id} initialEvent={event} />
}

export default AdminEventEditPage