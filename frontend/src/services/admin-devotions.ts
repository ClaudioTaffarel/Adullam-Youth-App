import { supabase } from '../lib/supabase'

export type DevotionFilterStatus = 'all' | 'visible' | 'hidden'

export type AdminDevotion = {
  id: string
  author_name: string
  book: string
  chapter: number
  verse_start: number
  verse_end: number | null
  reflection: string
  created_at: string
  devotion_date: string
  is_hidden: boolean
}

export type AdminDevotionsResponse = {
  data: AdminDevotion[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCount(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 0
  )
}

function isDevotion(value: unknown): value is AdminDevotion {
  if (!isRecord(value)) return false

  return (
    typeof value.id === 'string' &&
    typeof value.author_name === 'string' &&
    typeof value.book === 'string' &&
    isCount(value.chapter) &&
    value.chapter > 0 &&
    isCount(value.verse_start) &&
    value.verse_start > 0 &&
    (value.verse_end === null ||
      (isCount(value.verse_end) && value.verse_end >= value.verse_start)) &&
    typeof value.reflection === 'string' &&
    typeof value.created_at === 'string' &&
    Number.isFinite(Date.parse(value.created_at)) &&
    typeof value.devotion_date === 'string' &&
    typeof value.is_hidden === 'boolean'
  )
}

async function request(
  path: string,
  options: RequestInit = {},
): Promise<unknown> {
  const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

  if (!apiUrl) throw new Error('Alamat backend belum dikonfigurasi.')

  const { data, error } = await supabase.auth.getSession()

  if (error) throw error
  if (!data.session) throw new Error('Silakan login kembali.')

  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${data.session.access_token}`)

  const response = await fetch(`${apiUrl}/api/admin/devotions${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  })

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      isRecord(payload) && typeof payload.message === 'string'
        ? payload.message
        : 'Permintaan renungan belum berhasil.',
    )
  }

  return payload
}

export async function getAdminDevotions(
  filters: {
    page: number
    search: string
    date: string
    status: DevotionFilterStatus
  },
  signal?: AbortSignal,
): Promise<AdminDevotionsResponse> {
  const params = new URLSearchParams({
    page: String(filters.page),
    search: filters.search,
    date: filters.date,
    status: filters.status,
  })

  const payload = await request(`?${params}`, { signal })

  if (
    !isRecord(payload) ||
    !Array.isArray(payload.data) ||
    !payload.data.every(isDevotion) ||
    !isRecord(payload.pagination)
  ) {
    throw new Error('Format daftar renungan belum sesuai.')
  }

  const p = payload.pagination

  if (
    !isCount(p.page) ||
    p.page < 1 ||
    !isCount(p.page_size) ||
    p.page_size < 1 ||
    !isCount(p.total) ||
    !isCount(p.total_pages)
  ) {
    throw new Error('Format pagination belum sesuai.')
  }

  return {
    data: payload.data,
    pagination: {
      page: p.page,
      page_size: p.page_size,
      total: p.total,
      total_pages: p.total_pages,
    },
  }
}

export async function setDevotionVisibility(
  id: string,
  isHidden: boolean,
): Promise<void> {
  const payload = await request(`/${id}/visibility`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_hidden: isHidden }),
    signal: AbortSignal.timeout(20_000),
  })

  if (
    !isRecord(payload) ||
    !isRecord(payload.data) ||
    payload.data.id !== id ||
    payload.data.is_hidden !== isHidden
  ) {
    throw new Error('Respons tidak lengkap. Perbarui daftar renungan.')
  }
}