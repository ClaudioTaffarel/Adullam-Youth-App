import { useRef, useState } from 'react'
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router'

import { useAuth } from '../context/auth-context'
import { useProfile } from '../context/profile-context'

const navigation = [
  { to: '/admin', label: 'Dashboard', number: '01', end: true },
  { to: '/admin/members', label: 'Members', number: '02' },
  { to: '/admin/devotions', label: 'Devotions', number: '03' },
  { to: '/admin/events', label: 'Events', number: '04' },
  { to: '/admin/photos', label: 'Foto website', number: '05' },
]

function AdminLayout() {
  const { logout } = useAuth()
  const { profile } = useProfile()

  const location = useLocation()
  const navigate = useNavigate()

  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  const isMenuOpen = openedAt === location.key

  const name = profile?.display_name?.trim() || 'Admin'
  const initial = name.charAt(0).toUpperCase()

  const currentPage = navigation.find((item) =>
    item.end
      ? location.pathname === item.to
      : location.pathname === item.to ||
        location.pathname.startsWith(`${item.to}/`),
  )

  function closeMenu() {
    setOpenedAt(null)
  }

  async function handleLogout() {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    setLogoutError(null)

    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      setLogoutError('Belum berhasil keluar. Coba lagi, ya.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div
      className="ay-admin"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isMenuOpen) {
          closeMenu()
          menuButtonRef.current?.focus()
        }
      }}
    >
      <a className="ay-admin-skip" href="#admin-content">
        Langsung ke konten
      </a>

      <aside className="ay-admin-sidebar" aria-label="Panel admin">
        <div className="ay-admin-brand-row">
          <Link
            className="ay-admin-brand"
            to="/admin"
            onClick={closeMenu}
            aria-label="Dashboard Adullam Youth"
          >
            ADULLAM
            <span>YOUTH.</span>
            <small>COMMUNITY ADMIN</small>
          </Link>

          <button
            ref={menuButtonRef}
            type="button"
            className="ay-admin-menu-toggle"
            aria-expanded={isMenuOpen}
            aria-controls="admin-sidebar-content"
            onClick={() =>
              setOpenedAt(isMenuOpen ? null : location.key)
            }
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              {isMenuOpen ? (
                <path d="m6 6 12 12M18 6 6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>

            {isMenuOpen ? 'Tutup' : 'Menu'}
          </button>
        </div>

        <div
          id="admin-sidebar-content"
          className={`ay-admin-sidebar-content ${
            isMenuOpen ? 'is-open' : ''
          }`}
        >
          <p className="ay-admin-nav-label">WORKSPACE</p>

          <nav className="ay-admin-nav" aria-label="Navigasi admin">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `ay-admin-nav-item ${isActive ? 'is-active' : ''}`
                }
              >
                <span className="ay-admin-nav-number" aria-hidden="true">
                  {item.number}
                </span>

                <span>{item.label}</span>

                <span className="ay-admin-nav-dot" aria-hidden="true" />
              </NavLink>
            ))}
          </nav>

          <div className="ay-admin-sidebar-bottom">
            <p>Ruang kecil untuk<br />merawat komunitas.</p>

            <Link
              className="ay-admin-website-link"
              to="/"
              onClick={closeMenu}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m12 4-8 7v9h6v-6h4v6h6v-9l-8-7Z" />
              </svg>
              Lihat website
            </Link>

            <button
              className="ay-admin-logout"
              type="button"
              disabled={isLoggingOut}
              onClick={handleLogout}
            >
              {isLoggingOut ? 'Sedang keluar...' : 'Keluar dari akun'}
            </button>

            {logoutError && (
              <p className="ay-admin-error" role="alert">
                {logoutError}
              </p>
            )}
          </div>
        </div>
      </aside>

      <div className="ay-admin-body">
        <header className="ay-admin-topbar">
          <div className="ay-admin-breadcrumb">
            <span>Workspace</span>
            <span aria-hidden="true">/</span>
            <strong>{currentPage?.label || 'Halaman admin'}</strong>
          </div>

          <div className="ay-admin-account">
            <span className="ay-admin-avatar" aria-hidden="true">
              {initial}
            </span>

            <div>
              <strong>{name}</strong>
              <span>Administrator</span>
            </div>
          </div>
        </header>

        <main
          className="ay-admin-main"
          id="admin-content"
          tabIndex={-1}
        >
          <Outlet />
        </main>

        <footer className="ay-admin-footer">
          <span>ADULLAM YOUTH</span>
          <span>#SemuaOrangDiterima</span>
        </footer>
      </div>
    </div>
  )
}

export default AdminLayout