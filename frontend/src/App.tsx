import { useEffect } from 'react'
import {
  BrowserRouter,
  Link,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router'

import Navbar from './components/Navbar'
import StreakButton from './components/StreakButton'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

import AuthProvider from './context/AuthProvider'
import ProfileProvider from './context/ProfileProvider'

import HomePage from './pages/HomePage'
import EventsPage from './pages/EventsPage'
import AuthPage from './pages/AuthPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DevotionPage from './pages/DevotionPage'
import AdminPage, { AdminModulePage } from './pages/AdminPage'
import AdminLayout from './layouts/AdminLayout'
import AdminEventsPage from './pages/AdminEventsPage'
import AdminEventCreatePage from './pages/AdminEventCreatePage'
import AdminEventEditPage from './pages/AdminEventEditPage'
import AdminWebsitePhotosPage from './pages/AdminWebsitePhotosPage'
import AdminMembersPage from './pages/AdminMembersPage'
import AdminDevotionsPage from './pages/AdminDevotionsPage'

import './App.css'
import './auth.css'
import './community-pages.css'
import './admin.css'

function ScrollPosition() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView()
    } else {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant',
      })
    }
  }, [pathname, hash])

  return null
}

function MemberLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <StreakButton />
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <BrowserRouter>
          <ScrollPosition />

          <Routes>
            <Route element={<MemberLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/login" element={<AuthPage />} />

              <Route
                path="/forgot-password"
                element={<ForgotPasswordPage />}
              />

              <Route
                path="/reset-password"
                element={<ResetPasswordPage />}
              />

              <Route
                path="/devotion"
                element={
                  <ProtectedRoute>
                    <DevotionPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="*"
                element={
                  <main className="about-preview">
                    <p className="eyebrow">404 / PAGE NOT FOUND</p>

                    <h1>Wah, halamannya belum ada.</h1>

                    <Link className="button" to="/">
                      Balik ke Home
                    </Link>
                  </main>
                }
              />
            </Route>

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminPage />} />
              <Route path="events/:id/edit" element={<AdminEventEditPage />} />
              
              <Route path="members" element={<AdminMembersPage />} />

              <Route path="devotions" element={<AdminDevotionsPage />} />

              <Route path="events" element={<AdminEventsPage />} />
              <Route path="events/new" element={<AdminEventCreatePage />} />

              <Route
                path="photos"
                element={<AdminWebsitePhotosPage />}
              />

              <Route
                path="*"
                element={
                  <section className="ay-admin-empty">
                    <span className="ay-admin-label">404</span>
                    <h1>Halaman tidak ditemukan.</h1>
                    <Link className="ay-admin-link" to="/admin">
                      Kembali ke dashboard
                    </Link>
                  </section>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </ProfileProvider>
    </AuthProvider>
  )
}

export default App