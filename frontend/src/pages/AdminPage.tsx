import { Link } from 'react-router'
import { useProfile } from '../context/profile-context'

function AdminPage() {
  const { profile } = useProfile()
  const name = profile?.display_name?.trim().split(/\s+/)[0] || 'teman'

  return (
    <main className="admin-page">
      <div className="admin-container">
        <header className="admin-heading">
          <div>
            <p className="eyebrow">ADULLAM YOUTH / BEHIND THE SCENES</p>

            <h1>
              Little things.
              <span>Made with care.</span>
            </h1>

            <p className="admin-intro">
              Halo, {name}. Dari sini, cerita komunitas kita dirawat.
            </p>
          </div>

          <span className="admin-pass">COMMUNITY CREW</span>
        </header>

        <section className="admin-workspace" aria-labelledby="admin-workspace-title">
          <div className="admin-workspace-heading">
            <h2 id="admin-workspace-title">Meja kerja.</h2>

            <Link className="admin-public-link" to="/">
              Lihat website
            </Link>
          </div>

          <div className="admin-module">
            <span className="admin-module-number" aria-hidden="true">
              01
            </span>

            <div>
              <h3>Events & cerita</h3>
              <p>
                Tempat untuk mengelola kegiatan, cover, dan cerita komunitas.
              </p>
            </div>

            <span className="admin-module-status">
              Tahap berikutnya
            </span>
          </div>

          <div className="admin-module">
            <span className="admin-module-number" aria-hidden="true">
              02
            </span>

            <div>
              <h3>Wajah homepage</h3>
              <p>
                Foto polaroid hero dan foto About Us akan dikelola di sini.
              </p>
            </div>

            <span className="admin-module-status">
              Menyusul
            </span>
          </div>
        </section>

        <p className="admin-signature">
          Untuk cerita yang terus bertumbuh. #SemuaOrangDiterima
        </p>
      </div>
    </main>
  )
}

export default AdminPage