import { useEffect, useRef, useState } from 'react'
import { deleteAdminEvent } from '../services/admin-events'

type DeleteEventButtonProps = {
  eventId: number
  title: string
  onDeleted: () => void
}

function DeleteEventButton({
  eventId,
  title,
  onDeleted,
}: DeleteEventButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const busyRef = useRef(false)

  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const titleId = `delete-event-title-${eventId}`
  const descriptionId = `delete-event-description-${eventId}`

  useEffect(() => {
    if (!isOpen) return

    const dialog = dialogRef.current
    if (!dialog) return

    const previousOverflow = document.body.style.overflow

    dialog.showModal()
    document.body.style.overflow = 'hidden'

    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  function openDialog() {
    setError(null)
    setIsOpen(true)
  }

  function closeDialog() {
    if (busyRef.current) return

    dialogRef.current?.close()
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  async function handleDelete() {
    if (busyRef.current) return

    busyRef.current = true
    setIsDeleting(true)
    setError(null)

    try {
      await deleteAdminEvent(eventId)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Event belum berhasil dihapus.',
      )
      return
    } finally {
      busyRef.current = false
      setIsDeleting(false)
    }

    closeDialog()
    onDeleted()
  }

  return (
    <>
      <button
        ref={triggerRef}
        className="ay-admin-delete-trigger"
        type="button"
        aria-haspopup="dialog"
        aria-label={`Hapus event ${title}`}
        onClick={openDialog}
      >
        Hapus
      </button>

      <dialog
        ref={dialogRef}
        className="ay-admin-delete-dialog"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onCancel={(event) => {
          event.preventDefault()
          closeDialog()
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const rect = event.currentTarget.getBoundingClientRect()
            const outside =
              event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom

            if (outside) closeDialog()
          }
        }}
      >
        <div className="ay-admin-delete-panel">
          <p className="ay-admin-label">HAPUS EVENT</p>

          <h2 id={titleId}>Hapus cerita ini?</h2>

          <p id={descriptionId}>
            Event <strong>“{title}”</strong> akan dihapus dari daftar admin
            dan website. Tindakan ini tidak bisa dibatalkan.
          </p>

          {error && (
            <p className="ay-admin-stats-error" role="alert">
              {error}
            </p>
          )}

          {isDeleting && (
            <p role="status">Sedang menghapus event...</p>
          )}

          <div className="ay-admin-delete-dialog-actions">
            <button
              className="ay-admin-refresh"
              type="button"
              onClick={closeDialog}
              disabled={isDeleting}
              autoFocus
            >
              Batal
            </button>

            <button
              className="ay-admin-delete-confirm"
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Menghapus...' : 'Ya, hapus event'}
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}

export default DeleteEventButton