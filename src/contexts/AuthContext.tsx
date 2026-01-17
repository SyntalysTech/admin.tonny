'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: 'super_admin' | 'admin' | 'user'
  created_at: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const supabase = createSupabaseBrowserClient()

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error.message)
        return null
      }

      return data as UserProfile
    } catch (err) {
      console.error('Exception fetching profile:', err)
      return null
    }
  }

  const refreshProfile = async () => {
    if (user?.id) {
      const profileData = await fetchProfile(user.id)
      if (profileData) {
        setProfile(profileData)
      }
    }
  }

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()

        if (mounted) {
          if (currentSession?.user) {
            setSession(currentSession)
            setUser(currentSession.user)

            const profileData = await fetchProfile(currentSession.user.id)
            if (mounted && profileData) {
              setProfile(profileData)
            }
          }
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Error initializing auth:', err)
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, newSession: Session | null) => {
        if (!mounted) return

        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          const profileData = await fetchProfile(newSession.user.id)
          if (mounted) {
            setProfile(profileData)
          }
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error: error as Error | null }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (!error && data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: email,
        full_name: fullName,
        role: 'admin',
      })
    }

    return { error: error as Error | null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
