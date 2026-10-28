import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'

const adminMembersRouter = Router()

adminMembersRouter.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})

adminMembersRouter.use(requireAuth)
adminMembersRouter.use(requireAdmin)

// GET /api/admin/members?page=1&search=claudio
adminMembersRouter.get('/', async (req, res) => {
  const rawPage = req.query.page ?? '1'
  const rawSearch = req.query.search ?? ''

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
    typeof rawSearch !== 'string' ||
    rawSearch.trim().length > 100
  ) {
    res.status(400).json({
      message: 'Pencarian harus berupa teks, maksimal 100 karakter.',
    })
    return
  }

  try {
    const { data, error } = await supabaseAdmin.rpc(
      'get_admin_members',
      {
        p_search: rawSearch.trim(),
        p_page: Number(rawPage),
      },
    )

    if (error) throw error
    if (!data) throw new Error('Respons daftar anggota tidak tersedia.')

    res.json(data)
  } catch (error) {
    console.error('Gagal membaca daftar anggota:', error)

    res.status(500).json({
      message: 'Daftar anggota belum berhasil dimuat. Coba lagi sebentar.',
    })
  }
})

export default adminMembersRouter