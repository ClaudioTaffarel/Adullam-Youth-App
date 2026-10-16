import { useEffect, useState } from 'react'
import { verses } from '../data/verses'

function getJakartaDay() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date())

  function getPart(type: string) {
    return Number(parts.find((part) => part.type === type)?.value)
  }

  // Ubah tanggal WIB menjadi nomor hari yang konsisten.
  return Math.floor(
    Date.UTC(
      getPart('year'),
      getPart('month') - 1,
      getPart('day'),
    ) / 86_400_000,
  )
}

function DailyVerse() {
  const [day, setDay] = useState(getJakartaDay)

  useEffect(() => {
    function updateDay() {
      setDay(getJakartaDay())
    }

    // Cek pergantian hari selama halaman masih terbuka.
    const timer = window.setInterval(updateDay, 30_000)

    // Cek lagi ketika pengguna kembali ke tab ini.
    document.addEventListener('visibilitychange', updateDay)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', updateDay)
    }
  }, [])

  const verse = verses[day % verses.length]

    return (
    <section className="verse-strip" aria-labelledby="verse-strip-title">
      <h2 className="eyebrow" id="verse-strip-title">
        VERSE OF THE DAY
      </h2>

      <figure>
        <blockquote>
          <p>{verse.text}</p>
        </blockquote>

        <figcaption>
          {verse.reference} / {verse.translation}
        </figcaption>
      </figure>
    </section>
  )
}

export default DailyVerse