import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import type { RequestHandler } from 'express'
import multer from 'multer'
import sharp from 'sharp'

import { supabaseAdmin } from '../lib/supabaseAdmin.js'

const adminEventCreateRouter = Router()

const MAX_FILE_SIZE = 5 * 1024 * 1024

const receiveCover = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
    fields: 4,
    parts: 5,
    fieldSize: 50_000,
  },
}).single('cover')

// Menangani kesalahan upload dengan respons JSON.
const parseCover: RequestHandler = (req, res, next) => {
  receiveCover(req, res, (error: unknown) => {
    if (error) {
      const isTooLarge =
        error instanceof multer.MulterError &&
        error.code === 'LIMIT_FILE_SIZE'

      res.status(isTooLarge ? 413 : 400).json({
        message: isTooLarge
          ? 'Ukuran foto maksimal 5 MB.'
          : 'Upload tidak valid. Kirim satu foto cover dan isi form dengan benar.',
      })
      return
    }

    next()
  })
}

// Dipasang di /api/admin/events setelah pemeriksaan admin.
adminEventCreateRouter.post('/', parseCover, async (req, res) => {
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

  if (!req.file || req.file.size === 0) {
    res.status(400).json({
      message: 'Pilih foto cover terlebih dahulu.',
    })
    return
  }

  let coverBuffer: Buffer

  try {
    // Memeriksa isi gambar, bukan hanya ekstensi atau MIME dari browser.
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
        message: 'Gunakan foto JPG, PNG, atau WebP yang tidak beranimasi.',
      })
      return
    }

    coverBuffer = await image
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer()

    if (coverBuffer.length > MAX_FILE_SIZE) {
      res.status(422).json({
        message: 'Foto masih terlalu besar. Pilih foto berukuran lebih kecil.',
      })
      return
    }
  } catch {
    res.status(422).json({
      message:
        'Foto tidak dapat diproses. Gunakan JPG, PNG, atau WebP maksimal 25 megapiksel.',
    })
    return
  }

  const coverPath = `${randomUUID()}.webp`
  let uploaded = false
  let saved = false

  try {
    const { error: uploadError } = await supabaseAdmin.storage
      .from('event-covers')
      .upload(coverPath, coverBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) throw uploadError

    uploaded = true

    const { data: coverData } = supabaseAdmin.storage
      .from('event-covers')
      .getPublicUrl(coverPath)

    const { data, error } = await supabaseAdmin
      .from('events')
      .insert({
        title: cleanTitle,
        category: cleanCategory,
        image: coverData.publicUrl,
        description: cleanDescription,
        is_published: published === 'true',
      })
      .select(
        'id, title, category, image, description, is_published, created_at',
      )
      .single()

    if (error) {
      // Hapus foto hanya ketika database memberikan penolakan yang jelas.
      // Pada kesalahan jaringan, hasil penyimpanan bisa belum pasti.
      if (error.code && /^[0-9A-Z]{5}$/.test(error.code)) {
        const { error: cleanupError } = await supabaseAdmin.storage
          .from('event-covers')
          .remove([coverPath])

        if (cleanupError) {
          console.error('Gagal membersihkan cover event:', cleanupError)
        }
      }

      throw error
    }

    saved = true

    res.status(201).json({
      message: 'Event berhasil disimpan.',
      data,
    })
  } catch (error) {
    console.error('Gagal membuat event:', error)

    res.status(500).json({
      message:
        uploaded && !saved
          ? 'Penyimpanan event belum dapat dipastikan. Periksa daftar event sebelum mencoba lagi.'
          : 'Event belum berhasil disimpan. Coba lagi sebentar.',
    })
  }
})

export default adminEventCreateRouter