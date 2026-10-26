import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router'

import { useAuth } from '../context/auth-context'
import {
  getMyDevotionStreak,
  type DevotionStreak,
} from '../services/devotions'

import StreakMascot from './StreakMascot'
import './StreakButton.css'

function StreakButton() {
  const { session, isChecking } = useAuth()

  if (isChecking || !session) return null

  return <MemberStreak key={session.user.id} />
}

function MemberStreak() {
  const [streak, setStreak] = useState<DevotionStreak | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const location = useLocation()

  useEffect(() => {
    let disposed = false
    let latestRequest = 0

    async function loadStreak() {
      const requestId = ++latestRequest

      setIsLoading(true)
      setError(null)

      try {
        const data = await getMyDevotionStreak()

        if (disposed || requestId !== latestRequest) return

        setStreak(data)
      } catch {
        if (disposed || requestId !== latestRequest) return

        setError('Streak belum bisa dimuat. Coba lagi, ya.')
      } finally {
        if (!disposed && requestId === latestRequest) {
          setIsLoading(false)
        }
      }
    }

    function refreshWhenVisible() {
      if (document.visibilityState === 'visible') {
        void loadStreak()
      }
    }

    function refreshAfterPublish() {
      void loadStreak()
    }

    void loadStreak()

    const interval = window.setInterval(
      refreshWhenVisible,
      60_000,
    )

    document.addEventListener(
      'visibilitychange',
      refreshWhenVisible,
    )

    window.addEventListener(
      'devotion-published',
      refreshAfterPublish,
    )

    return () => {
      disposed = true
      window.clearInterval(interval)

      document.removeEventListener(
        'visibilitychange',
        refreshWhenVisible,
      )

      window.removeEventListener(
        'devotion-published',
        refreshAfterPublish,
      )
    }
  }, [attempt])

  // Tutup popup ketika berpindah halaman.
  useEffect(() => {
    dialogRef.current?.close()
  }, [location.pathname, location.hash])

  // Hentikan scroll halaman belakang saat popup terbuka.
  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  function openDialog() {
    const dialog = dialogRef.current

    if (!dialog || dialog.open) return

    dialog.showModal()
    setIsOpen(true)
    setAttempt((current) => current + 1)
  }

  function closeDialog() {
    dialogRef.current?.close()
  }

  function handleDialogClose() {
    setIsOpen(false)
    triggerRef.current?.focus({ preventScroll: true })
  }

  const hasStreak = (streak?.current_streak ?? 0) > 0
  const badge = streak?.current_streak ?? (isLoading ? '…' : '—')

  return createPortal(
    <>
      <div
        className={`streak-companion ${
          hasStreak ? 'has-streak' : ''
        }`}
      >
        <button
          ref={triggerRef}
          type="button"
          className="streak-companion-button"
          onClick={openDialog}
          aria-label={
            streak
              ? `Buka streak renungan: ${streak.current_streak} hari`
              : 'Buka streak renungan'
          }
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls="streak-dialog"
        >
          <span className="streak-companion-badge">
            {badge}
          </span>

          <span className="streak-companion-art">
            <StreakMascot />
          </span>
        </button>
      </div>

      <dialog
        ref={dialogRef}
        id="streak-dialog"
        className="streak-dialog"
        aria-labelledby="streak-title"
        onClose={handleDialogClose}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return

          const bounds = event.currentTarget.getBoundingClientRect()

          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          ) {
            closeDialog()
          }
        }}
      >
        <div className="streak-popup">
          <button
            type="button"
            className="streak-close"
            onClick={closeDialog}
            aria-label="Tutup popup streak"
            autoFocus
          >
            ×
          </button>

          <p className="streak-kicker">ONE DAY AT A TIME</p>

          <h2 id="streak-title">
            Sedikit
            <span>setiap hari.</span>
          </h2>

          {error ? (
            <div className="streak-feedback">
              <p role="alert">{error}</p>

              <button
                type="button"
                className="streak-action"
                onClick={() => setAttempt((current) => current + 1)}
              >
                Coba lagi
              </button>
            </div>
          ) : !streak ? (
            <p className="streak-feedback" role="status">
              Sedang memuat ceritamu...
            </p>
          ) : (
            <>
              <div className="streak-score">
                <div className="streak-score-number">
                  <strong>{streak.current_streak}</strong>
                  <span>hari berturut-turut</span>
                </div>

                <div className="streak-score-mascot">
                  <StreakMascot />
                </div>
              </div>

              <div className="streak-stats">
                <div>
                  <span>Rekor terpanjang</span>
                  <strong>
                    {streak.longest_streak} <small>hari</small>
                  </strong>
                </div>

                <div>
                  <span>Total hari devotion</span>
                  <strong>
                    {streak.total_days} <small>hari</small>
                  </strong>
                </div>
              </div>

              <p className="streak-status">
                {streak.completed_today
                  ? 'Sudah berbagi hari ini. Sampai besok, ya!'
                  : hasStreak
                    ? 'Masih ada waktu untuk melanjutkan hari ini.'
                    : 'Satu renungan bisa jadi awal yang baik.'}
              </p>

              <Link
                className="streak-action"
                to="/devotion"
                onClick={closeDialog}
              >
                {streak.completed_today
                  ? 'Baca renungan teman'
                  : 'Tulis renungan hari ini'}

                <span aria-hidden="true">↗</span>
              </Link>

              <p className="streak-footnote">
                Satu hari, satu langkah. Mengikuti waktu WIB.
              </p>
            </>
          )}
        </div>
      </dialog>
    </>,
    document.body,
  )
}

export default StreakButton