import { useRef, useState } from 'react'
import { useAuth } from '../context/auth-context'
import { setAdminMemberStatus } from '../services/admin-members'
import type { AdminMember } from '../services/admin-members'

type MemberStatusButtonProps = {
  member: AdminMember
  onChanged: () => void
}

function MemberStatusButton({
  member,
  onChanged,
}: MemberStatusButtonProps) {
  const { session } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const busyRef = useRef(false)

  const isOwnAccount = session?.user.id === member.id

  async function changeStatus() {
    if (busyRef.current) return

    const nextActive = !member.is_active

    const confirmed = window.confirm(
      nextActive
        ? `Aktifkan kembali akun ${member.display_name}?`
        : `Nonaktifkan akun ${member.display_name}?\n\nAkses member akan dihentikan. Profil dan renungannya tetap tersimpan.`,
    )

    if (!confirmed) return

    busyRef.current = true
    setIsSaving(true)
    setError(null)

    try {
      await setAdminMemberStatus(member.id, nextActive)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Status akun belum berhasil diubah.',
      )
      return
    } finally {
      busyRef.current = false
      setIsSaving(false)
    }

    onChanged()
  }

  if (isOwnAccount || member.role === 'admin') {
    return (
      <p className="ay-member-status-help">
        {isOwnAccount
          ? 'Ini akun kamu. Statusnya tidak bisa diubah di sini.'
          : 'Status akun admin tidak dikelola melalui menu Members.'}
      </p>
    )
  }

  return (
    <div className="ay-member-status-actions">
      {error && (
        <p className="ay-admin-stats-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        className={
          member.is_active
            ? 'ay-admin-delete-trigger'
            : 'ay-admin-primary'
        }
        disabled={isSaving}
        onClick={changeStatus}
      >
        {isSaving
          ? 'Menyimpan...'
          : member.is_active
            ? 'Nonaktifkan akun'
            : 'Aktifkan kembali'}
      </button>
    </div>
  )
}

export default MemberStatusButton