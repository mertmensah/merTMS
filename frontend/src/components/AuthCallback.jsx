import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

function AuthCallback() {
  const [message, setMessage] = useState('Verifying...')
  const navigate = useNavigate()

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
          setTimeout(() => navigate('/auth/login'), 3000)
          return
        }

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        if (session) {
          setMessage('✅ Authentication successful! Redirecting...')
          setTimeout(() => navigate('/'), 1000)
        } else {
          setMessage('⚠️ No active session found. Redirecting to login...')
          setTimeout(() => navigate('/auth/login'), 2000)
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setMessage(`❌ Authentication failed: ${error.message}`)
        setTimeout(() => navigate('/auth/login'), 3000)
      }
    }

    handleAuthCallback()
  }, [navigate])

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
