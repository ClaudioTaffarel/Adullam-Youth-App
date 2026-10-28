import type { Request, Response, NextFunction } from 'express'
import { supabase, createUserClient } from '../lib/supabase.js'

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.get('Authorization')
  const match = authorization?.match(/^Bearer\s+(\S+)$/i)
  const token = match?.[1]

  if (!token) {
    res.status(401).json({
      message: 'Silakan login terlebih dahulu.',
    })
    return
  }

  try {
    const { data, error } = await supabase.auth.getUser(token)

    if (error) {
      if (error.code === 'user_banned') {
        res.status(403).json({
          message: 'Akun ini dinonaktifkan. Hubungi pengurus komunitas.',
        })
        return
      }

      const serviceUnavailable =
        !error.status || error.status >= 500 || error.status === 429

      res.status(serviceUnavailable ? 503 : 401).json({
        message: serviceUnavailable
          ? 'Pemeriksaan login sedang tidak tersedia. Coba lagi sebentar.'
          : 'Sesi tidak valid atau sudah kedaluwarsa. Silakan login lagi.',
      })
      return
    }

    if (!data.user) {
      res.status(401).json({
        message: 'Sesi tidak valid. Silakan login lagi.',
      })
      return
    }

    const userClient = createUserClient(token)

    const { data: isActive, error: statusError } = await userClient.rpc(
      'is_current_account_active',
    )

    if (statusError) {
      console.error('Gagal memeriksa status akun:', {
        code: statusError.code,
        message: statusError.message,
        details: statusError.details,
        hint: statusError.hint,
      })

      res.status(503).json({
        message: 'Status akun belum berhasil diperiksa. Coba lagi sebentar.',
      })
      return
    }

    if (isActive !== true) {
      res.status(403).json({
        message: 'Akun ini dinonaktifkan. Hubungi pengurus komunitas.',
      })
      return
    }

    res.locals.authUser = data.user
    res.locals.accessToken = token

    next()
  } catch {
    res.status(503).json({
      message: 'Pemeriksaan login sedang tidak tersedia. Coba lagi sebentar.',
    })
  }
}