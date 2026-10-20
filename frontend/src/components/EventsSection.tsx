import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { getEvents } from '../services/api'
import type { CommunityEvent } from '../types/event'

type EventsSectionProps = {
  fullPage?: boolean
}

function EventsSection({ fullPage = false }: EventsSectionProps) {
  // Data dari backend
  const [events, setEvents] = useState<CommunityEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Event yang sedang dibuka di popup
  const [selectedEvent, setSelectedEvent] =
    useState<CommunityEvent | null>(null)

  const trackRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const visibleEvents = fullPage ? events : events.slice(0, 6)
  const Heading = fullPage ? 'h1' : 'h2'
  const hasEvents = !isLoading && error === null && events.length > 0

  // Ambil daftar event dari API
  useEffect(() => {
    const controller = new AbortController()

    async function loadEvents() {
      setIsLoading(true)
      setError(null)

      try {
        const result = await getEvents(controller.signal)

        if (!controller.signal.aborted) {
          setEvents(result.data)
        }
      } catch (error) {
        if (controller.signal.aborted) return

        console.error('Gagal memuat events:', error)

        setError(
          'Kegiatan belum berhasil dimuat. Coba lagi sebentar, ya.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadEvents()

    return () => {
      controller.abort()
    }
  }, [reloadKey])

  // Buka popup dan hentikan scroll halaman belakang
  useEffect(() => {
    if (!selectedEvent) return

    const dialog = dialogRef.current
    if (!dialog) return

    const previousOverflow = document.body.style.overflow

    dialog.showModal()
    document.body.style.overflow = 'hidden'

    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [selectedEvent])

  function closeModal() {
    setSelectedEvent(null)
  }

  function scrollCards(direction: number) {
    const track = trackRef.current
    if (!track) return

    const card = track.querySelector<HTMLElement>('.event-card')
    const distance = card ? card.offsetWidth + 24 : track.clientWidth

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    track.scrollBy({
      left: direction * distance,
      behavior: reduceMotion ? 'instant' : 'smooth',
    })
  }

  return (
    <section
      className={`events-section ${
        fullPage ? 'events-page' : 'events-home-pattern'
      }`}
      id="events"
    >
      {/* Judul dan kontrol carousel */}
      <div className="events-heading">
        <div>
          <p className="eyebrow">LIFE TOGETHER LOOKS LIKE THIS</p>

          <Heading>
            Good times.
            <br />
            <span>Better together.</span>
          </Heading>
        </div>

        <div className="events-intro">
          <p>
            Dari Kamis malam sampai perjalanan bareng.
            Selalu ada cerita yang bisa kita bawa pulang.
          </p>

          {!fullPage && hasEvents && (
            <div className="carousel-controls">
              <button
                type="button"
                className="carousel-arrow"
                aria-label="Geser kegiatan ke kiri"
                aria-controls="events-track"
                onClick={() => scrollCards(-1)}
              >
                ←
              </button>

              <button
                type="button"
                className="carousel-arrow"
                aria-label="Geser kegiatan ke kanan"
                aria-controls="events-track"
                onClick={() => scrollCards(1)}
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="events-status" role="status">
          <p>Lagi mengambil cerita dari ADULLAM...</p>
        </div>
      )}

      {/* Gagal mengambil data */}
      {!isLoading && error && (
        <div className="events-status" role="alert">
          <p>{error}</p>

          <button
            type="button"
            className="button"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Data kosong */}
      {!isLoading && !error && events.length === 0 && (
        <div className="events-status" role="status">
          <p>
            Belum ada kegiatan yang dipublikasikan.
            Nantikan ceritanya!
          </p>
        </div>
      )}

      {/* Cards hanya ditampilkan setelah data berhasil dimuat */}
      {hasEvents && (
        <div
          className={fullPage ? 'events-grid' : 'events-track'}
          id="events-track"
          ref={trackRef}
          role="region"
          aria-label={
            fullPage
              ? 'Semua kegiatan komunitas'
              : 'Carousel kegiatan komunitas'
          }
          tabIndex={fullPage ? undefined : 0}
        >
          {visibleEvents.map((event, index) => (
            <article className="event-card" key={event.id}>
              <div className="event-image">
                <span
                  className="event-image-placeholder"
                  aria-hidden="true"
                >
                  ADULLAM
                  <br />
                  TOGETHER.
                </span>

                <img
                  src={event.image}
                  alt={`Kegiatan ${event.category} ADULLAM Youth`}
                  loading="lazy"
                  onError={(error) => {
                    error.currentTarget.style.display = 'none'
                  }}
                />

                <span className="event-category">
                  {event.category}
                </span>
              </div>

              <div className="event-content">
                <span className="event-number">
                  / {String(index + 1).padStart(2, '0')}
                </span>

                <h3>{event.title}</h3>

                <button
                  type="button"
                  className="event-read-button"
                  aria-haspopup="dialog"
                  aria-label={`Baca cerita: ${event.title}`}
                  onClick={() => setSelectedEvent(event)}
                >
                  Baca ceritanya
                  <span aria-hidden="true">↗</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Link halaman Events */}
      {!fullPage && (
        <div className="events-footer">
          <p className="events-hint">
            A little collection of us. Geser untuk lihat lainnya.
          </p>

          <Link className="button" to="/events">
            View all events <span aria-hidden="true">↗</span>
          </Link>
        </div>
      )}

      {/* Popup detail event */}
      <dialog
        ref={dialogRef}
        className="event-modal"
        aria-labelledby="event-modal-title"
        onCancel={(event) => {
          event.preventDefault()
          closeModal()
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeModal()
          }
        }}
      >
        {selectedEvent && (
          <div className="event-modal-panel">
            <button
              type="button"
              className="event-modal-close"
              onClick={closeModal}
              autoFocus
            >
              Tutup <span aria-hidden="true">×</span>
            </button>

            <div className="event-modal-photo">
              <span
                className="event-image-placeholder"
                aria-hidden="true"
              >
                ADULLAM
                <br />
                TOGETHER.
              </span>

              <img
                key={selectedEvent.id}
                src={selectedEvent.image}
                alt={`Kegiatan ${selectedEvent.category} ADULLAM Youth`}
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                }}
              />
            </div>

            <div className="event-modal-copy">
              <p className="eyebrow">{selectedEvent.category}</p>

              <h2 id="event-modal-title">
                {selectedEvent.title}
              </h2>

              <p className="event-modal-description">
                {selectedEvent.description}
              </p>

              <div className="event-modal-signature">
                ADULLAM YOUTH / #SemuaOrangDiterima
              </div>
            </div>
          </div>
        )}
      </dialog>
    </section>
  )
}

export default EventsSection