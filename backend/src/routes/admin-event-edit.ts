import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import type { RequestHandler } from 'express'
import multer from 'multer'
import sharp from 'sharp'

import { supabaseAdmin } from '../lib/supabaseAdmin.js'

const adminEventEditRouter = Router()

const eventColumns =
  'id, title, category, image, description, is_published, created_at' as const

const maxFileSize = 5 * 1024 * 1024

const receiveCover = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSize,
    files: 1,
    fields: 4,
    parts: 5,
    fieldSize: 50_000,
  },
}).single('cover')

const parseCover: RequestHandler = (req, res, next) => {
  receiveCover(req, res, (error: unknown) => {
    if (error) {
      const tooLarge =
        error instanceof multer.MulterError &&
        error.code === 'LIMIT_FILE_SIZE'

      res.status(tooLarge ? 413 : 400).json({
        message: tooLarge
          ? 'Ukuran foto maksimal 5 MB.'
          : 'Upload tidak valid. Kirim satu foto cover.',
      })
      return
    }

    next()
  })
}

// ID tabel events menggunakan integer PostgreSQL.
adminEventEditRouter.param('id', (_req, res, next, value: string) => {
  const id = Number(value)

  if (
    !/^[1-9]\d*$/.test(value) ||
    !Number.isSafeInteger(id) ||
    id > 2_147_483_647
  ) {
    res.status(400).json({
      message: 'ID event tidak valid.',
    })
    return
  }

  res.locals.eventId = id
  next()
})

// GET /api/admin/events/:id
adminEventEditRouter.get('/:id', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select(eventColumns)
      .eq('id', res.locals.eventId)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      res.status(404).json({
        message: 'Event tidak ditemukan.',
      })
      return
    }

    res.json({ data })
  } catch (error) {
    console.error('Gagal membaca detail event:', error)

    res.status(500).json({
      message: 'Detail event belum berhasil dimuat.',
    })
  }
})

// PATCH /api/admin/events/:id
adminEventEditRouter.patch('/:id', parseCover, async (req, res) => {
  const id = res.locals.eventId as number

  const title: unknown = req.body?.title
  const category: unknown = req.body?.category
  const description: unknown = req.body?.description
  const published: unknown = req.body?.is_published

  if (
    typeof title !== 'string' ||
    typeof category !== 'string' ||
    typeof description !== 'string' ||
    (published !== 'true' && published !== 'false')
  ) {
    res.status(400).json({
      message: 'Lengkapi judul, kategori, cerita, dan status event.',
    })
    return
  }

  const cleanTitle = title.trim()
  const cleanCategory = category.trim()
  const cleanDescription = description.trim()

  if (cleanTitle.length < 3 || cleanTitle.length > 160) {
    res.status(400).json({
      message: 'Judul harus terdiri dari 3 sampai 160 karakter.',
    })
    return
  }

  if (cleanCategory.length < 2 || cleanCategory.length > 50) {
    res.status(400).json({
      message: 'Kategori harus terdiri dari 2 sampai 50 karakter.',
    })
    return
  }

  if (
    cleanDescription.length < 10 ||
    cleanDescription.length > 10_000
  ) {
    res.status(400).json({
      message: 'Isi cerita harus terdiri dari 10 sampai 10.000 karakter.',
    })
    return
  }

  try {
    const { data: existing, error: readError } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (readError) throw readError

    if (!existing) {
      res.status(404).json({
        message: 'Event tidak ditemukan.',
      })
      return
    }

    let newImageUrl: string | undefined

    // Foto hanya diproses ketika admin memilih pengganti.
    if (req.file) {
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
          .webp({ quality: 82 })
          .toBuffer()
      } catch {
        res.status(422).json({
          message:
            'Foto tidak dapat diproses. Gunakan foto maksimal 25 megapiksel.',
        })
        return
      }

      if (buffer.length > maxFileSize) {
        res.status(422).json({
          message: 'Foto masih terlalu besar. Pilih foto lebih kecil.',
        })
        return
      }

      const path = `${randomUUID()}.webp`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('event-covers')
        .upload(path, buffer, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data: imageData } = supabaseAdmin.storage
        .from('event-covers')
        .getPublicUrl(path)

      newImageUrl = imageData.publicUrl
    }

    const { data, error } = await supabaseAdmin
      .from('events')
      .update({
        title: cleanTitle,
        category: cleanCategory,
        description: cleanDescription,
        is_published: published === 'true',
        ...(newImageUrl ? { image: newImageUrl } : {}),
      })
      .eq('id', id)
      .select(eventColumns)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      res.status(404).json({
        message: 'Event sudah tidak tersedia.',
      })
      return
    }

    res.json({
      message: 'Perubahan event berhasil disimpan.',
      data,
    })
  } catch (error) {
    console.error('Gagal memperbarui event:', error)

    res.status(500).json({
      message:
        'Perubahan belum dapat dipastikan tersimpan. Periksa kembali event sebelum mencoba lagi.',
    })
  }
})

// DELETE /api/admin/events/:id
adminEventEditRouter.delete('/:id', async (_req, res) => {
  const id = res.locals.eventId as number

  try {
    const { error } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Tetap berhasil jika event sudah dihapus sebelumnya.
    res.status(204).end()
  } catch (error) {
    console.error('Gagal menghapus event:', error)

    res.status(500).json({
      message: 'Event belum berhasil dihapus. Coba lagi sebentar.',
    })
  }
})

export default adminEventEditRouter