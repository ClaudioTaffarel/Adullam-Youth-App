import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { BibleError, findBiblePassage } from '../services/bible.js'

const bibleRouter = Router()

bibleRouter.use(requireAuth)

bibleRouter.get('/passage', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')

  const book = req.query.book
  const chapter = req.query.chapter
  const start = req.query.verse_start
  const end = req.query.verse_end

  if (
    typeof book !== 'string' ||
    typeof chapter !== 'string' ||
    typeof start !== 'string' ||
    (end !== undefined && typeof end !== 'string')
  ) {
    res.status(400).json({
      message: 'Isi kitab, pasal, dan ayat terlebih dahulu.',
    })
    return
  }

  try {
    const passage = await findBiblePassage({
      book,
      chapter: Number(chapter),
      verse_start: Number(start),
      verse_end: end === undefined ? Number(start) : Number(end),
    })

    res.json({ data: passage })
  } catch (error) {
    res.status(error instanceof BibleError ? error.status : 500).json({
      message:
        error instanceof BibleError
          ? error.message
          : 'Pencarian ayat belum berhasil.',
    })
  }
})

export default bibleRouter