import { supabase } from '../lib/supabase'

export const websitePhotoSlots = [
  'hero_1',
  'hero_2',
  'hero_3',
  'hero_4',
  'hero_5',
  'hero_6',
  'about',
] as const

export type WebsitePhotoSlot = (typeof websitePhotoSlots)[number]
export type WebsitePhotos = Record<WebsitePhotoSlot, string>

export const defaultWebsitePhotos: WebsitePhotos = {
  hero_1: '/images/memories/1.webp',
  hero_2: '/images/memories/2.webp',
  hero_3: '/images/memories/3.webp',
  hero_4: '/images/memories/4.webp',
  hero_5: '/images/memories/5.webp',
  hero_6: '/images/memories/6.webp',
  about: '/images/memories/1.webp',
}

function getApiUrl() {
  const url = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

  if (!url) throw new Error('Alamat backend belum dikonfigurasi.')

  return url
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPhotoSlot(value: unknown): value is WebsitePhotoSlot {
  return (
    typeof value === 'string' &&
    websitePhotoSlots.some((slot) => slot === value)
  )
}

export async function getWebsitePhotos(
  signal?: AbortSignal,
): Promise<WebsitePhotos> {
  const response = await fetch(`${getApiUrl()}/api/website-photos`, {
    cache: 'no-store',
    signal,
  })

  if (!response.ok) {
    throw new Error('Foto website belum berhasil dimuat.')
  }

  const payload: unknown = await response.json()

  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    throw new Error('Format foto website belum sesuai.')
  }

  const photos = { ...defaultWebsitePhotos }
  const foundSlots = new Set<WebsitePhotoSlot>()

  for (const item of payload.data) {
    if (
      !isRecord(item) ||
      !isPhotoSlot(item.slot) ||
      typeof item.image_url !== 'string' ||
      !item.image_url.trim() ||
      foundSlots.has(item.slot)
    ) {
      throw new Error('Data slot foto website tidak valid.')
    }

    photos[item.slot] = item.image_url
    foundSlots.add(item.slot)
  }

  if (foundSlots.size !== websitePhotoSlots.length) {
    throw new Error('Slot foto belum lengkap. Pastikan SQL 011 sudah dijalankan.')
  }

  return photos
}

export async function uploadWebsitePhoto(
  slot: WebsitePhotoSlot,
  file: File,
): Promise<string> {
  const apiUrl = getApiUrl()

  const { data, error } = await supabase.auth.getSession()

  if (error) throw error

  if (!data.session) {
    throw new Error('Sesi login berakhir. Silakan masuk kembali.')
  }

  const formData = new FormData()
  formData.append('photo', file)

  let response: Response

  try {
    response = await fetch(
      `${apiUrl}/api/admin/website-photos/${slot}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: formData,
        signal: AbortSignal.timeout(60_000),
      },
    )
  } catch {
    throw new Error(
      'Respons belum diterima. Muat ulang halaman untuk memeriksa hasilnya sebelum mencoba lagi.',
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
        : 'Foto belum berhasil disimpan.',
    )
  }

  if (
    !isRecord(payload) ||
    !isRecord(payload.data) ||
    payload.data.slot !== slot ||
    typeof payload.data.image_url !== 'string' ||
    !payload.data.image_url.trim()
  ) {
    throw new Error(
      'Respons server tidak lengkap. Muat ulang halaman untuk memeriksa hasilnya.',
    )
  }

  return payload.data.image_url
}