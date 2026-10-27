export type AdminDashboardStats = {
  registered_members: number
  devotions_today: number
  authors_today: number
  published_events: number
  today: string
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

function isDashboardStats(value: unknown): value is AdminDashboardStats {
  if (!isRecord(value)) return false

  return (
    isCount(value.registered_members) &&
    isCount(value.devotions_today) &&
    isCount(value.authors_today) &&
    isCount(value.published_events) &&
    typeof value.today === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.today)
  )
}

export async function getAdminDashboardStats(
  accessToken: string,
  signal?: AbortSignal,
): Promise<AdminDashboardStats> {
  const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

  if (!apiUrl) {
    throw new Error('Alamat backend belum dikonfigurasi.')
  }

  const response = await fetch(`${apiUrl}/api/admin/stats`, {
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
    throw new Error('Statistik belum berhasil dimuat. Coba lagi sebentar.')
  }

  const payload: unknown = await response.json()

  if (!isRecord(payload) || !isDashboardStats(payload.data)) {
    throw new Error('Format statistik dari server belum sesuai.')
  }

  return payload.data
}