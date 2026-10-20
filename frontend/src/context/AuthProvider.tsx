import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthContext } from './auth-context'

type AuthProviderProps = {
  children: ReactNode
}

function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession)
        setIsChecking(false)
      },
    )

    return () => {
      data.subscription.unsubscribe()
    }
  }, [])

  async function logout() {
    const { error } = await supabase.auth.signOut({
      scope: 'local',
    })

    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ session, isChecking, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider