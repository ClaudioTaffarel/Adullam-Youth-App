import { Router } from 'express'
import type { User } from '@supabase/supabase-js'
import { requireAuth } from '../middleware/requireAuth.js'
import { createUserClient } from '../lib/supabase.js'

const profileRouter = Router()

// Semua response profil tidak boleh disimpan di cache.
profileRouter.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})

// Semua endpoint di router ini membutuhkan login.
profileRouter.use(requireAuth)

// GET /api/profile
profileRouter.get('/', async (_req, res) => {
  const user = res.locals.authUser as User
  const accessToken = res.locals.accessToken as string

  const userClient = createUserClient(accessToken)

  try {
    const { data: profile, error } = await userClient
      .from('profiles')
      .select('id, display_name, phone_number, created_at')
      .eq('id', user.id)
      .maybeSingle()

    if (error) throw error

    if (!profile) {
      res.status(404).json({
        message: 'Profil belum ditemukan.',
      })
      return
    }

    res.json({
      data: {
        ...profile,
        email: user.email ?? null,
      },
    })
  } catch {
    res.status(500).json({
      message: 'Profil belum berhasil dimuat. Coba lagi sebentar.',
    })
  }
})

// PATCH /api/profile
profileRouter.patch('/', async (req, res) => {
  const user = res.locals.authUser as User
  const accessToken = res.locals.accessToken as string

  const displayName: unknown = req.body?.display_name
  const phoneNumber: unknown = req.body?.phone_number

  // Form edit harus mengirim kedua kolom ini.
  if (
    typeof displayName !== 'string' ||
    typeof phoneNumber !== 'string'
  ) {
    res.status(400).json({
      message: 'Nama dan nomor telepon harus berupa teks.',
    })
    return
  }

  const cleanName = displayName.trim()
  const cleanPhone = phoneNumber.replace(/[\s()-]/g, '')

  if (cleanName.length < 2 || cleanName.length > 80) {
    res.status(400).json({
      message: 'Nama harus terdiri dari 2 sampai 80 karakter.',
    })
    return
  }

  if (!/^\+?[0-9]{8,15}$/.test(cleanPhone)) {
    res.status(400).json({
      message: 'Isi nomor telepon yang valid, misalnya 081234567890.',
    })
    return
  }

  const userClient = createUserClient(accessToken)

  try {
    const { data: profile, error } = await userClient
      .from('profiles')
      .update({
        display_name: cleanName,
        phone_number: cleanPhone,
      })
      .eq('id', user.id)
      .select('id, display_name, phone_number, created_at')
      .maybeSingle()

    if (error) throw error

    if (!profile) {
      res.status(404).json({
        message: 'Profil belum ditemukan.',
      })
      return
    }

    res.json({
      message: 'Profil berhasil diperbarui.',
      data: {
        ...profile,
        email: user.email ?? null,
      },
    })
  } catch {
    res.status(500).json({
      message: 'Profil belum berhasil disimpan. Coba lagi sebentar.',
    })
  }
})

export default profileRouter