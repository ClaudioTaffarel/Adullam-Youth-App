import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { getMyProfile, updateMyProfile } from '../services/api'
import type { Profile } from '../services/api'

function AccountInfo() {
  const [profile, setProfile] = useState<Profile | null>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProfile() {
      setIsLoading(true)
      setError(null)

      try {
        const result = await getMyProfile(controller.signal)

        if (controller.signal.aborted) return

        setProfile(result)
        setName(result.display_name)
        setPhone(result.phone_number ?? '')
      } catch (error) {
        if (controller.signal.aborted) return

        setError(
          error instanceof Error
            ? error.message
            : 'Profil belum berhasil dimuat.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadProfile()

    return () => controller.abort()
  }, [attempt])

  function startEditing() {
    if (!profile) return

    setName(profile.display_name)
    setPhone(profile.phone_number ?? '')
    setError(null)
    setMessage(null)
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
    setError(null)
    setMessage(null)
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSaving) return

    const cleanName = name.trim()
    const cleanPhone = phone.replace(/[\s()-]/g, '')

    setError(null)
    setMessage(null)

    if (cleanName.length < 2 || cleanName.length > 80) {
      setError('Nama harus terdiri dari 2 sampai 80 karakter.')
      return
    }

    if (!/^\+?[0-9]{8,15}$/.test(cleanPhone)) {
      setError('Isi nomor telepon yang valid, misalnya 081234567890.')
      return
    }

    setIsSaving(true)

    try {
      const updatedProfile = await updateMyProfile({
        display_name: cleanName,
        phone_number: cleanPhone,
      })

      setProfile(updatedProfile)
      setName(updatedProfile.display_name)
      setPhone(updatedProfile.phone_number ?? '')

      setIsEditing(false)
      setMessage('Profil kamu berhasil disimpan!')
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Profil belum berhasil disimpan.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <p role="status">Sedang memuat profil kamu...</p>
  }

  if (!profile) {
    return (
      <div>
        <p className="auth-message auth-error" role="alert">
          {error ?? 'Profil belum tersedia.'}
        </p>

        <button
          type="button"
          className="auth-switch"
          onClick={() => setAttempt((current) => current + 1)}
        >
          Coba lagi
        </button>
      </div>
    )
  }

  return (
    <div className="profile-panel">
      {isEditing ? (
        <form onSubmit={handleSave}>
          <fieldset className="auth-fields" disabled={isSaving}>
            <div className="profile-edit-grid">
              <div className="auth-field">
                <label htmlFor="profile-name">Nama</label>

                <input
                  id="profile-name"
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
                <label htmlFor="profile-phone">Nomor telepon</label>

                <input
                  id="profile-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="081234567890"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  maxLength={20}
                  required
                />
              </div>
            </div>

            <div className="profile-edit-actions">
              <button className="button" type="submit">
                {isSaving ? 'Menyimpan...' : 'Simpan perubahan'}
              </button>

              <button
                type="button"
                className="auth-switch"
                onClick={cancelEditing}
              >
                Batal
              </button>
            </div>
          </fieldset>
        </form>
      ) : (
        <>
          <div className="account-info account-pass">
            <div className="account-avatar" aria-hidden="true">
              {profile.display_name.trim().charAt(0).toUpperCase() || 'A'}
            </div>

            <div className="account-identity">
              <span className="eyebrow">
                PART OF THE ADULLAM FAMILY
              </span>

              <strong>{profile.display_name}</strong>

              <span className="account-email">
                {profile.email ?? 'Email belum tersedia'}
              </span>

              <span className="profile-phone">
                {profile.phone_number ?? 'Nomor telepon belum diisi'}
              </span>
            </div>

            <span className="account-pass-label">YOU BELONG HERE</span>
          </div>

          <button
            type="button"
            className="auth-switch profile-edit-trigger"
            onClick={startEditing}
          >
            Edit profil ↗
          </button>
        </>
      )}

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
    </div>
  )
}

export default AccountInfo