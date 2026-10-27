import { Link } from 'react-router'
import { useProfile } from '../context/profile-context'
import AdminStats from '../components/AdminStats'


const modules = [
  {
    number: '01',
    title: 'Members',
    description: 'Kenali dan kelola anggota komunitas.',
    to: '/admin/members',
    color: 'cream',
  },
  {
    number: '02',
    title: 'Devotions',
    description: 'Lihat renungan yang dibagikan anggota.',
    to: '/admin/devotions',
    color: 'yellow',
  },
  {
    number: '03',
    title: 'Events',
    description: 'Siapkan kegiatan dan cerita berikutnya.',
    to: '/admin/events',
    color: 'orange',
  },
  {
    number: '04',
    title: 'Foto website',
    description: 'Perbarui kenangan di halaman depan.',
    to: '/admin/photos',
    color: 'peach',
  },
]

function AdminPage() {
  const { profile } = useProfile()
  const firstName =
    profile?.display_name?.trim().split(/\s+/)[0] || 'teman'

  return (
    <>
      <header className="ay-admin-page-heading">
        <div>
          <p className="ay-admin-label">COMMUNITY OVERVIEW</p>
          <h1>Halo, {firstName}<span>.</span></h1>
          <p>Semua urusan komunitas, dalam satu ruang.</p>
        </div>

        <span className="ay-admin-crew-badge">THE COMMUNITY CREW</span>
      </header>

      <AdminStats />

      <section
        className="ay-admin-management"
        aria-labelledby="admin-management-title"
      >
        <div className="ay-admin-section-heading">
          <h2 id="admin-management-title">Kelola komunitas</h2>
          <span>Pilih ruang kerja</span>
        </div>

        <div className="ay-admin-modules">
          {modules.map((module) => (
            <Link
              className={`ay-admin-module ay-admin-module--${module.color}`}
              to={module.to}
              key={module.to}
            >
              <div className="ay-admin-module-top">
                <span>{module.number}</span>
                <span className="ay-admin-module-open">Buka</span>
              </div>

              <h3>{module.title}</h3>
              <p>{module.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <aside className="ay-admin-note">
        <span className="ay-admin-note-dot" aria-hidden="true" />
        <p>
          Statistik diambil dari database komunitas. Pengelolaan members,
          devotions, events, dan foto website akan kita aktifkan bertahap.
        </p>
      </aside>
    </>
  )
}

type AdminModulePageProps = {
  title: string
  description: string
}

export function AdminModulePage({
  title,
  description,
}: AdminModulePageProps) {
  return (
    <>
      <header className="ay-admin-page-heading">
        <div>
          <p className="ay-admin-label">COMMUNITY MANAGEMENT</p>
          <h1>{title}<span>.</span></h1>
        </div>
      </header>

      <section className="ay-admin-empty">
        <span className="ay-admin-empty-mark" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <rect x="9" y="12" width="30" height="28" rx="4" />
            <path d="M17 12V8h14v4M17 23h14M17 30h9" />
          </svg>
        </span>

        <h2>Ruangnya sudah siap.</h2>
        <p>{description}</p>
        <span className="ay-admin-pending">Fitur pengelolaan belum aktif</span>

        <Link className="ay-admin-link" to="/admin">
          Kembali ke dashboard
        </Link>
      </section>
    </>
  )
}

export default AdminPage