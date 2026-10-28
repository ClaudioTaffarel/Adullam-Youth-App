import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import type { User } from '@supabase/supabase-js'

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

// PATCH /api/admin/members/:id/status
adminMembersRouter.patch('/:id/status', async (req, res) => {
  const id = req.params.id
  const isActive: unknown = req.body?.is_active
  const currentUser = res.locals.authUser as User

  if (
    typeof id !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ||
    typeof isActive !== 'boolean'
  ) {
    res.status(400).json({
      message: 'ID atau status akun tidak valid.',
    })
    return
  }

  if (id.toLowerCase() === currentUser.id.toLowerCase()) {
    res.status(400).json({
      message: 'Kamu tidak bisa mengubah status akun sendiri.',
    })
    return
  }

  try {
    const { data: role, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', id)
      .maybeSingle()

    if (roleError) throw roleError

    // Pengelolaan status di halaman Members hanya untuk akun member.
    if (role?.role === 'admin') {
      res.status(403).json({
        message: 'Status akun admin tidak bisa diubah dari menu Members.',
      })
      return
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      {
        ban_duration: isActive ? 'none' : '876000h',
      },
    )

    if (error) {
      if (error.status === 404 || error.code === 'user_not_found') {
        res.status(404).json({
          message: 'Akun tidak ditemukan.',
        })
        return
      }

      throw error
    }

    if (!data.user) throw new Error('Respons akun tidak tersedia.')

    res.json({
      message: isActive
        ? 'Akun berhasil diaktifkan kembali.'
        : 'Akun berhasil dinonaktifkan.',
      data: {
        id: data.user.id,
        is_active: isActive,
      },
    })
  } catch (error) {
    console.error('Gagal mengubah status anggota:', error)

    res.status(500).json({
      message:
        'Status akun belum dapat dipastikan berubah. Perbarui daftar sebelum mencoba lagi.',
    })
  }
})

export default adminMembersRouter