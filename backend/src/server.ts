import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { supabase } from './lib/supabase.js'
import type { User } from '@supabase/supabase-js'
import { requireAuth } from './middleware/requireAuth.js'
import profileRouter from './routes/profile.js'
import devotionsRouter from './routes/devotions.js'
import bibleRouter from './routes/bible.js'
import adminRouter from './routes/admin.js'

const app = express()
const port = Number(process.env.PORT ?? 3000)

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  }),
)

app.use(express.json())
app.use('/api/profile', profileRouter)
app.use('/api/devotions', devotionsRouter)
app.use('/api/bible', bibleRouter)
app.use('/api/admin', adminRouter)

// Mengecek apakah server Express hidup.
// Ini belum memeriksa koneksi database.
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'ADULLAM Youth API sudah berjalan!',
  })
})

// Mengambil kegiatan yang sudah dipublikasikan.
app.get('/api/events', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, category, image, description')
      .eq('is_published', true)
      .order('id', { ascending: true })

    if (error) {
      console.error('Supabase gagal membaca events:', error.message)

      res.status(500).json({
        message: 'Data kegiatan belum berhasil dimuat.',
      })

      return
    }

    const events = data ?? []

    res.json({
      data: events,
      total: events.length,
    })
  } catch (error) {
    console.error(
      'Gagal mengambil events:',
      error instanceof Error ? error.message : 'Unknown error',
    )

    res.status(500).json({
      message: 'Terjadi masalah saat mengambil kegiatan.',
    })
  }
})

app.get('/api/me', requireAuth, (_req, res) => {
  const user = res.locals.authUser as User

  res.setHeader('Cache-Control', 'no-store')

  res.json({
    data: {
      id: user.id,
      email: user.email ?? null,
      name:
        typeof user.user_metadata.display_name === 'string'
          ? user.user_metadata.display_name
          : 'Teman',
    },
  })
})

app.use((_req, res) => {
  res.status(404).json({
    message: 'Endpoint tidak ditemukan.',
  })
})

app.listen(port, () => {
  console.log(`ADULLAM API: http://localhost:${port}`)
})