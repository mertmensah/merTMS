import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Safety timeout - if loading takes more than 10 seconds, force it to stop
    const timeout = setTimeout(() => {
      console.warn('Auth loading timeout - forcing loading to complete')
      setLoading(false)
    }, 10000)

    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error)
        setError(error.message)
      }
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }).catch(err => {
      console.error('Failed to get session:', err)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          console.log('Profile not found, will be created by trigger on next auth event')
        }
        
        setError(error.message)
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('Profile fetch failed:', err)
      setError(err.message)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates) => {
    if (!user) return { error: 'Not authenticated' }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      return { data, error: null }
    } catch (err) {
      console.error('Profile update failed:', err)
      return { data: null, error: err.message }
    }
  }

  // Sign up with email and password
  const signUp = async (email, password, metadata = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata, // Store full_name, company_name, etc.
          emailRedirectTo: `${window.location.origin}/merTMS/`
        }
      })

      if (error) throw error

      return { data, error: null }
    } catch (err) {
      console.error('Signup error:', err)
      return { data: null, error: err.message }
    }
  }

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      return { data, error: null }
    } catch (err) {
      console.error('Sign in error:', err)
      return { data: null, error: err.message }
    }
  }

  // Magic link (passwordless) login
  const signInWithMagicLink = async (email) => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/merTMS/`
        }
      })

      if (error) throw error

      return { data, error: null }
    } catch (err) {
      console.error('Magic link error:', err)
      return { data: null, error: err.message }
    }
  }

  // Password reset request
  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/merTMS/`
      })

      if (error) throw error

      return { data, error: null }
    } catch (err) {
      console.error('Password reset error:', err)
      return { data: null, error: err.message }
    }
  }

  // Update password
  const updatePassword = async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      return { data, error: null }
    } catch (err) {
      console.error('Password update error:', err)
      return { data: null, error: err.message }
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setProfile(null)
      return { error: null }
    } catch (err) {
      console.error('Sign out error:', err)
      return { error: err.message }
    }
  }

  const value = {
    user,
    profile,
    loading,
    error,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    isAdmin: profile?.role === 'admin',
    isDispatcher: profile?.role === 'dispatcher' || profile?.role === 'admin',
    isDriver: profile?.role === 'driver'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
