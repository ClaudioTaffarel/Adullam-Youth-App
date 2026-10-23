import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/auth-context'
import ChangePassword from '../components/ChangePassword'
import AuthLayout from '../components/AuthLayout'

function ResetPasswordPage() {
  const { session, isChecking } = useAuth()
  const navigate = useNavigate()

  return (
    <AuthLayout>
        <p className="eyebrow">A FRESH START</p>

        <h2 id="auth-card-title">Buat password baru.</h2>

        {isChecking ? (
          <p role="status">Sedang memeriksa sesi pemulihan...</p>
        ) : session ? (
          <ChangePassword
            key={session.user.id}
            onBack={() => navigate('/login', { replace: true })}
          />
        ) : (
          <>
            <p className="auth-message auth-error" role="alert">
              Sesi pemulihan belum tersedia. Buka tautan dari email.
              Jika tautannya kedaluwarsa atau sudah digunakan,
              minta tautan baru.
            </p>

            <div className="auth-actions">
              <Link className="button" to="/forgot-password">
                Minta link baru
              </Link>

              <Link className="auth-switch" to="/login">
                Kembali ke login
              </Link>
            </div>
          </>
        )}
      </AuthLayout>
  )
}

export default ResetPasswordPage