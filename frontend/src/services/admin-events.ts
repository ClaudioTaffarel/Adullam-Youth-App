import { supabase } from '../lib/supabase'

export type EventStatusFilter = 'all' | 'published' | 'draft'

export type AdminEvent = {
  id: number
  title: string
  category: string
  image: string
  description: string
  is_published: boolean
  created_at: string
}

type AdminEventsResponse = {
  data: AdminEvent[]
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

function isAdminEvent(value: unknown): value is AdminEvent {
  if (!isRecord(value)) return false

  return (
    typeof value.id === 'number' &&
    Number.isSafeInteger(value.id) &&
    typeof value.title === 'string' &&
    typeof value.category === 'string' &&
    typeof value.image === 'string' &&
    typeof value.description === 'string' &&
    typeof value.is_published === 'boolean' &&
    typeof value.created_at === 'string' &&
    Number.isFinite(Date.parse(value.created_at))
  )
}

export async function getAdminEvents({
  accessToken,
  page,
  status,
  signal,
}: {
  accessToken: string
  page: number
  status: EventStatusFilter
  signal?: AbortSignal
}): Promise<AdminEventsResponse> {
  const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

  if (!apiUrl) {
    throw new Error('Alamat backend belum dikonfigurasi.')
  }

  const params = new URLSearchParams({
    page: String(page),
    status,
  })

  const response = await fetch(`${apiUrl}/api/admin/events?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
    signal,
  })

  if (response.status === 401) {
    throw new Error('Sesi login berakhir. Silakan masuk kembali.')
  }

  if (response.status === 403) {
    throw new Error('Akun ini tidak memiliki akses admin.')
  }

  if (!response.ok) {
    throw new Error('Daftar event belum berhasil dimuat.')
  }

  const payload: unknown = await response.json()

  if (
    !isRecord(payload) ||
    !Array.isArray(payload.data) ||
    !payload.data.every(isAdminEvent) ||
    !isRecord(payload.pagination)
  ) {
    throw new Error('Format daftar event dari server belum sesuai.')
  }

  const pagination = payload.pagination

  if (
    !isCount(pagination.page) ||
    pagination.page < 1 ||
    !isCount(pagination.page_size) ||
    pagination.page_size < 1 ||
    !isCount(pagination.total) ||
    !isCount(pagination.total_pages)
  ) {
    throw new Error('Format pagination dari server belum sesuai.')
  }

  return {
    data: payload.data,
    pagination: {
      page: pagination.page,
      page_size: pagination.page_size,
      total: pagination.total,
      total_pages: pagination.total_pages,
    },
  }
}

export type CreateAdminEventInput = {
  title: string
  category: string
  description: string
  is_published: boolean
  cover: File
}

export async function createAdminEvent(
  input: CreateAdminEventInput,
): Promise<AdminEvent> {
  const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

  if (!apiUrl) {
    throw new Error('Alamat backend belum dikonfigurasi.')
  }

  const { data, error } = await supabase.auth.getSession()

  if (error) throw error

  if (!data.session) {
    throw new Error('Sesi login berakhir. Silakan masuk kembali.')
  }

  const formData = new FormData()

  formData.append('title', input.title)
  formData.append('category', input.category)
  formData.append('description', input.description)
  formData.append('is_published', String(input.is_published))
  formData.append('cover', input.cover)

  let response: Response

  try {
    response = await fetch(`${apiUrl}/api/admin/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
      },
      body: formData,
    })
  } catch {
    throw new Error(
      'Koneksi terputus. Periksa daftar event sebelum mengirim ulang, karena event mungkin sudah tersimpan.',
    )
  }

  if (response.status === 401) {
    throw new Error('Sesi login berakhir. Silakan masuk kembali.')
  }

  if (response.status === 403) {
    throw new Error('Akun ini tidak memiliki akses admin.')
  }

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      isRecord(payload) && typeof payload.message === 'string'
        ? payload.message
        : 'Event belum berhasil disimpan.',
    )
  }

  if (!isRecord(payload) || !isAdminEvent(payload.data)) {
    throw new Error(
      'Respons server tidak lengkap. Periksa daftar event sebelum mengirim ulang.',
    )
  }

  return payload.data
}

export type UpdateAdminEventInput =
  Omit<CreateAdminEventInput, 'cover'> & {
    cover: File | null
  }

async function requestSingleAdminEvent(
  id: number,
  method: 'GET' | 'PATCH',
  input?: UpdateAdminEventInput,
  signal?: AbortSignal,
): Promise<AdminEvent> {
  const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

  if (!apiUrl) {
    throw new Error('Alamat backend belum dikonfigurasi.')
  }

  const { data, error } = await supabase.auth.getSession()

  if (error) throw error

  if (!data.session) {
    throw new Error('Sesi login berakhir. Silakan masuk kembali.')
  }

  let body: FormData | undefined

  if (input) {
    body = new FormData()
    body.append('title', input.title)
    body.append('category', input.category)
    body.append('description', input.description)
    body.append('is_published', String(input.is_published))

    if (input.cover) {
      body.append('cover', input.cover)
    }
  }

  let response: Response

  try {
    response = await fetch(`${apiUrl}/api/admin/events/${id}`, {
      method,
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
      },
      body,
      signal,
      cache: 'no-store',
    })
  } catch (error) {
    if (method === 'GET') throw error

    throw new Error(
      'Koneksi terputus. Periksa kembali event untuk memastikan apakah perubahan sudah tersimpan.',
    )
  }

  if (response.status === 401) {
    throw new Error('Sesi login berakhir. Silakan masuk kembali.')
  }

  if (response.status === 403) {
    throw new Error('Akun ini tidak memiliki akses admin.')
  }

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      isRecord(payload) && typeof payload.message === 'string'
        ? payload.message
        : 'Permintaan event belum berhasil.',
    )
  }

  if (!isRecord(payload) || !isAdminEvent(payload.data)) {
    throw new Error(
      method === 'PATCH'
        ? 'Respons server tidak lengkap. Periksa kembali event sebelum mengirim ulang.'
        : 'Format detail event belum sesuai.',
    )
  }

  return payload.data
}

export function getAdminEvent(id: number, signal?: AbortSignal) {
  return requestSingleAdminEvent(id, 'GET', undefined, signal)
}

export function updateAdminEvent(
  id: number,
  input: UpdateAdminEventInput,
) {
  return requestSingleAdminEvent(id, 'PATCH', input)
}

export async function deleteAdminEvent(id: number): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

  if (!apiUrl) {
    throw new Error('Alamat backend belum dikonfigurasi.')
  }

  const { data, error } = await supabase.auth.getSession()

  if (error) throw error

  if (!data.session) {
    throw new Error('Sesi login berakhir. Silakan masuk kembali.')
  }

  let response: Response

  try {
    response = await fetch(`${apiUrl}/api/admin/events/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
      },
      signal: AbortSignal.timeout(20_000),
    })
  } catch {
    throw new Error(
      'Respons server belum diterima. Kamu bisa mencoba lagi, atau tutup popup dan perbarui daftar untuk memeriksa hasilnya.',
    )
  }

  if (response.status === 401) {
    throw new Error('Sesi login berakhir. Silakan masuk kembali.')
  }

  if (response.status === 403) {
    throw new Error('Akun ini tidak memiliki akses admin.')
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null)

    throw new Error(
      isRecord(payload) && typeof payload.message === 'string'
        ? payload.message
        : 'Event belum berhasil dihapus.',
    )
  }
}