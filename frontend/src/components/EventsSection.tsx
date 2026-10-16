import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { events } from '../data/events'
import type { CommunityEvent } from '../data/events'

type EventsSectionProps = {
  fullPage?: boolean
}

function EventsSection({ fullPage = false }: EventsSectionProps) {
  const [selectedEvent, setSelectedEvent] = useState<CommunityEvent | null>(null)

  const trackRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const visibleEvents = fullPage ? events : events.slice(0, 6)
  const Heading = fullPage ? 'h1' : 'h2'

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
      className={`events-section ${fullPage ? 'events-page' : ''}`}
      id="events"
    >
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

          {!fullPage && (
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

      <div
        className={fullPage ? 'events-grid' : 'events-track'}
        id="events-track"
        ref={trackRef}
        role="region"
        aria-label={
          fullPage ? 'Semua kegiatan komunitas' : 'Carousel kegiatan komunitas'
        }
        tabIndex={fullPage ? undefined : 0}
      >
        {visibleEvents.map((event, index) => (
          <article className="event-card" key={event.id}>
            <div className="event-image">
              <span className="event-image-placeholder" aria-hidden="true">
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

              <span className="event-category">{event.category}</span>
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
                Baca ceritanya <span aria-hidden="true">↗</span>
              </button>
            </div>
          </article>
        ))}
      </div>

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
              <span className="event-image-placeholder" aria-hidden="true">
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
              <h2 id="event-modal-title">{selectedEvent.title}</h2>
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