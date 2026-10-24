import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  getTodayDevotions,
  publishDevotion,
} from '../services/devotions'
import type { Devotion } from '../services/devotions'

// WIB adalah UTC+7.
function millisecondsUntilMidnightWIB() {
  const day = 24 * 60 * 60 * 1000
  const nowWIB = Date.now() + 7 * 60 * 60 * 1000

  return day - (nowWIB % day) + 100
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function DevotionPage() {
  const [book, setBook] = useState('')
  const [chapter, setChapter] = useState('')
  const [verses, setVerses] = useState('')
  const [reflection, setReflection] = useState('')

  const [devotions, setDevotions] = useState<Devotion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formError, setFormError] = useState<string | null>(null)
  const [feedError, setFeedError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    // Jeda pembacaan feed saat publikasi berlangsung.
    if (isSubmitting) return

    const controller = new AbortController()
    let isFetching = false

    async function loadFeed() {
      if (isFetching || controller.signal.aborted) return

      isFetching = true

      try {
        const result = await getTodayDevotions(controller.signal)

        if (controller.signal.aborted) return

        setDevotions(result.data)
        setFeedError(null)
      } catch (error) {
        if (controller.signal.aborted) return

        setFeedError(
          error instanceof Error
            ? error.message
            : 'Renungan belum berhasil dimuat.',
        )
      } finally {
        isFetching = false

        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        setAttempt((current) => current + 1)
      }
    }

    void loadFeed()

    // Memuat postingan member lain setiap 30 detik.
    const interval = window.setInterval(() => {
      void loadFeed()
    }, 30_000)

    // Kosongkan feed lama, lalu ambil feed tanggal baru.
    const midnightTimer = window.setTimeout(() => {
      setDevotions([])
      setIsLoading(true)
      setAttempt((current) => current + 1)
    }, millisecondsUntilMidnightWIB())

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      controller.abort()
      window.clearInterval(interval)
      window.clearTimeout(midnightTimer)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [attempt, isSubmitting])

  async function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) return

    setFormError(null)
    setMessage(null)

    const cleanBook = book.trim()
    const cleanReflection = reflection.trim()
    const chapterNumber = Number(chapter)

    // Mendukung satu ayat atau rentang: 16 / 16-18.
    const verseMatch = verses.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/)

    if (!cleanBook || cleanBook.length > 50) {
      setFormError('Isi nama kitab dengan benar.')
      return
    }

    if (
      !Number.isInteger(chapterNumber) ||
      chapterNumber < 1 ||
      chapterNumber > 150
    ) {
      setFormError('Isi pasal antara 1 dan 150.')
      return
    }

    if (!verseMatch) {
      setFormError('Tulis ayat seperti 16 atau 16-18.')
      return
    }

    const verseStart = Number(verseMatch[1])
    const verseEnd = verseMatch[2] ? Number(verseMatch[2]) : null

    if (
      verseStart < 1 ||
      verseStart > 176 ||
      (verseEnd !== null &&
        (verseEnd < verseStart || verseEnd > 176))
    ) {
      setFormError('Periksa angka dan urutan ayatnya, ya.')
      return
    }

    if (!cleanReflection || cleanReflection.length > 3000) {
      setFormError('Isi renungan antara 1 dan 3000 karakter.')
      return
    }

    setIsSubmitting(true)

    try {
      await publishDevotion({
        book: cleanBook,
        chapter: chapterNumber,
        verse_start: verseStart,
        verse_end: verseEnd,
        reflection: cleanReflection,
      })

      setBook('')
      setChapter('')
      setVerses('')
      setReflection('')

      setMessage('Renunganmu berhasil dibagikan!')
      setAttempt((current) => current + 1)
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Renungan belum berhasil dibagikan.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="devotion-page">
      <div className="devotion-board">
        <section
          className="devotion-composer"
          aria-labelledby="devotion-title"
        >
          <h1 id="devotion-title">Renungan harian.</h1>

          <form onSubmit={handlePublish}>
            <fieldset
              className="devotion-form devotion-fieldset"
              disabled={isSubmitting}
            >
              <div className="devotion-reference-fields">
                <div className="devotion-field">
                  <label htmlFor="devotion-book">Kitab</label>

                  <input
                    id="devotion-book"
                    type="text"
                    placeholder="Contoh: Yohanes"
                    value={book}
                    onChange={(event) => setBook(event.target.value)}
                    maxLength={50}
                    required
                  />
                </div>

                <div className="devotion-field">
                  <label htmlFor="devotion-chapter">Pasal</label>

                  <input
                    id="devotion-chapter"
                    type="number"
                    min={1}
                    max={150}
                    step={1}
                    placeholder="3"
                    value={chapter}
                    onChange={(event) => setChapter(event.target.value)}
                    required
                  />
                </div>

                <div className="devotion-field">
                  <label htmlFor="devotion-verses">Ayat</label>

                  <input
                    id="devotion-verses"
                    type="text"
                    placeholder="16 atau 16-18"
                    value={verses}
                    onChange={(event) => setVerses(event.target.value)}
                    maxLength={30}
                    required
                  />
                </div>
              </div>

              <div className="devotion-field">
                <label htmlFor="devotion-reflection">
                  Renungan kamu
                </label>

                <textarea
                  id="devotion-reflection"
                  placeholder="Apa yang kamu pelajari dari firman hari ini?"
                  value={reflection}
                  onChange={(event) => setReflection(event.target.value)}
                  rows={5}
                  maxLength={3000}
                  required
                />
              </div>

              {formError && (
                <p className="auth-message auth-error" role="alert">
                  {formError}
                </p>
              )}

              {message && (
                <p className="auth-message auth-success" role="status">
                  {message}
                </p>
              )}

              <div className="devotion-form-footer">
                <span className="devotion-character-count">
                  {reflection.length}/3000
                </span>

                <button
                  type="submit"
                  className="button devotion-publish"
                >
                  {isSubmitting ? 'Membagikan...' : 'Bagikan renungan ↗'}
                </button>
              </div>
            </fieldset>
          </form>
        </section>

        <hr className="devotion-divider" />

        <section
          className="devotion-feed"
          aria-labelledby="devotion-feed-title"
        >
          <h2 id="devotion-feed-title">Renungan hari ini</h2>

          {isLoading && (
            <p className="devotion-feed-status" role="status">
              Sedang memuat renungan...
            </p>
          )}

          {feedError && (
            <div className="devotion-feed-status">
              <p role="alert">{feedError}</p>

              <button
                type="button"
                className="profile-action-button"
                disabled={isSubmitting}
                onClick={() => setAttempt((current) => current + 1)}
              >
                Coba lagi
              </button>
            </div>
          )}

          {!isLoading && !feedError && devotions.length === 0 && (
            <p className="devotion-feed-status">
              Belum ada renungan hari ini. Yuk, mulai berbagi.
            </p>
          )}

          <div className="devotion-feed-grid">
            {devotions.map((devotion) => (
              <article className="devotion-entry" key={devotion.id}>
                <header className="devotion-entry-header">
                  <strong>{devotion.author_name}</strong>

                  <time dateTime={devotion.created_at}>
                    {formatTime(devotion.created_at)} WIB
                  </time>
                </header>

                <h3>
                  {devotion.book} {devotion.chapter}:
                  {devotion.verse_start}
                  {devotion.verse_end !== null &&
                  devotion.verse_end !== devotion.verse_start
                    ? `-${devotion.verse_end}`
                    : ''}
                </h3>

                <p className="devotion-entry-text">
                  {devotion.reflection}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

export default DevotionPage