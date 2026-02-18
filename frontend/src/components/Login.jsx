import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './Auth.css'

function Login() {
  const [mode, setMode] = useState('password') // 'password' or 'magic-link'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signIn, signInWithMagicLink } = useAuth()

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const { data, error } = await signIn(email, password)
      
      if (error) {
        setError(error)
      } else {
        setSuccess('✅ Login successful!')
        // AppWrapper will automatically show app when user is authenticated
      }
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const { error } = await signInWithMagicLink(email)
      
      if (error) {
        setError(error)
      } else {
        setSuccess(`📧 Magic link sent to ${email}! Check your inbox.`)
        setEmail('')
      }
    } catch (err) {
      setError(err.message || 'Failed to send magic link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>🚛 merTMS</h1>
          <h2>Sign In to Your Account</h2>
          <p>Access your transportation management system</p>
        </div>

        {/* Mode Toggle */}
        <div className="auth-mode-toggle">
          <button
            className={mode === 'password' ? 'active' : ''}
            onClick={() => setMode('password')}
            type="button"
          >
            🔑 Password
          </button>
          <button
            className={mode === 'magic-link' ? 'active' : ''}
            onClick={() => setMode('magic-link')}
            type="button"
          >
            ✨ Magic Link
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && <div className="auth-error">⚠️ {error}</div>}
        {success && <div className="auth-success">{success}</div>}

        {/* Password Login Form */}
        {mode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="your.email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="auth-links">
              <Link to="/auth/forgot-password">Forgot password?</Link>
            </div>
          </form>
        )}

        {/* Magic Link Form */}
        {mode === 'magic-link' && (
          <form onSubmit={handleMagicLink} className="auth-form">
            <div className="form-group">
              <label htmlFor="email-magic">Email Address</label>
              <input
                id="email-magic"
                type="email"
                placeholder="your.email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <p className="magic-link-info">
              We'll send you an email with a secure login link. No password needed!
            </p>

            <button 
              type="submit" 
              className="btn-primary btn-magic" 
              disabled={loading}
            >
              {loading ? 'Sending...' : '✨ Send Magic Link'}
            </button>
          </form>
        )}

        {/* Sign Up Link */}
        <div className="auth-footer">
          <p>Don't have an account? <Link to="/auth/register">Sign Up</Link></p>
        </div>
      </div>
    </div>
  )
}

export default Login
