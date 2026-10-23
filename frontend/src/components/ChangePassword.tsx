import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'

type ChangePasswordProps = {
  onBack: () => void
}

function ChangePassword({ onBack }: ChangePasswordProps) {
  const formId = useId()

  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSaving) return

    setError(null)

    if (password.length < 8) {
      setError('Gunakan password minimal 8 karakter.')
      return
    }

    if (password !== confirmation) {
      setError('Konfirmasi password belum sama.')
      return
    }

    setIsSaving(true)

    try {
      const { error: authError } = await supabase.auth.updateUser({
        password,
      })

      if (authError) {
        if (
          authError.code === 'reauthentication_needed' ||
          authError.code === 'session_not_found'
        ) {
          throw new Error(
            'Silakan keluar lalu login kembali sebelum mengganti password.',
          )
        }

        if (authError.code === 'same_password') {
          throw new Error(
            'Password baru harus berbeda dari password lama.',
          )
        }

        throw authError
      }

      setPassword('')
      setConfirmation('')
      setShowPassword(false)
      setIsSuccess(true)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Password belum berhasil diperbarui.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isSuccess) {
    return (
      <section
        className="password-editor"
        aria-labelledby={`${formId}-success`}
      >
        <h3 id={`${formId}-success`}>Password sudah diperbarui!</h3>

        <p className="auth-message auth-success" role="status">
          Gunakan password baru saat login berikutnya.
        </p>

        <button
          type="button"
          className="profile-action-button"
          onClick={onBack}
          autoFocus
        >
          ← Kembali ke profil
        </button>
      </section>
    )
  }

  return (
    <section
        className="password-editor"
        aria-label="Ganti password"
    >

      <form onSubmit={handleSubmit}>
        <fieldset className="auth-fields" disabled={isSaving}>
          <div className="profile-edit-grid">
            <div className="auth-field">
              <label htmlFor={`${formId}-new`}>
                Password baru
              </label>

              <input
                id={`${formId}-new`}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
                autoFocus
              />
            </div>

            <div className="auth-field">
              <label htmlFor={`${formId}-confirm`}>
                Konfirmasi password
              </label>

              <input
                id={`${formId}-confirm`}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) =>
                  setConfirmation(event.target.value)
                }
                minLength={8}
                required
              />
            </div>
          </div>

          <label className="password-visibility">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) =>
                setShowPassword(event.target.checked)
              }
            />

            <span>Tampilkan password</span>
          </label>

          {error && (
            <p className="auth-message auth-error" role="alert">
              {error}
            </p>
          )}

          <div className="profile-edit-actions">
            <button type="submit" className="button">
              {isSaving ? 'Menyimpan...' : 'Simpan password'}
            </button>

            <button
                type="button"
                className="auth-switch"
                onClick={onBack}
            >
            Batal
                </button>
          </div>
        </fieldset>
      </form>
    </section>
  )
}

export default ChangePassword