import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import App from '../App'
import Login from './Login'
import Register from './Register'
import AuthCallback from './AuthCallback'

function AppWrapper() {
  const { user, loading } = useAuth()
  const [authView, setAuthView] = useState('login') // 'login', 'register', 'callback'

  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div className="spinner"></div>
        <p style={{ color: 'white', fontSize: '18px' }}>Loading merTMS...</p>
      </div>
    )
  }

  // Check for auth callback in URL
  if (window.location.search.includes('type=recovery') || 
      window.location.search.includes('type=signup') ||
      window.location.hash.includes('access_token')) {
    return <AuthCallback />
  }

  // If not authenticated, show login/register
  if (!user) {
    if (authView === 'register') {
      return (
        <div>
          <Register />
          <div style={{ 
            position: 'fixed', 
            bottom: '20px', 
            left: '50%', 
            transform: 'translateX(-50%)',
            textAlign: 'center'
          }}>
            <button 
              onClick={() => setAuthView('login')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)'
              }}
            >
              ← Back to Login
            </button>
          </div>
        </div>
      )
    }

    return (
      <div>
        <Login />
        <div style={{ 
          position: 'fixed', 
          bottom: '20px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          textAlign: 'center'
        }}>
          <button 
            onClick={() => setAuthView('register')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)'
            }}
          >
            Create New Account →
          </button>
        </div>
      </div>
    )
  }

  // User is authenticated, show main app
  return <App />
}

export default AppWrapper
