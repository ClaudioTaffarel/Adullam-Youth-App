import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import adminEventCreateRouter from './admin-event-create.js'
import adminEventEditRouter from './admin-event-edit.js'

const adminRouter = Router()

adminRouter.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})

// Semua endpoint di bawah wajib melewati dua pemeriksaan ini.
adminRouter.use(requireAuth)
adminRouter.use(requireAdmin)

// GET /api/admin/check
adminRouter.get('/check', (_req, res) => {
  res.json({
    message: 'Akses admin berhasil.',
    data: {
      role: 'admin',
    },
  })
})

// GET /api/admin/stats
adminRouter.get('/stats', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('get_admin_dashboard_stats')
      .single()

    if (error) throw error
    if (!data) throw new Error('Statistik tidak tersedia.')

    res.json({ data })
  } catch (error) {
    console.error('Gagal memuat statistik admin:', error)

    res.status(500).json({
      message: 'Statistik belum berhasil dimuat. Coba lagi sebentar.',
    })
  }
})

// GET /api/admin/events?page=1&status=all
adminRouter.get('/events', async (req, res) => {
  const rawPage = req.query.page ?? '1'
  const status = req.query.status ?? 'all'

  if (
    typeof rawPage !== 'string' ||
    !/^[1-9]\d*$/.test(rawPage) ||
    !Number.isSafeInteger(Number(rawPage)) ||
    Number(rawPage) > 100_000
  ) {
    res.status(400).json({
      message: 'Nomor halaman tidak valid.',
    })
    return
  }

  if (
    typeof status !== 'string' ||
    !['all', 'published', 'draft'].includes(status)
  ) {
    res.status(400).json({
      message: 'Filter event tidak valid.',
    })
    return
  }

  const page = Number(rawPage)
  const pageSize = 12
  const start = (page - 1) * pageSize

  try {
    let query = supabaseAdmin
      .from('events')
      .select(
        'id, title, category, image, description, is_published, created_at',
        { count: 'exact' },
      )

    if (status !== 'all') {
      query = query.eq('is_published', status === 'published')
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
    console.error('Gagal memuat daftar event admin:', error)

    res.status(500).json({
      message: 'Daftar event belum berhasil dimuat. Coba lagi sebentar.',
    })
  }
})

adminRouter.use('/events', adminEventCreateRouter)
adminRouter.use('/events', adminEventEditRouter)

export default adminRouter