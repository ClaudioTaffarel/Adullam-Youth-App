import { createContext, useContext } from 'react'
import type { Profile } from '../services/api'

type ProfileContextValue = {
  profile: Profile | null
  isLoading: boolean
  loadError: string | null
  reloadProfile: () => void
  setProfile: (profile: Profile) => void
}

export const ProfileContext = createContext<
  ProfileContextValue | undefined
>(undefined)

export function useProfile() {
  const context = useContext(ProfileContext)

  if (!context) {
    throw new Error('useProfile harus digunakan di dalam ProfileProvider.')
  }

  return context
}