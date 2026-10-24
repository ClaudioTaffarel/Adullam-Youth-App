import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../context/auth-context'

type ProtectedRouteProps = {
  children: ReactNode
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, isChecking } = useAuth()
  const location = useLocation()

  if (isChecking) {
    return (
      <main className="member-loading">
        <p role="status">Sebentar, sedang memeriksa sesi kamu...</p>
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

  return children
}

export default ProtectedRoute