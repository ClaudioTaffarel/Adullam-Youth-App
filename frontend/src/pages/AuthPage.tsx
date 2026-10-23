import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'

import { useAuth } from '../context/auth-context'
import { useProfile } from '../context/profile-context'
import { supabase } from '../lib/supabase'
import AccountInfo from '../components/AccountInfo'
import AuthArtwork from '../components/AuthArtwork'

function AuthPage() {
  const { session, isChecking, logout } = useAuth()
  const { profile } = useProfile()

  const [mode, setMode] = useState<'login' | 'signup'>('login')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const isSignup = mode === 'signup'
  const displayName = profile?.display_name.trim() || 'teman'

  function changeMode() {
    setMode((current) => (current === 'login' ? 'signup' : 'login'))
    setError(null)
    setMessage(null)
    setPassword('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) return

    setError(null)
    setMessage(null)

    const cleanName = name.trim()
    const cleanPhone = phone.replace(/[\s()-]/g, '')

    if (
      isSignup &&
      (cleanName.length < 2 || cleanName.length > 80)
    ) {
      setError('Nama harus terdiri dari 2 sampai 80 karakter.')
      return
    }

    if (isSignup && !/^\+?[0-9]{8,15}$/.test(cleanPhone)) {
      setError('Isi nomor telepon yang valid, misalnya 081234567890.')
      return
    }

    setIsSubmitting(true)

    try {
      if (isSignup) {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: cleanName,
              phone_number: cleanPhone,
            },
            emailRedirectTo: `${window.location.origin}/login`,
          },
        })

        if (authError) throw authError

        setPassword('')

        if (!data.session) {
          setMessage(
            'Cek email untuk melanjutkan pendaftaran. ' +
              'Jika akun sudah terdaftar, gunakan menu Masuk.',
          )
        }
      } else {
        const { error: authError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          })

        if (authError) throw authError

        setPassword('')
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Belum berhasil terhubung. Coba lagi sebentar.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLogout() {
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      await logout()

      setPassword('')
      setMessage('Kamu sudah keluar dari akun.')
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Logout belum berhasil. Coba lagi.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <p className="eyebrow">ADULLAM YOUTH / YOUR LITTLE HOME</p>

        <h1>
          Ceritamu
          <br />
          <span>punya tempat.</span>
        </h1>

        <p>Berbagi cerita, mengenal Tuhan, dan bertumbuh bersama.</p>

        <span className="auth-sticker">#SemuaOrangDiterima</span>

        <AuthArtwork />
      </section>

      <section className="auth-card" aria-labelledby="auth-card-title">
        {isChecking ? (
          <>
            <h2 id="auth-card-title">Sebentar, ya.</h2>
            <p role="status">Sedang memeriksa sesi login...</p>
          </>
        ) : session ? (
          <>
            <p className="eyebrow">YOU’RE IN!</p>

            <h2 id="auth-card-title">
              Halo, {displayName}!
            </h2>

            <AccountInfo key={session.user.id} />

            {error && (
              <p className="auth-message auth-error" role="alert">
                {error}
              </p>
            )}

            <div className="auth-actions">
              <Link className="button" to="/">
                Kembali ke Home
              </Link>

              <button
                type="button"
                className="auth-switch"
                disabled={isSubmitting}
                onClick={handleLogout}
              >
                {isSubmitting ? 'Sedang keluar...' : 'Keluar dari akun'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow">
              {isSignup ? 'MAKE YOURSELF AT HOME' : 'GOOD TO SEE YOU AGAIN'}
            </p>

            <h2 id="auth-card-title">
              {isSignup ? 'Kenalan dulu, yuk.' : 'Selamat datang lagi.'}
            </h2>

            <p className="auth-description">
              {isSignup
                ? 'Buat akun untuk bergabung bersama kita.'
                : 'Masuk menggunakan email dan password kamu.'}
            </p>

            <form onSubmit={handleSubmit}>
              <fieldset className="auth-fields" disabled={isSubmitting}>
                {isSignup && (
                  <>
                    <div className="auth-field">
                      <label htmlFor="auth-name">Nama</label>

                      <input
                        id="auth-name"
                        type="text"
                        autoComplete="name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        minLength={2}
                        maxLength={80}
                        required
                      />
                    </div>

                    <div className="auth-field">
                      <label htmlFor="auth-phone">Nomor telepon</label>

                      <input
                        id="auth-phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="081234567890"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        maxLength={20}
                        required
                      />
                    </div>
                  </>
                )}

                <div className="auth-field">
                  <label htmlFor="auth-email">Email</label>

                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="auth-password">Password</label>

                  <input
                    id="auth-password"
                    type="password"
                    autoComplete={
                      isSignup ? 'new-password' : 'current-password'
                    }
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={isSignup ? 8 : undefined}
                    required
                  />

                  {isSignup && <small>Gunakan minimal 8 karakter.</small>}
                </div>

                {error && (
                  <p className="auth-message auth-error" role="alert">
                    {error}
                  </p>
                )}

                {message && (
                  <p className="auth-message auth-success" role="status">
                    {message}
                  </p>
                )}

                <button className="button auth-submit" type="submit">
                  {isSubmitting
                    ? 'Sedang diproses...'
                    : isSignup
                      ? 'Buat akun'
                      : 'Masuk'}
                </button>
              </fieldset>
            </form>

            {!isSignup && (
              <p className="forgot-password-link">
                <Link className="auth-switch" to="/forgot-password">
                  Lupa password?
                </Link>
              </p>
            )}
            
            <p className="auth-bottom">
              {isSignup ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
              <button
                type="button"
                className="auth-switch"
                onClick={changeMode}
                disabled={isSubmitting}
              >
                {isSignup ? 'Masuk' : 'Daftar dulu'}
              </button>
            </p>
          </>
        )}
      </section>
    </main>
  )
}

export default AuthPage