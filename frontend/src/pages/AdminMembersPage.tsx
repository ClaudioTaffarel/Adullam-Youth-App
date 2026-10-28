import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'

import { useAuth } from '../context/auth-context'
import { getAdminMembers } from '../services/admin-members'
import type {
  AdminMember,
  AdminMembersResponse,
} from '../services/admin-members'

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}

function MemberDetail({
  member,
  onClose,
}: {
  member: AdminMember
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const previousOverflow = document.body.style.overflow

    dialog.showModal()
    document.body.style.overflow = 'hidden'

    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="ay-member-dialog"
      aria-labelledby="member-detail-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return

        const rect = event.currentTarget.getBoundingClientRect()
        const outside =
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom

        if (outside) onClose()
      }}
    >
      <div className="ay-member-dialog-panel">
        <div className="ay-member-dialog-top">
          <p className="ay-admin-label">MEMBER PROFILE</p>

          <button
            type="button"
            className="ay-admin-refresh"
            onClick={onClose}
            autoFocus
          >
            Tutup
          </button>
        </div>

        <div className="ay-member-profile-heading">
          <span className="ay-member-initial" aria-hidden="true">
            {member.display_name.charAt(0).toUpperCase()}
          </span>

          <div>
            <h2 id="member-detail-title">{member.display_name}</h2>

            <span
              className={`ay-member-role ${
                member.role === 'admin' ? 'is-admin' : ''
              }`}
            >
              {member.role === 'admin' ? 'Admin' : 'Member'}
            </span>
          </div>
        </div>

        <dl className="ay-member-details">
          <div>
            <dt>Email</dt>
            <dd>{member.email || 'Belum tersedia'}</dd>
          </div>

          <div>
            <dt>Nomor telepon</dt>
            <dd>{member.phone_number || 'Belum diisi'}</dd>
          </div>

          <div>
            <dt>Tanggal daftar</dt>
            <dd>
              <time dateTime={member.created_at}>
                {formatDate(member.created_at)}
              </time>
            </dd>
          </div>

          <div>
            <dt>ID akun</dt>
            <dd className="ay-member-id">{member.id}</dd>
          </div>
        </dl>
      </div>
    </dialog>
  )
}

function AdminMembersPage() {
  const { session, isChecking } = useAuth()

  if (isChecking) {
    return <p role="status">Memeriksa sesi login...</p>
  }

  if (!session) return null

  return <MembersContent key={session.user.id} />
}

function MembersContent() {
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState({
    search: '',
    page: 1,
  })

  const [reloadKey, setReloadKey] = useState(0)
  const [result, setResult] = useState<AdminMembersResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedMember, setSelectedMember] =
    useState<AdminMember | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    const timeoutId = window.setTimeout(() => {
      controller.abort()
    }, 15_000)

    async function loadMembers() {
      setIsLoading(true)
      setError(null)
      setResult(null)

      try {
        const response = await getAdminMembers({
          page: query.page,
          search: query.search,
          signal: controller.signal,
        })

        if (!active) return

        const lastPage = Math.max(1, response.pagination.total_pages)

        if (query.page > lastPage) {
          setQuery((current) => ({
            ...current,
            page: lastPage,
          }))
          return
        }

        setResult(response)
      } catch (error) {
        if (!active) return

        setError(
          controller.signal.aborted
            ? 'Server terlalu lama merespons. Coba lagi, ya.'
            : error instanceof Error
              ? error.message
              : 'Daftar anggota belum berhasil dimuat.',
        )
      } finally {
        window.clearTimeout(timeoutId)
        if (active) setIsLoading(false)
      }
    }

    void loadMembers()

    return () => {
      active = false
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [query, reloadKey])

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setQuery({
      search: searchInput.trim(),
      page: 1,
    })
  }

  function resetSearch() {
    setSearchInput('')
    setQuery({
      search: '',
      page: 1,
    })
  }

  return (
    <>
      <header className="ay-admin-page-heading">
        <div>
          <p className="ay-admin-label">THE PEOPLE IN OUR COMMUNITY</p>
          <h1>Members<span>.</span></h1>
          <p>Kenali orang-orang yang menjadi bagian dari ADULLAM.</p>
        </div>
      </header>

      <form
        className="ay-members-search"
        role="search"
        aria-label="Pencarian anggota"
        onSubmit={handleSearch}
      >
        <div>
          <label htmlFor="member-search">Cari nama atau email</label>

          <input
            id="member-search"
            type="search"
            placeholder="Ketik nama atau email..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            maxLength={100}
          />
        </div>

        <button type="submit" className="ay-admin-primary">
          Cari
        </button>

        {(searchInput || query.search) && (
          <button
            type="button"
            className="ay-admin-refresh"
            onClick={resetSearch}
          >
            Reset
          </button>
        )}
      </form>

      <div className="ay-admin-section-heading">
        <h2>Daftar anggota</h2>

        <button
          type="button"
          className="ay-admin-refresh"
          disabled={isLoading}
          onClick={() => setReloadKey((value) => value + 1)}
        >
          {isLoading ? 'Memuat...' : 'Perbarui'}
        </button>
      </div>

      {isLoading && (
        <p role="status">Mengambil daftar anggota...</p>
      )}

      {!isLoading && error && (
        <section className="ay-admin-empty">
          <p role="alert">{error}</p>

          <button
            type="button"
            className="ay-admin-refresh"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            Coba lagi
          </button>
        </section>
      )}

      {!isLoading && result && (
        <>
          <p className="ay-members-count" role="status">
            {result.pagination.total.toLocaleString('id-ID')} akun
            {query.search
              ? ` ditemukan untuk “${query.search}”.`
              : ', termasuk admin.'}
          </p>

          {result.data.length === 0 ? (
            <section className="ay-admin-empty">
              <h2>Belum ada hasil.</h2>
              <p>
                {query.search
                  ? 'Coba gunakan nama atau email yang berbeda.'
                  : 'Belum ada akun yang dapat ditampilkan.'}
              </p>
            </section>
          ) : (
            <div
              className="ay-members-table-wrap"
              role="region"
              aria-label="Tabel anggota, geser horizontal jika diperlukan"
              tabIndex={0}
            >
              <table className="ay-members-table">
                <thead>
                  <tr>
                    <th scope="col">Anggota</th>
                    <th scope="col">Role</th>
                    <th scope="col">Tanggal daftar</th>
                    <th scope="col">Detail</th>
                  </tr>
                </thead>

                <tbody>
                  {result.data.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div className="ay-member-cell">
                          <span
                            className="ay-member-initial"
                            aria-hidden="true"
                          >
                            {member.display_name.charAt(0).toUpperCase()}
                          </span>

                          <div>
                            <strong>{member.display_name}</strong>
                            <span>
                              {member.email || 'Email belum tersedia'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`ay-member-role ${
                            member.role === 'admin' ? 'is-admin' : ''
                          }`}
                        >
                          {member.role === 'admin' ? 'Admin' : 'Member'}
                        </span>
                      </td>

                      <td>
                        <time dateTime={member.created_at}>
                          {formatDate(member.created_at)}
                        </time>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="ay-admin-refresh"
                          aria-haspopup="dialog"
                          aria-label={`Lihat detail ${member.display_name}`}
                          onClick={() => setSelectedMember(member)}
                        >
                          Lihat detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.pagination.total_pages > 1 && (
            <nav
              className="ay-admin-pagination"
              aria-label="Halaman daftar anggota"
            >
              <button
                type="button"
                className="ay-admin-refresh"
                disabled={query.page === 1}
                onClick={() =>
                  setQuery((current) => ({
                    ...current,
                    page: current.page - 1,
                  }))
                }
              >
                Sebelumnya
              </button>

              <span>
                {query.page} / {result.pagination.total_pages}
              </span>

              <button
                type="button"
                className="ay-admin-refresh"
                disabled={query.page >= result.pagination.total_pages}
                onClick={() =>
                  setQuery((current) => ({
                    ...current,
                    page: current.page + 1,
                  }))
                }
              >
                Berikutnya
              </button>
            </nav>
          )}
        </>
      )}

      {selectedMember && (
        <MemberDetail
          key={selectedMember.id}
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </>
  )
}

export default AdminMembersPage