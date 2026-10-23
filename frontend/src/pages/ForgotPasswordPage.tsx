import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { supabase } from '../lib/supabase'
import AuthLayout from '../components/AuthLayout'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const { error: authError } =
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        })

      if (authError) throw authError

      setIsSent(true)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Permintaan belum berhasil. Coba lagi sebentar.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
        <p className="eyebrow">LET’S GET YOU BACK IN</p>

        <h2 id="auth-card-title">Lupa password?</h2>

        {isSent ? (
          <div className="auth-message auth-success" role="status">
            Jika email tersebut terdaftar, kamu akan menerima tautan
            untuk mengatur ulang password. Cek inbox dan folder spam, ya.
          </div>
        ) : (
          <>
            <p className="auth-description">
              Masukkan email akunmu untuk meminta tautan pemulihan.
            </p>

            <form onSubmit={handleSubmit}>
              <fieldset className="auth-fields" disabled={isSubmitting}>
                <div className="auth-field">
                  <label htmlFor="recovery-email">Email</label>

                  <input
                    id="recovery-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Email yang kamu pakai saat daftar"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>

                {error && (
                  <p className="auth-message auth-error" role="alert">
                    {error}
                  </p>
                )}

                <button type="submit" className="button auth-submit">
                  {isSubmitting ? 'Mengirim...' : 'Kirim link pemulihan'}
                </button>
              </fieldset>
            </form>
          </>
        )}

        <div className="auth-actions">
          <Link className="auth-switch" to="/login">
            ← Kembali ke login
          </Link>
        </div>
      </AuthLayout>
  )
}

export default ForgotPasswordPage