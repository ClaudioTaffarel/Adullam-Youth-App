import type { EventsResponse } from '../types/event'
import { supabase } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

export async function getEvents(
  signal?: AbortSignal,
): Promise<EventsResponse> {
  if (!API_URL) {
    throw new Error('Alamat API belum dikonfigurasi.')
  }

  const response = await fetch(`${API_URL}/api/events`, {
    signal,
  })

  if (!response.ok) {
    throw new Error(`Gagal mengambil events. Status: ${response.status}`)
  }

  const result: EventsResponse = await response.json()

  return result
}

export type AccountResponse = {
  data: {
    id: string
    email: string | null
    name: string
  }
}

export async function getMyAccount(
  signal?: AbortSignal,
): Promise<AccountResponse> {
  if (!API_URL) {
    throw new Error('Alamat API belum dikonfigurasi.')
  }

  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw new Error('Sesi login belum berhasil dibaca.')
  }

  if (!data.session) {
    throw new Error('Silakan login terlebih dahulu.')
  }

  const response = await fetch(`${API_URL}/api/me`, {
    signal,
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Sesi tidak valid. Silakan keluar lalu login lagi.')
    }

    throw new Error('Informasi akun belum berhasil dimuat. Coba lagi.')
  }

  const result: AccountResponse = await response.json()

  return result
}

export type Profile = {
  id: string
  display_name: string
  phone_number: string | null
  avatar_path: string | null
  email: string | null
  created_at: string
}

type ProfileResponse = {
  data: Profile
  message?: string
}

type ProfileInput = {
  display_name: string
  phone_number: string
}

async function requestProfile(
  method: 'GET' | 'PATCH',
  input?: ProfileInput,
  signal?: AbortSignal,
): Promise<Profile> {
  if (!API_URL) {
    throw new Error('Alamat API belum dikonfigurasi.')
  }

  const { data, error } = await supabase.auth.getSession()

  if (error) throw error

  if (!data.session) {
    throw new Error('Silakan login terlebih dahulu.')
  }

  const response = await fetch(`${API_URL}/api/profile`, {
    method,
    signal,
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      ...(input ? { 'Content-Type': 'application/json' } : {}),
    },
    body: input ? JSON.stringify(input) : undefined,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)

    throw new Error(
      typeof body?.message === 'string'
        ? body.message
        : 'Permintaan profil belum berhasil.',
    )
  }

  const body: ProfileResponse = await response.json()

  return body.data
}

export function getMyProfile(signal?: AbortSignal) {
  return requestProfile('GET', undefined, signal)
}

export function updateMyProfile(input: ProfileInput) {
  return requestProfile('PATCH', input)
}

export async function uploadMyAvatar(file: File): Promise<Profile> {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }

  const extension = extensions[file.type]

  if (!extension) {
    throw new Error('Gunakan foto JPG, PNG, atau WebP.')
  }

  if (file.size === 0 || file.size > 2 * 1024 * 1024) {
    throw new Error('Ukuran foto harus lebih dari 0 dan maksimal 2 MB.')
  }

  if (!API_URL) {
    throw new Error('Alamat API belum dikonfigurasi.')
  }

  const { data, error } = await supabase.auth.getSession()

  if (error) throw error

  const session = data.session

  if (!session) {
    throw new Error('Silakan login terlebih dahulu.')
  }

  // Setiap foto mendapatkan nama unik.
  const avatarPath =
    `${session.user.id}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(avatarPath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Upload belum berhasil: ${uploadError.message}`)
  }

  // Ambil sesi lagi untuk memastikan pengguna masih sama.
  const { data: latestData, error: sessionError } =
    await supabase.auth.getSession()

  if (sessionError) throw sessionError

  const latestSession = latestData.session

  if (!latestSession || latestSession.user.id !== session.user.id) {
    throw new Error('Sesi akun berubah. Silakan masuk kembali.')
  }

  const response = await fetch(`${API_URL}/api/profile/avatar`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${latestSession.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      avatar_path: avatarPath,
    }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)

    throw new Error(
      typeof body?.message === 'string'
        ? body.message
        : 'Foto sudah di-upload, tetapi profil belum berhasil diperbarui.',
    )
  }

  const body: ProfileResponse = await response.json()

  return body.data
}