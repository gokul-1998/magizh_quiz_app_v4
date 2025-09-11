import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface NavigationProps {
  onLogout: () => void
}

export default function Navigation({ onLogout }: NavigationProps) {
  const { user } = useAuth()

  if (!user || !user.username_set) {
    return (
      <nav>
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            🧠 Magizh Quiz
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              👋 {user?.username}
            </span>
            <button onClick={onLogout} className="btn" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
              Logout
            </button>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav>
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          🧠 Magizh Quiz
        </Link>
        <ul className="nav-links">
          <li><Link to="/dashboard" className="nav-link">Dashboard</Link></li>
          <li><Link to="/decks" className="nav-link">My Decks</Link></li>
          <li><Link to="/discover" className="nav-link">Discover</Link></li>
          <li><Link to="/analytics" className="nav-link">Analytics</Link></li>
        </ul>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            👋 {user.username}
          </span>
          <button onClick={onLogout} className="btn" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
