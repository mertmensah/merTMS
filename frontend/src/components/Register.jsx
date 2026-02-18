import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './Auth.css'

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: '',
    phone: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signUp } = useAuth()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await signUp(
        formData.email,
        formData.password,
        {
          full_name: formData.fullName,
          company_name: formData.companyName,
          phone: formData.phone
        }
      )

      if (error) {
        setError(error)
      } else {
        setSuccess('✅ Account created! Check your email to verify your account.')
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          fullName: '',
          companyName: '',
          phone: ''
        })
      }
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>🚛 merTMS</h1>
          <h2>Create Your Account</h2>
          <p>Start managing your transportation operations</p>
        </div>

        {error && <div className="auth-error">⚠️ {error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleChange}
              required
              disabled={loading}
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="your.email@company.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="companyName">Company Name (Optional)</label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              placeholder="Your Company LLC"
              value={formData.companyName}
              onChange={handleChange}
              disabled={loading}
              autoComplete="organization"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number (Optional)</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              autoComplete="tel"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              autoComplete="new-password"
              minLength={6}
            />
            <small className="form-hint">Minimum 6 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/auth/login">Sign In</Link></p>
        </div>
      </div>
    </div>
  )
}

export default Register
