import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../context/auth-context'

function Navbar() {
  const { session, isChecking, logout } = useAuth()

  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  const menuRef = useRef<HTMLDetailsElement>(null)
  const location = useLocation()
  const navigate = useNavigate()

  const rawName = session?.user.user_metadata.display_name

  const name =
    typeof rawName === 'string' && rawName.trim()
      ? rawName.trim()
      : 'Teman'

  const firstName = name.split(/\s+/)[0]
  const initial = name.charAt(0).toUpperCase()

  function closeMenu() {
    if (menuRef.current) {
      menuRef.current.open = false
    }
  }

  useEffect(() => {
    if (menuRef.current) {
      menuRef.current.open = false
    }
  }, [location.pathname, location.hash])

  useEffect(() => {
    function handleOutsideClick(event: PointerEvent) {
      const menu = menuRef.current

      if (
        menu &&
        event.target instanceof Node &&
        !menu.contains(event.target)
      ) {
        menu.open = false
      }
    }

    function handleEscape(event: KeyboardEvent) {
      const menu = menuRef.current

      if (event.key === 'Escape' && menu?.open) {
        menu.open = false
        menu.querySelector('summary')?.focus()
      }
    }

    document.addEventListener('pointerdown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  async function handleLogout() {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    setLogoutError(null)

    try {
      await logout()
      closeMenu()
      navigate('/login')
    } catch {
      setLogoutError('Belum berhasil keluar. Coba lagi, ya.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="Adullam Youth Home">
        ADULLAM<span>YOUTH.</span>
      </Link>

      <nav className="navigation" aria-label="Navigasi utama">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `nav-link ${isActive ? 'active' : ''}`
          }
        >
          Home
        </NavLink>

        <Link className="nav-link" to="/#about">
          About Us
        </Link>

        <NavLink
          to="/events"
          className={({ isActive }) =>
            `nav-link ${isActive ? 'active' : ''}`
          }
        >
          Events
        </NavLink>
      </nav>

      {isChecking ? (
        <span className="nav-account-loading" role="status">
          Memuat akun...
        </span>
      ) : session ? (
        <details
          className="account-dropdown"
          ref={menuRef}
          key={session.user.id}
        >
          <summary
            className="account-entry"
            aria-label={`Pilihan akun ${name}`}
          >
            <span className="nav-avatar" aria-hidden="true">
              {initial}
            </span>

            <span className="account-entry-copy">
              <strong>{firstName}</strong>
            </span>

            <span className="account-chevron" aria-hidden="true">
              ▾
            </span>
          </summary>

          <div className="account-dropdown-panel">
            <p className="account-dropdown-heading">
              Halo, {firstName}!
            </p>

            <Link
              className="account-dropdown-item"
              to="/login"
              onClick={closeMenu}
            >
              Akun Saya <span aria-hidden="true">↗</span>
            </Link>

            <button
              type="button"
              className="account-dropdown-item account-logout"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Sedang keluar...' : 'Logout'}
            </button>

            {logoutError && (
              <p className="account-dropdown-error" role="alert">
                {logoutError}
              </p>
            )}
          </div>
        </details>
      ) : (
        <Link className="account-entry" to="/login">
          <span className="account-entry-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 21V19A7 7 0 0 1 19 19V21" />
            </svg>
          </span>

          <span className="account-entry-copy">
            <strong>Masuk / Daftar</strong>
          </span>

          <span className="account-entry-arrow" aria-hidden="true">
            ↗
          </span>
        </Link>
      )}
    </header>
  )
}

export default Navbar