import { useAuth } from '../contexts/AuthContext'

// Note: This component is not used in tab-based navigation
// Kept for future React Router migration if needed
function ProtectedRoute({ children, requireAdmin = false, requireDispatcher = false }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    // In tab-based navigation, AppWrapper handles showing login
    return null
  }

  // Check role-based access
  if (requireAdmin && profile?.role !== 'admin') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>⛔ Access Denied</h2>
        <p>You need administrator privileges to access this page.</p>
        <button onClick={() => window.history.back()}>Go Back</button>
      </div>
    )
  }

  if (requireDispatcher && !['admin', 'dispatcher'].includes(profile?.role)) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>⛔ Access Denied</h2>
        <p>You need dispatcher or admin privileges to access this page.</p>
        <button onClick={() => window.history.back()}>Go Back</button>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
