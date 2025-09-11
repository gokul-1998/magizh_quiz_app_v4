import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LandingPage() {
  const { user } = useAuth()
  
  if (user) {
    // If user is logged in, redirect to their profile page
    if (user.username_set && user.username) {
      window.location.href = `/${user.username}`
    } else {
      // If username not set, redirect to complete signup
      window.location.href = '/complete-signup'
    }
    return null
  }

  return (
    <div className="container">
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <h1 className="text-3xl" style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧠 Welcome to Magizh Quiz</h1>
        <p style={{ fontSize: '1.25rem', color: '#6b7280', marginBottom: '2rem' }}>
          Master any subject with our intelligent flashcard system. Create decks, study with adaptive repetition, and track your progress.
        </p>
        
        <div className="grid grid-cols-3" style={{ marginBottom: '3rem' }}>
          <div className="card">
            <h3 className="text-lg">📚 Smart Study</h3>
            <p style={{ color: '#6b7280' }}>Adaptive repetition algorithm helps you focus on what you need to learn</p>
          </div>
          <div className="card">
            <h3 className="text-lg">📊 Track Progress</h3>
            <p style={{ color: '#6b7280' }}>Monitor your learning with detailed analytics and streak tracking</p>
          </div>
          <div className="card">
            <h3 className="text-lg">🎯 Multiple Modes</h3>
            <p style={{ color: '#6b7280' }}>Study mode for learning, exam mode for testing your knowledge</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/login" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            Get Started
          </Link>
          <Link to="/discover" className="btn" style={{ padding: '1rem 2rem', fontSize: '1.1rem', backgroundColor: '#f3f4f6', color: '#374151' }}>
            Browse Public Decks
          </Link>
        </div>
      </div>
    </div>
  )
}
