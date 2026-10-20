import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from './auth-context'
import { ProfileContext } from './profile-context'
import { getMyProfile } from '../services/api'
import type { Profile } from '../services/api'

type ProfileProviderProps = {
  children: ReactNode
}

export default function ProfileProvider({
  children,
}: ProfileProviderProps) {
  const { session, isChecking } = useAuth()
  const userId = session?.user.id

  // Ganti akun berarti mulai dengan state profil baru.
  return (
    <ProfileState
      key={userId ?? 'guest'}
      userId={userId}
      isChecking={isChecking}
    >
      {children}
    </ProfileState>
  )
}

type ProfileStateProps = ProfileProviderProps & {
  userId: string | undefined
  isChecking: boolean
}

function ProfileState({
  children,
  userId,
  isChecking,
}: ProfileStateProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(userId))
  const [loadError, setLoadError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!userId) return

    const controller = new AbortController()

    async function loadProfile() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const result = await getMyProfile(controller.signal)

        if (!controller.signal.aborted) {
          setProfile(result)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Profil belum berhasil dimuat.',
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadProfile()

    return () => controller.abort()
  }, [userId, attempt])

  function reloadProfile() {
    setAttempt((current) => current + 1)
  }

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isLoading: isChecking || isLoading,
        loadError,
        reloadProfile,
        setProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
}