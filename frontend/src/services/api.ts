import type { EventsResponse } from '../types/event'

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