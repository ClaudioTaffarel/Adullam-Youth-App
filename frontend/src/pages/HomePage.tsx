import MemoryHero from '../components/MemoryHero'
import EventsSection from '../components/EventsSection'
import DailyVerse from '../components/DailyVerse'

function HomePage() {
  return (
    <main>
      <MemoryHero />

      <div className="community-strip">
        <span>COME AS YOU ARE</span>
        <span aria-hidden="true">/</span>
        <span>LET&apos;S GROW TOGETHER</span>
        <span aria-hidden="true">/</span>
        <span>#SemuaOrangDiterima</span>
      </div>

      <DailyVerse />

      <section className="home-about" id="about">
        <div className="home-about-photo">
          <div className="about-photo-frame">
            <span className="about-photo-placeholder" aria-hidden="true">
              OUR PEOPLE.
              <br />
              OUR LITTLE HOME.
            </span>

            <img
              src="/images/memories/1.webp"
              alt="Kebersamaan anggota ADULLAM Youth"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
          </div>

          <span className="about-photo-label">There’s room for you, too.</span>
        </div>

        <div className="home-about-copy">
          <p className="eyebrow">A LITTLE ABOUT US</p>

          <h2>
            Kenalan dulu.
            <br />
            <span>Siapa tahu, jadi rumah.</span>
          </h2>

          <p>
            ADULLAM Youth adalah tempat untuk berbagi cerita, mengenal Tuhan,
            dan bertumbuh bareng. Dari komsel sampai jalan-jalan,
            semua orang diterima di sini.
          </p>

          <div className="about-meeting">
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