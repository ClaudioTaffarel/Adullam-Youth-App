import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { createUserClient } from '../lib/supabase.js'
import { BibleError, findBiblePassage } from '../services/bible.js'
import type { User } from '@supabase/supabase-js'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'

const devotionsRouter = Router()

const devotionColumns =
  'id, user_id, author_name, book, chapter, verse_start, verse_end, reflection, created_at, devotion_date' as const

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

// GET /api/devotions/streak
devotionsRouter.get('/streak', async (_req, res) => {
  const accessToken = res.locals.accessToken as string
  const userClient = createUserClient(accessToken)

  try {
    const { data, error } = await userClient
      .rpc('get_my_devotion_streak')
      .single()

    if (error) throw error

    if (!data) {
      throw new Error('Data streak tidak tersedia.')
    }

    res.json({ data })
  } catch {
    res.status(500).json({
      message: 'Streak belum berhasil dimuat. Coba lagi sebentar.',
    })
  }
})

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
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(100)

    if (error) throw error

    const { data: authors, error: avatarsError } = await userClient
      .rpc('get_today_devotion_avatars')

    if (avatarsError) throw avatarsError

    type AuthorAvatar = {
      user_id: string
      avatar_path: string | null
    }

    const avatarByUser = new Map<string, string | null>()

    for (const author of (authors ?? []) as AuthorAvatar[]) {
      avatarByUser.set(author.user_id, author.avatar_path)
    }

    const devotionsWithAvatars = (data ?? []).map((devotion) => ({
      ...devotion,
      avatar_path: avatarByUser.get(devotion.user_id) ?? null,
    }))

    res.json({
      data: devotionsWithAvatars,
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
  const user = res.locals.authUser as User

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

  try {
    // Periksa referensi langsung dari sumber Alkitab.
    const passage = await findBiblePassage({
      book: cleanBook,
      chapter,
      verse_start: verseStart,
      verse_end: cleanVerseEnd ?? verseStart,
    })

    // Simpan hanya setelah referensinya berhasil diperiksa.
    const { data, error } = await supabaseAdmin
      .from('devotions')
      .insert({
        user_id: user.id,
        book: passage.book,
        chapter: passage.chapter,
        verse_start: passage.verse_start,
        verse_end:
          passage.verse_end === passage.verse_start
            ? null
            : passage.verse_end,
        reflection: cleanReflection,
      })
      .select(devotionColumns)
      .single()

    if (error) throw error

    res.status(201).json({
      message: 'Renungan berhasil dibagikan.',
      data,
    })

  } catch (error) {
    if (error instanceof BibleError) {
      res.status(error.status).json({
        message: error.message,
      })
      return
    }

    res.status(500).json({
      message: 'Renungan belum berhasil disimpan. Coba lagi sebentar.',
    })
  }
})

export default devotionsRouter