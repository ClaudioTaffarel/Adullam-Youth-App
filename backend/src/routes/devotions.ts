import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { createUserClient } from '../lib/supabase.js'

const devotionsRouter = Router()

const devotionColumns = [
  'id',
  'user_id',
  'author_name',
  'book',
  'chapter',
  'verse_start',
  'verse_end',
  'reflection',
  'created_at',
  'devotion_date',
].join(', ')

// Menghasilkan tanggal YYYY-MM-DD berdasarkan WIB.
function getTodayWIB() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const year = parts.find((part) => part.type === 'year')!.value
  const month = parts.find((part) => part.type === 'month')!.value
  const day = parts.find((part) => part.type === 'day')!.value

  return `${year}-${month}-${day}`
}

devotionsRouter.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})

devotionsRouter.use(requireAuth)

// GET /api/devotions
devotionsRouter.get('/', async (_req, res) => {
  const accessToken = res.locals.accessToken as string
  const userClient = createUserClient(accessToken)
  const today = getTodayWIB()

  try {
    const { data, error } = await userClient
      .from('devotions')
      .select(devotionColumns)
      .eq('devotion_date', today)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(100)

    if (error) throw error

    res.json({
      data,
      date: today,
    })
  } catch {
    res.status(500).json({
      message: 'Renungan belum berhasil dimuat. Coba lagi sebentar.',
    })
  }
})

// POST /api/devotions
devotionsRouter.post('/', async (req, res) => {
  const accessToken = res.locals.accessToken as string

  const book: unknown = req.body?.book
  const chapter: unknown = req.body?.chapter
  const verseStart: unknown = req.body?.verse_start
  const verseEnd: unknown = req.body?.verse_end
  const reflection: unknown = req.body?.reflection

  if (typeof book !== 'string' || typeof reflection !== 'string') {
    res.status(400).json({
      message: 'Kitab dan isi renungan harus berupa teks.',
    })
    return
  }

  const cleanBook = book.trim()
  const cleanReflection = reflection.trim()

  if (cleanBook.length < 1 || cleanBook.length > 50) {
    res.status(400).json({
      message: 'Isi nama kitab dengan benar, maksimal 50 karakter.',
    })
    return
  }

  if (
    typeof chapter !== 'number' ||
    !Number.isInteger(chapter) ||
    chapter < 1 ||
    chapter > 150
  ) {
    res.status(400).json({
      message: 'Pasal harus berupa angka bulat antara 1 dan 150.',
    })
    return
  }

  if (
    typeof verseStart !== 'number' ||
    !Number.isInteger(verseStart) ||
    verseStart < 1 ||
    verseStart > 176
  ) {
    res.status(400).json({
      message: 'Ayat awal harus berupa angka bulat antara 1 dan 176.',
    })
    return
  }

  const cleanVerseEnd = verseEnd ?? null

  if (
    cleanVerseEnd !== null &&
    (
      typeof cleanVerseEnd !== 'number' ||
      !Number.isInteger(cleanVerseEnd) ||
      cleanVerseEnd < verseStart ||
      cleanVerseEnd > 176
    )
  ) {
    res.status(400).json({
      message:
        'Ayat akhir harus berupa angka bulat, tidak lebih kecil dari ayat awal, dan maksimal 176.',
    })
    return
  }

  if (
    cleanReflection.length < 1 ||
    cleanReflection.length > 3000
  ) {
    res.status(400).json({
      message: 'Isi renungan harus terdiri dari 1 sampai 3000 karakter.',
    })
    return
  }

  const userClient = createUserClient(accessToken)

  try {
    const { data, error } = await userClient
      .from('devotions')
      .insert({
        book: cleanBook,
        chapter,
        verse_start: verseStart,
        verse_end: cleanVerseEnd,
        reflection: cleanReflection,
      })
      .select(devotionColumns)
      .single()

    if (error) throw error

    res.status(201).json({
      message: 'Renungan berhasil dibagikan.',
      data,
    })
  } catch {
    res.status(500).json({
      message: 'Renungan belum berhasil disimpan. Coba lagi sebentar.',
    })
  }
})

export default devotionsRouter