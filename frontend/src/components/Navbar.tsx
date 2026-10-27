import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router'

import { useAuth } from '../context/auth-context'
import { useProfile } from '../context/profile-context'
import Avatar from './Avatar'
import './Navbar.css'

function Navbar() {
  const { session, isChecking, logout } = useAuth()
  const { profile } = useProfile()

  const location = useLocation()
  const navigate = useNavigate()

  const headerRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const accountRef = useRef<HTMLDetailsElement>(null)

  const [openedFor, setOpenedFor] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  // Saat route berubah, menu otomatis dianggap tertutup.
  const mobileOpen = openedFor === location.key

  const name = profile?.display_name?.trim() || 'Teman'
  const firstName = name.split(/\s+/)[0]

  function closeAccount() {
    if (accountRef.current) {
      accountRef.current.open = false
    }
  }

  function closeMenus() {
    setOpenedFor(null)
    closeAccount()
  }

  function toggleMenu() {
    closeAccount()
    setOpenedFor(mobileOpen ? null : location.key)
  }

  useEffect(() => {
    if (accountRef.current) {
      accountRef.current.open = false
    }
  }, [location.key])

  useEffect(() => {
    function handleOutsideClick(event: PointerEvent) {
      if (!(event.target instanceof Node)) return

      const account = accountRef.current

      if (account && !account.contains(event.target)) {
        account.open = false
      }

      if (
        mobileOpen &&
        headerRef.current &&
        !headerRef.current.contains(event.target)
      ) {
        setOpenedFor(null)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return

      const account = accountRef.current

      // Tutup dropdown akun dahulu jika sedang terbuka.
      if (account?.open) {
        account.open = false
        account.querySelector('summary')?.focus()
        return
      }

      if (mobileOpen) {
        setOpenedFor(null)
        toggleRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [mobileOpen])

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1025px)')

    function handleResize() {
      setOpenedFor(null)

      if (accountRef.current) {
        accountRef.current.open = false
      }

      // Jangan tinggalkan fokus pada elemen yang baru disembunyikan.
      const focused = document.activeElement

      if (desktop.matches && focused === toggleRef.current) {
        headerRef.current
          ?.querySelector<HTMLAnchorElement>('.brand')
          ?.focus()
      } else if (
        !desktop.matches &&
        focused instanceof Element &&
        headerRef.current
          ?.querySelector('.youth-menu')
          ?.contains(focused)
      ) {
        toggleRef.current?.focus()
      }
    }

    desktop.addEventListener('change', handleResize)

    return () => {
      desktop.removeEventListener('change', handleResize)
    }
  }, [])

  async function handleLogout() {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    setLogoutError(null)

    try {
      await logout()
      closeMenus()
      navigate('/login')
    } catch {
      setLogoutError('Belum berhasil keluar. Coba lagi, ya.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const isAbout =
    location.pathname === '/' && location.hash === '#about'

  return (
    <header
      ref={headerRef}
      className="site-header youth-header"
      onBlur={(event) => {
        const nextTarget = event.relatedTarget

        if (
          nextTarget instanceof Node &&
          !event.currentTarget.contains(nextTarget)
        ) {
          closeMenus()
        }
      }}
    >
      <Link
        className="brand"
        to="/"
        aria-label="Adullam Youth Home"
        onClick={closeMenus}
      >
        ADULLAM<span>YOUTH.</span>
      </Link>

      <button
        ref={toggleRef}
        type="button"
        className={`youth-menu-toggle ${mobileOpen ? 'is-open' : ''}`}
        onClick={toggleMenu}
        aria-label={mobileOpen ? 'Tutup navigasi' : 'Buka navigasi'}
        aria-expanded={mobileOpen}
        aria-controls="youth-navigation-panel"
      >
        <span className="youth-toggle-label" aria-hidden="true">
          {mobileOpen ? 'Tutup' : 'Menu'}
        </span>

        <span className="youth-toggle-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      <div
        id="youth-navigation-panel"
        className={`youth-menu ${mobileOpen ? 'is-open' : ''}`}
      >
        <p className="youth-mobile-note">YOUR LITTLE HOME</p>

        <nav className="navigation" aria-label="Navigasi utama">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `nav-link ${isActive && !isAbout ? 'active' : ''}`
            }
            onClick={closeMenus}
          >
            <span className="youth-link-number" aria-hidden="true">01</span>
            Home
          </NavLink>

          <Link
            className={`nav-link ${isAbout ? 'active' : ''}`}
            to="/#about"
            aria-current={isAbout ? 'location' : undefined}
            onClick={closeMenus}
          >
            <span className="youth-link-number" aria-hidden="true">02</span>
            About Us
          </Link>

          <NavLink
            to="/events"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
            onClick={closeMenus}
          >
            <span className="youth-link-number" aria-hidden="true">03</span>
            Events
          </NavLink>

          <NavLink
            to="/devotion"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
            onClick={closeMenus}
          >
            <span className="youth-link-number" aria-hidden="true">04</span>
            Devotion
          </NavLink>
        </nav>

        <div className="nav-member-actions">
          {isChecking ? (
            <span className="nav-account-loading" role="status">
              Memuat akun...
            </span>
          ) : session ? (
            <details
              className="account-dropdown"
              ref={accountRef}
              key={session.user.id}
            >
              <summary
                className="account-entry"
                aria-label={`Pilihan akun ${name}`}
              >
                <Avatar
                  path={profile?.avatar_path ?? null}
                  name={name}
                  className="nav-avatar"
                />

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
                  onClick={closeMenus}
                >
                  Akun Saya
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
            <Link
              className="account-entry"
              to="/login"
              onClick={closeMenus}
            >
              <span className="account-entry-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 21V19A7 7 0 0 1 19 19V21" />
                </svg>
              </span>

              <span className="account-entry-copy">
                <strong>Masuk / Daftar</strong>
              </span>
            </Link>
          )}
        </div>

        <p className="youth-mobile-signature">#SemuaOrangDiterima</p>
      </div>
    </header>
  )
}

export default Navbar