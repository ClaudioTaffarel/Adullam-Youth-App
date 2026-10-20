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