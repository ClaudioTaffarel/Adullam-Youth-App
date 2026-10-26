import { useEffect, useState } from 'react'
import { getBiblePassage } from '../services/bible'
import type { BiblePassage } from '../services/bible'

type BiblePassagePreviewProps = {
  book: string
  chapter: string
  verses: string
}

function BiblePassagePreview({
  book,
  chapter,
  verses,
}: BiblePassagePreviewProps) {
  const cleanBook = book.trim()
  const chapterNumber = Number(chapter)
  const match = verses.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/)

  // Tunggu sampai referensi cukup lengkap untuk dicari.
  if (
    !cleanBook ||
    cleanBook.length > 50 ||
    !Number.isInteger(chapterNumber) ||
    chapterNumber < 1 ||
    chapterNumber > 150 ||
    !match
  ) {
    return null
  }

  const verseStart = Number(match[1])
  const verseEnd = match[2] ? Number(match[2]) : verseStart

  if (
    verseStart < 1 ||
    verseStart > 176 ||
    verseEnd < verseStart ||
    verseEnd > 176
  ) {
    return null
  }

  return (
    <PassageResult
      key={`${cleanBook}:${chapterNumber}:${verseStart}:${verseEnd}`}
      book={cleanBook}
      chapter={chapterNumber}
      verseStart={verseStart}
      verseEnd={verseEnd}
    />
  )
}

type PassageResultProps = {
  book: string
  chapter: number
  verseStart: number
  verseEnd: number
}

function PassageResult({
  book,
  chapter,
  verseStart,
  verseEnd,
}: PassageResultProps) {
  const [passage, setPassage] = useState<BiblePassage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    // Tunggu 600 ms setelah input terakhir.
    const timer = window.setTimeout(async () => {
      try {
        const result = await getBiblePassage(
          {
            book,
            chapter,
            verse_start: verseStart,
            verse_end: verseEnd,
          },
          controller.signal,
        )

        if (controller.signal.aborted) return

        setPassage(result)
        setError(null)
      } catch (error) {
        if (controller.signal.aborted) return

        setError(
          error instanceof Error
            ? error.message
            : 'Teks ayat belum berhasil dimuat.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }, 600)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [book, chapter, verseStart, verseEnd, attempt])

  function retry() {
    setError(null)
    setIsLoading(true)
    setAttempt((current) => current + 1)
  }

  if (isLoading) {
    return (
      <div className="bible-preview bible-preview-status" role="status">
        Mencari ayat...
      </div>
    )
  }

  if (error) {
    return (
      <div className="bible-preview bible-preview-error">
        <p role="alert">{error}</p>

        <button
          type="button"
          className="auth-switch"
          onClick={retry}
        >
          Coba lagi
        </button>
      </div>
    )
  }

  if (!passage) return null

  return (
    <section className="bible-preview" aria-label="Teks ayat pilihan">
      <header className="bible-preview-heading">
        <strong>{passage.reference}</strong>
        <span className="bible-version">{passage.translation}</span>
      </header>

      <div className="bible-preview-verses">
        {passage.verses.map((item) => (
          <p key={item.verse}>
            <sup>{item.verse}</sup>
            {' '}
            {item.text}
          </p>
        ))}
      </div>

      <a
        className="bible-preview-source"
        href="https://ayt.co"
        target="_blank"
        rel="noopener noreferrer"
      >
        {passage.attribution} ↗
      </a>
    </section>
  )
}

export default BiblePassagePreview