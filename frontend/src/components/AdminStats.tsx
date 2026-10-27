import { useEffect, useState } from 'react'
import { useAuth } from '../context/auth-context'
import { getAdminDashboardStats } from '../services/admin'
import type { AdminDashboardStats } from '../services/admin'

const statisticItems = [
  {
    key: 'registered_members',
    label: 'Anggota terdaftar',
    detail: 'Semua akun, termasuk admin',
  },
  {
    key: 'devotions_today',
    label: 'Renungan hari ini',
    detail: 'Mengikuti waktu WIB',
  },
  {
    key: 'authors_today',
    label: 'Penulis hari ini',
    detail: 'Anggota yang berbagi renungan',
  },
  {
    key: 'published_events',
    label: 'Event terpublikasi',
    detail: 'Event berstatus terpublikasi di database',
  },
] as const

const numberFormatter = new Intl.NumberFormat('id-ID')

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00+07:00`))
}

function AdminStats() {
  const { session, isChecking } = useAuth()

  if (isChecking) {
    return <p role="status">Memeriksa sesi login...</p>
  }

  if (!session) return null

  return (
    <AdminStatsContent
      key={`${session.user.id}:${session.access_token}`}
      accessToken={session.access_token}
    />
  )
}

function AdminStatsContent({ accessToken }: { accessToken: string }) {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    // Batasi waktu tunggu supaya loading tidak berjalan selamanya.
    const timeoutId = window.setTimeout(() => {
      controller.abort()
    }, 15_000)

    let isActive = true

    async function loadStats() {
      setIsLoading(true)
      setError(null)
      setStats(null)

      try {
        const data = await getAdminDashboardStats(
          accessToken,
          controller.signal,
        )

        if (isActive) {
          setStats(data)
        }
      } catch (error) {
        if (!isActive) return

        setError(
          controller.signal.aborted
            ? 'Server terlalu lama merespons. Coba lagi, ya.'
            : error instanceof Error
              ? error.message
              : 'Belum berhasil terhubung ke server.',
        )
      } finally {
        window.clearTimeout(timeoutId)

        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadStats()

    return () => {
      isActive = false
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [accessToken, reloadKey])

  return (
    <section aria-labelledby="admin-overview-title">
      <div className="ay-admin-section-heading">
        <h2 id="admin-overview-title">Sekilas komunitas</h2>

        <button
          type="button"
          className="ay-admin-refresh"
          disabled={isLoading}
          onClick={() => setReloadKey((value) => value + 1)}
        >
          {isLoading ? 'Memuat...' : error ? 'Coba lagi' : 'Perbarui'}
        </button>
      </div>

      {error && (
        <p className="ay-admin-stats-error" role="alert">
          {error}
        </p>
      )}

      <div className="ay-admin-stats" aria-busy={isLoading}>
        {statisticItems.map((item) => (
          <article className="ay-admin-stat" key={item.key}>
            <h3>{item.label}</h3>

            <strong
              className={stats ? 'ay-admin-stat-value' : undefined}
              aria-label={stats ? undefined : 'Data belum tersedia'}
            >
              {stats ? numberFormatter.format(stats[item.key]) : '—'}
            </strong>

            <p>{item.detail}</p>
          </article>
        ))}
      </div>

      <p className="ay-admin-stats-caption" role="status">
        {isLoading
          ? 'Mengambil statistik komunitas...'
          : stats
            ? `Data diambil untuk ${formatDate(stats.today)} WIB. Tekan Perbarui untuk mengambil data terbaru.`
            : 'Statistik belum tersedia.'}
      </p>
    </section>
  )
}

export default AdminStats