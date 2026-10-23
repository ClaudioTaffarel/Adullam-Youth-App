import type { ReactNode } from 'react'
import AuthArtwork from './AuthArtwork'

type AuthLayoutProps = {
  children: ReactNode
}

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="auth-page">
      <section className="auth-story">
        <p className="eyebrow">
          ADULLAM YOUTH / YOUR LITTLE HOME
        </p>

        <h1>
          Ceritamu
          <br />
          <span>punya tempat.</span>
        </h1>

        <p>
          Berbagi cerita, mengenal Tuhan, dan bertumbuh bersama.
        </p>

        <span className="auth-sticker">
          #SemuaOrangDiterima
        </span>

        <AuthArtwork />
      </section>

      <section className="auth-card" aria-labelledby="auth-card-title">
        {children}
      </section>
    </main>
  )
}

export default AuthLayout