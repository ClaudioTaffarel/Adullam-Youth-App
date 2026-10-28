import { Router } from 'express'

import { requireAuth } from '../middleware/requireAuth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'

const adminDevotionsRouter = Router()

const columns =
  'id, author_name, book, chapter, verse_start, verse_end, reflection, created_at, devotion_date, is_hidden' as const

adminDevotionsRouter.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})

adminDevotionsRouter.use(requireAuth)
adminDevotionsRouter.use(requireAdmin)

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  if (value < '0001-01-01') return false

  const parsed = new Date(`${value}T00:00:00Z`)

  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  )
}

// GET /api/admin/devotions
adminDevotionsRouter.get('/', async (req, res) => {
  const rawPage = req.query.page ?? '1'
  const search = req.query.search ?? ''
  const date = req.query.date ?? ''
  const status = req.query.status ?? 'all'

  if (
    typeof rawPage !== 'string' ||
    !/^[1-9]\d*$/.test(rawPage) ||
    !Number.isSafeInteger(Number(rawPage)) ||
    Number(rawPage) > 100_000
  ) {
    res.status(400).json({ message: 'Nomor halaman tidak valid.' })
    return
  }

  if (typeof search !== 'string' || search.trim().length > 100) {
    res.status(400).json({
      message: 'Pencarian maksimal 100 karakter.',
    })
    return
  }

  if (
    typeof date !== 'string' ||
    (date !== '' && !isValidDate(date))
  ) {
    res.status(400).json({ message: 'Tanggal tidak valid.' })
    return
  }

  if (
    typeof status !== 'string' ||
    !['all', 'visible', 'hidden'].includes(status)
  ) {
    res.status(400).json({ message: 'Status tidak valid.' })
    return
  }

  const page = Number(rawPage)
  const pageSize = 20
  const start = (page - 1) * pageSize

  try {
    let query = supabaseAdmin
      .from('devotions')
      .select(columns, { count: 'exact' })

    if (date) {
      query = query.eq('devotion_date', date)
    }

    if (status !== 'all') {
      query = query.eq('is_hidden', status === 'hidden')
    }

    if (search.trim()) {
      // Perlakukan %, _ dan backslash sebagai teks pencarian biasa.
      const literalSearch = search
        .trim()
        .replace(/[\\%_]/g, '\\$&')

      query = query.ilike('author_name', `%${literalSearch}%`)
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(start, start + pageSize - 1)

    if (error) throw error

    const total = count ?? 0

    res.json({
      data: data ?? [],
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('Gagal membaca renungan admin:', error)

    res.status(500).json({
      message: 'Daftar renungan belum berhasil dimuat.',
    })
  }
})

// PATCH /api/admin/devotions/:id/visibility
adminDevotionsRouter.patch('/:id/visibility', async (req, res) => {
  const id = req.params.id
  const isHidden: unknown = req.body?.is_hidden

  if (
    typeof id !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ||
    typeof isHidden !== 'boolean'
  ) {
    res.status(400).json({
      message: 'ID atau status renungan tidak valid.',
    })
    return
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('devotions')
      .update({ is_hidden: isHidden })
      .eq('id', id)
      .select('id, is_hidden')
      .maybeSingle()

    if (error) throw error

    if (!data) {
      res.status(404).json({
        message: 'Renungan tidak ditemukan.',
      })
      return
    }

    res.json({
      message: isHidden
        ? 'Renungan berhasil disembunyikan.'
        : 'Renungan berhasil ditampilkan kembali.',
      data,
    })
  } catch (error) {
    console.error('Gagal memoderasi renungan:', error)

    res.status(500).json({
      message:
        'Status belum dapat dipastikan berubah. Perbarui daftar untuk memeriksa hasilnya.',
    })
  }
})

export default adminDevotionsRouter