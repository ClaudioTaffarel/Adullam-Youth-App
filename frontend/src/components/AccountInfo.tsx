import { useEffect, useState } from 'react'
import { getMyAccount } from '../services/api'
import type { AccountResponse } from '../services/api'

function AccountInfo() {
  const [account, setAccount] =
    useState<AccountResponse['data'] | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadAccount() {
      setAccount(null)
      setError(null)

      try {
        const result = await getMyAccount(controller.signal)

        if (!controller.signal.aborted) {
          setAccount(result.data)
        }
      } catch (error) {
        if (controller.signal.aborted) return

        setError(
          error instanceof Error
            ? error.message
            : 'Informasi akun belum berhasil dimuat.',
        )
      }
    }

    void loadAccount()

    return () => {
      controller.abort()
    }
  }, [attempt])

  if (error) {
    return (
      <div className="account-info">
        <p role="alert">{error}</p>
        <button
          type="button"
          className="auth-switch"
          onClick={() => setAttempt((value) => value + 1)}
        >
          Coba lagi
        </button>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="account-info" role="status">
        Memuat informasi akun...
      </div>
    )
  }

  return (
    <div className="account-info account-pass">
      <div className="account-avatar" aria-hidden="true">
        {account.name.trim().charAt(0).toUpperCase() || 'A'}
      </div>

      <div className="account-identity">
        <span className="eyebrow">PART OF THE ADULLAM FAMILY</span>
        <span className="account-email">{account.email}</span>
      </div>

      <span className="account-pass-label">YOU BELONG HERE</span>
    </div>
  )
}

export default AccountInfo