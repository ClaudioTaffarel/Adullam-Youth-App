import MemoryHero from '../components/MemoryHero'
import EventsSection from '../components/EventsSection'

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

      <section className="about-preview" id="about">
        <p className="eyebrow">GOOD COMPANY. GROWING FAITH.</p>
        <h2>Kamis malam, ketemu yuk.</h2>
        <p>
          Kita kumpul untuk komsel setiap Kamis, pukul 19.00–21.00 WIB.
          Sebulan sekali, kita juga punya prayer night untuk berdoa bersama.
        </p>
      </section>

      <EventsSection />
    </main>
  )
}

export default HomePage