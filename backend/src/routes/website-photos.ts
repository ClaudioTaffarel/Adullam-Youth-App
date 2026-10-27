import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import type { RequestHandler } from 'express'
import multer from 'multer'
import sharp from 'sharp'

import { supabase } from '../lib/supabase.js'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

export const websitePhotosRouter = Router()
export const adminWebsitePhotosRouter = Router()

const slots = new Set([
  'hero_1',
  'hero_2',
  'hero_3',
  'hero_4',
  'hero_5',
  'hero_6',
  'about',
])

const maxFileSize = 5 * 1024 * 1024

const noCache: RequestHandler = (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
}

websitePhotosRouter.use(noCache)
adminWebsitePhotosRouter.use(noCache)

// GET /api/website-photos
// Foto homepage boleh dibaca pengunjung.
websitePhotosRouter.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('website_photos')
      .select('slot, image_url')
      .order('slot')

    if (error) throw error

    res.json({ data: data ?? [] })
  } catch (error) {
    console.error('Gagal membaca foto website:', error)

    res.status(500).json({
      message: 'Foto website belum berhasil dimuat.',
    })
  }
})

// Mengganti foto hanya diperbolehkan untuk admin.
adminWebsitePhotosRouter.use(requireAuth)
adminWebsitePhotosRouter.use(requireAdmin)

adminWebsitePhotosRouter.param(
  'slot',
  (_req, res, next, value: string) => {
    if (!slots.has(value)) {
      res.status(400).json({
        message: 'Slot foto tidak valid.',
      })
      return
    }

    res.locals.photoSlot = value
    next()
  },
)

const receivePhoto = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSize,
    files: 1,
    fields: 0,
    parts: 1,
  },
}).single('photo')

const parsePhoto: RequestHandler = (req, res, next) => {
  receivePhoto(req, res, (error: unknown) => {
    if (error) {
      const tooLarge =
        error instanceof multer.MulterError &&
        error.code === 'LIMIT_FILE_SIZE'

      res.status(tooLarge ? 413 : 400).json({
        message: tooLarge
          ? 'Ukuran foto maksimal 5 MB.'
          : 'Upload tidak valid. Pilih satu foto.',
      })
      return
    }

    next()
  })
}

// PATCH /api/admin/website-photos/:slot
adminWebsitePhotosRouter.patch(
  '/:slot',
  parsePhoto,
  async (req, res) => {
    const slot = res.locals.photoSlot as string

    if (!req.file || req.file.size === 0) {
      res.status(400).json({
        message: 'Pilih foto terlebih dahulu.',
      })
      return
    }

    let buffer: Buffer

    try {
      const image = sharp(req.file.buffer, {
        limitInputPixels: 25_000_000,
      })

      const metadata = await image.metadata()

      if (
        !metadata.format ||
        !['jpeg', 'png', 'webp'].includes(metadata.format) ||
        (metadata.pages ?? 1) > 1
      ) {
        res.status(422).json({
          message: 'Gunakan JPG, PNG, atau WebP yang tidak beranimasi.',
        })
        return
      }

      buffer = await image
        .rotate()
        .resize({
          width: 1600,
          height: 1600,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer()
    } catch {
      res.status(422).json({
        message:
          'Foto tidak dapat diproses. Gunakan gambar maksimal 25 megapiksel.',
      })
      return
    }

    if (buffer.length > maxFileSize) {
      res.status(422).json({
        message: 'Hasil foto terlalu besar. Pilih foto yang lebih kecil.',
      })
      return
    }

    try {
      const { data: existing, error: readError } = await supabaseAdmin
        .from('website_photos')
        .select('slot')
        .eq('slot', slot)
        .maybeSingle()

      if (readError) throw readError

      if (!existing) {
        res.status(404).json({
          message: 'Slot foto belum tersedia di database.',
        })
        return
      }

      const path = `${slot}/${randomUUID()}.webp`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('website-photos')
        .upload(path, buffer, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data: photoData } = supabaseAdmin.storage
        .from('website-photos')
        .getPublicUrl(path)

      const { data, error } = await supabaseAdmin
        .from('website_photos')
        .update({
          image_url: photoData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('slot', slot)
        .select('slot, image_url')
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error('Slot foto tidak ditemukan.')

      res.json({
        message: 'Foto website berhasil diperbarui.',
        data,
      })
    } catch (error) {
      console.error('Gagal mengganti foto website:', error)

      res.status(500).json({
        message:
          'Penyimpanan belum dapat dipastikan. Muat ulang halaman untuk memeriksa foto sebelum mencoba lagi.',
      })
    }
  },
)