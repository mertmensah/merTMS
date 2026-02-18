import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './UserProfile.css'

function UserProfile() {
  const { user, profile, updateProfile, signOut } = useAuth()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    phone: ''
  })
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        company_name: profile.company_name || '',
        phone: profile.phone || ''
      })
    }
  }, [profile])

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
    setLoading(true)

    const { error } = await updateProfile(formData)

    if (error) {
      setError(error)
    } else {
      setSuccess('✅ Profile updated successfully!')
      setEditing(false)
      setTimeout(() => setSuccess(''), 3000)
    }

    setLoading(false)
  }

  const handleCancel = () => {
    setFormData({
      full_name: profile.full_name || '',
      company_name: profile.company_name || '',
      phone: profile.phone || ''
    })
    setEditing(false)
    setError('')
  }

  if (!user || !profile) {
    return (
      <div className="profile-container">
        <p>Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div>
          <h2>👤 User Profile</h2>
          <p className="profile-subtitle">Manage your account information</p>
        </div>
        <button onClick={signOut} className="btn-signout">
          Sign Out
        </button>
      </div>

      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">⚠️ {error}</div>}

      <div className="profile-card">
        <div className="profile-section">
          <h3>Account Information</h3>
          
          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">{user.email}</span>
            <span className={`verification-badge ${profile.email_verified ? 'verified' : 'unverified'}`}>
              {profile.email_verified ? '✓ Verified' : '⚠ Unverified'}
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">Role:</span>
            <span className="info-value role-badge">{profile.role}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Member Since:</span>
            <span className="info-value">
              {new Date(profile.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>

        <div className="profile-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Personal Details</h3>
            {!editing && (
              <button onClick={() => setEditing(true)} className="btn-edit">
                ✏️ Edit
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="full_name">Full Name</label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="company_name">Company Name</label>
                <input
                  id="company_name"
                  name="company_name"
                  type="text"
                  value={formData.company_name}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'Saving...' : '💾 Save Changes'}
                </button>
                <button type="button" onClick={handleCancel} className="btn-cancel" disabled={loading}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-details">
              <div className="info-row">
                <span className="info-label">Full Name:</span>
                <span className="info-value">{profile.full_name || 'Not set'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Company:</span>
                <span className="info-value">{profile.company_name || 'Not set'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Phone:</span>
                <span className="info-value">{profile.phone || 'Not set'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserProfile
