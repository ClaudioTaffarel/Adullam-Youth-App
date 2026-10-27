import type { Request, Response, NextFunction } from 'express'
import type { User } from '@supabase/supabase-js'
import { createUserClient } from '../lib/supabase.js'

export async function requireAdmin(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  // Nilai ini diisi oleh requireAuth.
  const user = res.locals.authUser as User | undefined
  const accessToken = res.locals.accessToken as string | undefined

  if (!user || !accessToken) {
    res.status(401).json({
      message: 'Silakan masuk terlebih dahulu.',
    })
    return
  }

  try {
    const userClient = createUserClient(accessToken)

    const { data, error } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error

    // Tidak punya baris role berarti member.
    if (data?.role !== 'admin') {
      res.status(403).json({
        message: 'Halaman ini hanya bisa diakses oleh admin.',
      })
      return
    }

    next()
  } catch {
    res.status(503).json({
      message: 'Hak akses belum bisa diperiksa. Coba lagi sebentar.',
    })
  }
}