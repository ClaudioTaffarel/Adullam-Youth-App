import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { useAuth } from '../context/auth-context'

type AdminRouteProps = {
  children: ReactNode
}

type AccessResult = {
  requestKey: string
  status: 'allowed' | 'forbidden' | 'unauthorized' | 'error'
}

function AdminRoute({ children }: AdminRouteProps) {
  const { session, isChecking } = useAuth()
  const location = useLocation()

  if (isChecking) {
    return (
      <main className="admin-access" role="status">
        Memeriksa sesi login...
      </main>
    )
  }

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return (
    <AdminAccess
      key={session.user.id}
      accessToken={session.access_token}
    >
      {children}
    </AdminAccess>
  )
}

function AdminAccess({
  accessToken,
  children,
}: AdminRouteProps & { accessToken: string }) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<AccessResult | null>(null)

  const requestKey = `${accessToken}:${attempt}`

  useEffect(() => {
    const controller = new AbortController()

    async function checkAccess() {
      try {
        const apiUrl =
          import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

        if (!apiUrl) {
          throw new Error('VITE_API_URL belum diatur.')
        }

        const response = await fetch(`${apiUrl}/api/admin/check`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: 'no-store',
          signal: controller.signal,
        })

        let status: AccessResult['status']

        if (response.status === 401) {
          status = 'unauthorized'
        } else if (response.status === 403) {
          status = 'forbidden'
        } else if (!response.ok) {
          throw new Error('Pemeriksaan akses gagal.')
        } else {
          const body = await response.json()

          if (body?.data?.role !== 'admin') {
            throw new Error('Respons akses tidak sesuai.')
          }

          status = 'allowed'
        }

        if (!controller.signal.aborted) {
          setResult({ requestKey, status })
        }
      } catch {
        if (!controller.signal.aborted) {
          setResult({ requestKey, status: 'error' })
        }
      }
    }

    void checkAccess()

    return () => {
      controller.abort()
    }
  }, [accessToken, requestKey])

  // Hasil dari token/request sebelumnya tidak dipakai.
  if (!result || result.requestKey !== requestKey) {
    return (
      <main className="admin-access" role="status">
        Memeriksa akses admin...
      </main>
    )
  }

  if (result.status === 'allowed') {
    return <>{children}</>
  }

  if (result.status === 'unauthorized') {
    return (
      <main className="admin-access">
        <p className="eyebrow">SESSION EXPIRED</p>
        <h1>Masuk kembali, ya.</h1>
        <p>Sesi kamu belum bisa digunakan untuk mengakses dashboard.</p>

        <Link className="button" to="/login">
          Buka halaman akun
        </Link>
      </main>
    )
  }

  if (result.status === 'forbidden') {
    return (
      <main className="admin-access">
        <p className="eyebrow">403 / ADMIN ONLY</p>
        <h1>Area pengelola komunitas.</h1>
        <p>Akun kamu belum memiliki akses admin.</p>

        <Link className="button" to="/">
          Kembali ke Home
        </Link>
      </main>
    )
  }

  return (
    <main className="admin-access">
      <h1>Belum bisa terhubung.</h1>
      <p role="alert">
        Akses admin belum berhasil diperiksa. Coba lagi sebentar.
      </p>

      <button
        type="button"
        className="button"
        onClick={() => setAttempt((current) => current + 1)}
      >
        Coba lagi
      </button>
    </main>
  )
}

export default AdminRoute