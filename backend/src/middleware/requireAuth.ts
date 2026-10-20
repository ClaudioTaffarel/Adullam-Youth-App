import type { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase.js'

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

    // Informasi ini hanya berlaku untuk request yang sedang diproses.
    res.locals.authUser = data.user
    res.locals.accessToken = token

    next()
  } catch {
    res.status(503).json({
      message: 'Pemeriksaan login sedang tidak tersedia. Coba lagi sebentar.',
    })
  }
}