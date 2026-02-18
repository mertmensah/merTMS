import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

function AuthCallback() {
  const [message, setMessage] = useState('Verifying...')

  useEffect(() => {
    // Handle the auth callback
    const handleAuthCallback = async () => {
      try {
        // Check for error in URL params
        const params = new URLSearchParams(window.location.search)
        const error = params.get('error')
        const errorDescription = params.get('error_description')

        if (error) {
          setMessage(`❌ ${errorDescription || error}`)
          setTimeout(() => window.location.href = '/', 3000)
          return
        }

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        if (session) {
          setMessage('✅ Authentication successful! Redirecting...')
          setTimeout(() => window.location.href = '/', 1000)
        } else {
          setMessage('⚠️ No active session found. Redirecting...')
          setTimeout(() => window.location.href = '/', 2000)
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setMessage(`❌ Authentication failed: ${error.message}`)
        setTimeout(() => window.location.href = '/', 3000)
      }
    }

    handleAuthCallback()
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: '20px',
      padding: '20px'
    }}>
      <div className="spinner"></div>
      <h2>{message}</h2>
    </div>
  )
}

export default AuthCallback
