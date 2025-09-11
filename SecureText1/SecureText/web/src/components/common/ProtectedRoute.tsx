import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="text-3xl">🔒 Authentication Required</h2>
          <p style={{ color: '#6b7280', margin: '1rem 0' }}>
            Please login to access this page.
          </p>
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
        </div>
      </div>
    )
  }

  if (!user.username_set) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="text-3xl">⚠️ Complete Your Signup</h2>
          <p style={{ color: '#6b7280', margin: '1rem 0' }}>
            Please complete your profile setup before accessing other pages.
          </p>
          <Link to="/complete-signup" className="btn btn-primary">
            Complete Signup
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
