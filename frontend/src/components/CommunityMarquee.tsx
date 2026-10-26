import { useState } from 'react'

const messages = [
  'COME AS YOU ARE',
  'LET’S GROW TOGETHER',
  '#SemuaOrangDiterima',
]

function CommunityMarquee() {
  const [paused, setPaused] = useState(false)

  return (
    <section className="community-strip" aria-label="Semangat komunitas">
      <p className="sr-only">
        Come as you are. Let’s grow together. Semua orang diterima.
      </p>
      <div
        className={`community-marquee ${paused ? 'is-paused' : ''}`}
        aria-hidden="true"
      >
        {[0, 1].map((copy) => (
          <div className="community-marquee-group" key={copy}>
            {[0, 1, 2].map((repeat) => (
              <div className="community-marquee-set" key={repeat}>
                {messages.map((message) => (
                  <span className="community-marquee-item" key={message}>
                    {message}
                    <i>/</i>
                  </span>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
      <button
        type="button"
        className="marquee-toggle"
        aria-pressed={paused}
        aria-label={paused ? 'Lanjutkan teks bergerak' : 'Jeda teks bergerak'}
        onClick={() => setPaused((value) => !value)}
      >
        {paused ? 'Putar' : 'Jeda'}
      </button>
    </section>
  )
}

export default CommunityMarquee
