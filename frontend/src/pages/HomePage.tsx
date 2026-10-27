import CommunityMarquee from '../components/CommunityMarquee'
import { useScrollReveal } from '../hooks/useScrollReveal'
import MemoryHero from '../components/MemoryHero'
import EventsSection from '../components/EventsSection'
import DailyVerse from '../components/DailyVerse'
import AboutDoodle from '../components/AboutDoodle'
import { useEffect, useState } from 'react'
import {
  defaultWebsitePhotos,
  getWebsitePhotos,
} from '../services/website-photos'

function HomePage() {
  const [photos, setPhotos] = useState(defaultWebsitePhotos)

  useEffect(() => {
    const controller = new AbortController()

    const timeoutId = window.setTimeout(() => {
      controller.abort()
    }, 15_000)

    async function loadPhotos() {
      try {
        const result = await getWebsitePhotos(controller.signal)

        if (!controller.signal.aborted) {
          setPhotos(result)
        }
      } catch {
        // Tetap tampilkan foto default jika API tidak tersedia.
      } finally {
        window.clearTimeout(timeoutId)
      }
    }

    void loadPhotos()

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [])

  const pageRef = useScrollReveal<HTMLElement>()
  return (
    <main ref={pageRef} data-reveal-scope>
      <MemoryHero photos={photos} />

      <CommunityMarquee />

      <div data-reveal>
        <DailyVerse />
      </div>

      <section className="home-about" id="about">
        <div className="home-about-photo" data-reveal>
          <AboutDoodle />
          <div className="about-photo-frame">
            <span className="about-photo-placeholder" aria-hidden="true">
              OUR PEOPLE.
              <br />
              OUR LITTLE HOME.
            </span>

            <img
              key={photos.about}
              src={photos.about}
              alt="Kebersamaan anggota ADULLAM Youth"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
          </div>

          <span className="about-photo-label">There’s room for you, too.</span>
        </div>

        <div className="home-about-copy" data-reveal>
          <p className="eyebrow">A LITTLE ABOUT US</p>

          <h2>
            Kenalan dulu.
            <br />
            <span>Siapa tahu, jadi rumah.</span>
          </h2>

          <p>
            ADULLAM Youth adalah tempat untuk berbagi cerita, mengenal Tuhan,
            dan bertumbuh bareng. Dari komsel sampai jalan-jalan, semua orang
            diterima di sini.
          </p>

          <div className="about-meeting">
            <span className="meeting-label">
              <i aria-hidden="true" /> SEE YOU THIS THURSDAY
            </span>
            <strong>Kamis / 19.00–21.00 WIB</strong>
            <p>Prayer night sebulan sekali.</p>
          </div>
        </div>
      </section>

      <EventsSection />
    </main>
  )
}

export default HomePage
