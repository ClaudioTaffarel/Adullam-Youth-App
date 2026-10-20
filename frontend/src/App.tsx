import { useEffect } from 'react'
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from 'react-router'

import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import EventsPage from './pages/EventsPage'
import AuthPage from './pages/AuthPage'
import AuthProvider from './context/AuthProvider'
import './App.css'
import './auth.css'

function ScrollPosition() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView()
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [pathname, hash])

  return null
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollPosition />
        <Navbar />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/login" element={<AuthPage />} />
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App