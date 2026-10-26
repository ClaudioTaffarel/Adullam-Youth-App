import { supabase } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

export type BiblePassage = {
  translation: string
  reference: string
  book: string
  chapter: number
  verse_start: number
  verse_end: number
  verses: {
    verse: number
    text: string
  }[]
  source: string
  attribution: string
}

export type PassageInput = {
  book: string
  chapter: number
  verse_start: number
  verse_end: number
}

export async function getBiblePassage(
  input: PassageInput,
  signal?: AbortSignal,
): Promise<BiblePassage> {
  if (!API_URL) {
    throw new Error('Alamat API belum dikonfigurasi.')
  }

  const { data, error } = await supabase.auth.getSession()

  if (error) throw error

  if (!data.session) {
    throw new Error('Sesi login berakhir. Silakan login kembali.')
  }

  const params = new URLSearchParams({
    book: input.book,
    chapter: String(input.chapter),
    verse_start: String(input.verse_start),
    verse_end: String(input.verse_end),
  })

  const response = await fetch(
    `${API_URL}/api/bible/passage?${params.toString()}`,
    {
      signal,
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
      },
    },
  )

  if (!response.ok) {
    const body = await response.json().catch(() => null)

    throw new Error(
      typeof body?.message === 'string'
        ? body.message
        : 'Teks ayat belum berhasil dimuat.',
    )
  }

  const body: { data: BiblePassage } = await response.json()

  return body.data
}