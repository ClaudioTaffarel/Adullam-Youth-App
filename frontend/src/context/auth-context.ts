import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

type AuthContextValue = {
  session: Session | null
  isChecking: boolean
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider.')
  }

  return context
}