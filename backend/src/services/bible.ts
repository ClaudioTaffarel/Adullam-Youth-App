export type PassageInput = {
  book: string
  chapter: number
  verse_start: number
  verse_end: number
}

export class BibleError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'BibleError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function normalizeBookName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

export async function findBiblePassage(input: PassageInput) {
  const book = input.book.trim()
  const { chapter, verse_start: start, verse_end: end } = input

  if (
    !book ||
    book.length > 50 ||
    !/^[1-3]?\s*[A-Za-zÀ-ÿ -]+$/.test(book) ||
    !Number.isInteger(chapter) ||
    chapter < 1 ||
    chapter > 150 ||
    !Number.isInteger(start) ||
    start < 1 ||
    start > 176 ||
    !Number.isInteger(end) ||
    end < start ||
    end > 176
  ) {
    throw new BibleError('Periksa kitab, pasal, dan rentang ayatnya.', 400)
  }

  const source = process.env.FRONTEND_URL

  if (!source) {
    throw new BibleError('Konfigurasi sumber Alkitab belum lengkap.', 500)
  }

  const url = new URL('https://api.ayt.co/v1/bible.php')

  url.searchParams.set('book', book)
  url.searchParams.set('chapter', String(chapter))
  url.searchParams.set('source', source)

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      throw new BibleError(
        'Sumber Alkitab sedang tidak tersedia. Coba lagi sebentar.',
        502,
      )
    }

    const payload: unknown = await response.json()

    if (!isRecord(payload)) {
      throw new BibleError('Respons sumber Alkitab belum bisa dibaca.', 502)
    }

    const result = Object.values(payload)
      .filter(isRecord)
      .find((item) =>
        isRecord(item.info) &&
        isRecord(item.data) &&
        isRecord(item.data[String(chapter)])
      )

    if (
      !result ||
      !isRecord(result.info) ||
      !isRecord(result.data)
    ) {
      throw new BibleError(
        'Kitab atau pasal tidak ditemukan. Periksa penulisannya.',
        422,
      )
    }

    const returnedBookName = result.info.book_name

    if (
      typeof returnedBookName !== 'string' ||
      !returnedBookName.trim()
    ) {
      throw new BibleError(
        'Respons sumber Alkitab tidak menyertakan nama kitab.',
        502,
      )
    }

    const bookName = returnedBookName.trim()

    if (normalizeBookName(bookName) !== normalizeBookName(book)) {
      throw new BibleError(
        'Nama kitab tidak dikenali. Gunakan nama lengkap, misalnya Matius.',
        422,
      )
    }

    const chapterData = result.data[String(chapter)]

    if (!isRecord(chapterData)) {
      throw new BibleError('Pasal tidak ditemukan.', 422)
    }

    const availableVerses = new Map<number, string>()

    for (const item of Object.values(chapterData)) {
      if (!isRecord(item) || typeof item.text !== 'string') continue

      const verseNumber = Number(item.verse)

      if (Number.isInteger(verseNumber) && verseNumber > 0) {
        availableVerses.set(verseNumber, item.text)
      }
    }

    const verses: { verse: number; text: string }[] = []

    for (let verse = start; verse <= end; verse += 1) {
      const text = availableVerses.get(verse)

      if (text === undefined) {
        throw new BibleError(
          `Ayat ${verse} tidak ditemukan pada pasal tersebut.`,
          422,
        )
      }

      verses.push({ verse, text })
    }

    const verseLabel = start === end ? String(start) : `${start}-${end}`

    return {
      translation: 'AYT',
      reference: `${bookName} ${chapter}:${verseLabel}`,
      book: bookName,
      chapter,
      verse_start: start,
      verse_end: end,
      verses,
      source: 'https://ayt.co',
      attribution: 'Alkitab Yang Terbuka (AYT) — Yayasan Lembaga SABDA',
    }
  } catch (error) {
    if (error instanceof BibleError) throw error

    const isTimeout =
      error instanceof Error &&
      (error.name === 'TimeoutError' || error.name === 'AbortError')

    throw new BibleError(
      isTimeout
        ? 'Pencarian ayat terlalu lama. Coba lagi sebentar.'
        : 'Belum berhasil terhubung ke sumber Alkitab.',
      isTimeout ? 504 : 502,
    )
  }
}