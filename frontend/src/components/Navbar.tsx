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

      <span className="nav-note">COME AS YOU ARE</span>
    </header>
  )
}

export default Navbar