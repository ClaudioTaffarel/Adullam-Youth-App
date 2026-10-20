import { Link, NavLink } from 'react-router'

function Navbar() {
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

      <Link className="account-entry" to="/login">
        <span className="account-entry-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 21V19A7 7 0 0 1 19 19V21" />
          </svg>
        </span>

        <span className="account-entry-copy">
          <strong>Akun kamu</strong>
        </span>

        <span className="account-entry-arrow" aria-hidden="true">↗</span>
      </Link>
    </header>
  )
}

export default Navbar