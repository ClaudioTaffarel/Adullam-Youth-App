import type { CSSProperties } from 'react'
import {
  defaultWebsitePhotos,
  websitePhotoSlots,
} from '../services/website-photos'
import type { WebsitePhotos } from '../services/website-photos'

const memories = [
  { file: '1.webp', caption: 'Little moments, big memories.' },
  { file: '2.webp', caption: 'Better when we’re together.' },
  { file: '3.webp', caption: 'Come as you are.' },
  { file: '4.webp', caption: 'Room for one more.' },
  { file: '5.webp', caption: 'Growing, together.' },
  { file: '6.webp', caption: 'These are the good days.' },
]

type MemoryHeroProps = {
  photos?: WebsitePhotos
}

function MemoryHero({
  photos = defaultWebsitePhotos,
}: MemoryHeroProps) {
  return (
    <section className="memory-hero" id="home">
      <div className="wind-background" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <svg
            key={index}
            className={`wind-stream wind-stream-${index + 1}`}
            viewBox="0 0 1200 400"
            fill="none"
          >
            <path d="M-100 130 C180 20 330 240 620 130 S980 40 1350 140" />
            <path d="M-100 155 C180 45 330 265 620 155 S980 65 1350 165" />
            <path d="M-100 180 C180 70 330 290 620 180 S980 90 1350 190" />
          </svg>
        ))}
      </div>

      <div className="memory-layout">
        <div className="memory-copy">
          <p className="eyebrow">ADULLAM YOUTH / GROWING TOGETHER</p>

          <h1 aria-label="Ada tempat buat kamu.">
            <span className="hero-title-line" aria-hidden="true">
              <span>Ada tempat</span>
            </span>
            <span className="hero-title-line" aria-hidden="true">
              <span>
                buat <em>kamu.</em>
              </span>
            </span>
          </h1>

          <p className="memory-description">
            Tempat buat kenalan, berbagi cerita, dan bertumbuh bersama dalam
            Tuhan. Datang aja dulu, kita kenalan!
          </p>

          <a className="hero-hello" href="#about">
            <span className="hello-face" aria-hidden="true">
              <svg viewBox="0 0 32 32" fill="none">
                <circle cx="11" cy="12" r="1.6" fill="currentColor" />
                <circle cx="21" cy="12" r="1.6" fill="currentColor" />
                <path
                  d="M9 19Q16 26 23 19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span>Kenalan sama kita</span>
          </a>

          <p className="memory-footnote">KAMIS / 19.00–21.00 WIB</p>
        </div>

        <div className="memory-stage" aria-hidden="true">
          <span className="memory-stage-note">
            a few moments,
            <br />a whole lot of love.
          </span>

          {memories.map((memory, index) => {
            const slot = websitePhotoSlots[index]
            const imageUrl = slot ? photos[slot] : `/images/memories/${memory.file}`
            
            const style = {
              '--delay': `${index * -3}s`,
              '--tilt': `${[-12, 8, -6, 11, -9, 5][index]}deg`,
              '--float-y': `${[12, 64, 28, 90, 4, 48][index]}px`,
            } as CSSProperties

            return (
              <figure
                className="flying-polaroid"
                style={style}
                key={memory.file}
              >
                <div className="polaroid-picture">
                  <span className="photo-placeholder">ADULLAM MEMORIES</span>

                  <img
                    key={imageUrl}
                    src={imageUrl}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.style.display = 'none'
                    }}
                  />
                </div>

                <figcaption>{memory.caption}</figcaption>
              </figure>
            )
          })}
        </div>
      </div>

      <div className="autumn-leaves" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((index) => {
          const style = {
            '--leaf-delay': `${index * -3.7}s`,
            '--leaf-top': `${14 + index * 17}%`,
            '--leaf-duration': `${13 + index * 2}s`,
          } as CSSProperties

          return (
            <div className="leaf-flight" style={style} key={index}>
              <svg className="autumn-leaf" viewBox="0 0 48 64">
                <path
                  className="leaf-body"
                  d="M24 3C43 17 46 38 25 54C5 45 2 23 24 3Z"
                />
                <path
                  className="leaf-veins"
                  d="M24 12L25 61M24 29L13 21M25 38L36 27M25 46L14 36"
                />
              </svg>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default MemoryHero
