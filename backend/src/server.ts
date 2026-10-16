import express from 'express'
import cors from 'cors'
import { events } from './data/events.js'

const app = express()
const port = Number(process.env.PORT ?? 3000)

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  }),
)

app.use(express.json())

// Endpoint untuk mengecek apakah server hidup.
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'ADULLAM Youth API sudah berjalan!',
  })
})

// Endpoint untuk mengambil daftar kegiatan.
app.get('/api/events', (_req, res) => {
  res.json({
    data: events,
    total: events.length,
  })
})

// Respons untuk alamat API yang belum tersedia.
app.use((_req, res) => {
  res.status(404).json({
    message: 'Endpoint tidak ditemukan.',
  })
})

app.listen(port, () => {
  console.log(`ADULLAM API: http://localhost:${port}`)
})