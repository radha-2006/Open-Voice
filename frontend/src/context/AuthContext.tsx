import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AttendeeSession {
  attendeeId: string
  eventId: string
  name: string
  code: string
}

interface AuthCtx {
  user: User | null
  loading: boolean
  attendeeSession: AttendeeSession | null
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string, name: string) => Promise<string | null>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<string | null>
  saveAttendeeSession: (s: AttendeeSession) => void
  clearAttendeeSession: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [attendeeSession, setAttendeeSession] = useState<AttendeeSession | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setUser(s?.user ?? null))
    const stored = localStorage.getItem('ov_att')
    if (stored) { try { setAttendeeSession(JSON.parse(stored)) } catch {} }
    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        return 'Incorrect email or password. Please try again.'
      }
      return error.message
    }
    return null
  }

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    })
    if (error) return error.message
    // If identities is empty, this email already has an account
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return 'An account with this email already exists. Please sign in instead.'
    }
    return null
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('ov_att')
    setAttendeeSession(null)
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    })
    if (error) return error.message
    return null
  }

  const saveAttendeeSession = (s: AttendeeSession) => {
    setAttendeeSession(s)
    localStorage.setItem('ov_att', JSON.stringify(s))
  }

  const clearAttendeeSession = () => {
    setAttendeeSession(null)
    localStorage.removeItem('ov_att')
  }

  return (
    <Ctx.Provider value={{ user, loading, attendeeSession, signIn, signUp, signOut, resetPassword, saveAttendeeSession, clearAttendeeSession }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth outside AuthProvider')
  return c
}
