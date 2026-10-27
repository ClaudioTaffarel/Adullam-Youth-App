import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const adminRouter = Router()

adminRouter.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})

// Urutannya penting: periksa login, baru periksa role.
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

export default adminRouter