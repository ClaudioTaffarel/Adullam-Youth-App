import { supabase } from '../lib/supabase'

export type AdminMember = {
  id: string
  display_name: string
  email: string | null
  phone_number: string | null
  role: 'member' | 'admin'
  is_active: boolean
  created_at: string
}

export type AdminMembersResponse = {
  data: AdminMember[]
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

function isMember(value: unknown): value is AdminMember {
  if (!isRecord(value)) return false

  return (
    typeof value.is_active === 'boolean' &&
    typeof value.id === 'string' &&
    typeof value.display_name === 'string' &&
    (value.email === null || typeof value.email === 'string') &&
    (value.phone_number === null ||
      typeof value.phone_number === 'string') &&
    (value.role === 'member' || value.role === 'admin') &&
    typeof value.created_at === 'string' &&
    Number.isFinite(Date.parse(value.created_at))
    
  )
}

export async function getAdminMembers({
  page,
  search,
  signal,
}: {
  page: number
  search: string
  signal?: AbortSignal
}): Promise<AdminMembersResponse> {
  const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

  if (!apiUrl) {
    throw new Error('Alamat backend belum dikonfigurasi.')
  }

  const { data, error } = await supabase.auth.getSession()

  if (error) throw error

  if (!data.session) {
    throw new Error('Sesi login berakhir. Silakan masuk kembali.')
  }

  const params = new URLSearchParams({
    page: String(page),
    search,
  })

  const response = await fetch(
    `${apiUrl}/api/admin/members?${params}`,
    {
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
      },
      cache: 'no-store',
      signal,
    },
  )

  if (response.status === 401) {
    throw new Error('Sesi login berakhir. Silakan masuk kembali.')
  }

  if (response.status === 403) {
    throw new Error('Akun ini tidak memiliki akses admin.')
  }

  if (!response.ok) {
    throw new Error('Daftar anggota belum berhasil dimuat.')
  }

  const payload: unknown = await response.json()

  if (
    !isRecord(payload) ||
    !Array.isArray(payload.data) ||
    !payload.data.every(isMember) ||
    !isRecord(payload.pagination)
  ) {
    throw new Error('Format daftar anggota belum sesuai.')
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
    throw new Error('Format pagination belum sesuai.')
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

export async function setAdminMemberStatus(
  id: string,
  isActive: boolean,
): Promise<void> {
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
    response = await fetch(`${apiUrl}/api/admin/members/${id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_active: isActive }),
      signal: AbortSignal.timeout(20_000),
    })
  } catch {
    throw new Error(
      'Respons belum diterima. Tutup popup dan perbarui daftar untuk memeriksa status akun.',
    )
  }

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      isRecord(payload) && typeof payload.message === 'string'
        ? payload.message
        : 'Status akun belum berhasil diubah.',
    )
  }

  if (
    !isRecord(payload) ||
    !isRecord(payload.data) ||
    payload.data.id !== id ||
    payload.data.is_active !== isActive
  ) {
    throw new Error(
      'Respons tidak lengkap. Perbarui daftar untuk memeriksa status akun.',
    )
  }
}