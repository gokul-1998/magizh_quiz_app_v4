import { useAuth } from '../contexts/AuthContext'

// Sample data for now
const sampleDecks = [
  {
    id: 1,
    title: "JavaScript Basics",
    description: "Learn the fundamentals of JavaScript programming",
    cardCount: 15,
    tags: ["javascript", "programming", "web"],
    isStarred: false,
    owner: {
      id: 1,
      name: "Alice Johnson",
      username: "alicej",
      email: "alice@example.com",
      username_set: true
    }
  }
]

export default function Dashboard() {
  const { user } = useAuth()
  
  // This should only be rendered within a ProtectedRoute, but double-check
  if (!user) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="text-3xl">🔒 Authentication Required</h2>
          <p style={{ color: '#6b7280', margin: '1rem 0' }}>
            Please login to view your dashboard.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1 className="text-3xl">📊 Dashboard</h1>
      <div className="grid grid-cols-3">
        <div className="card">
          <h3 className="text-lg">Total Decks</h3>
          <p style={{fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6'}}>{sampleDecks.length}</p>
        </div>
        <div className="card">
          <h3 className="text-lg">Current Streak</h3>
          <p style={{fontSize: '2rem', fontWeight: 'bold', color: '#10b981'}}>7 🔥</p>
        </div>
        <div className="card">
          <h3 className="text-lg">Cards Studied</h3>
          <p style={{fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6'}}>142</p>
        </div>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Recent Activity</h2>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📚</span>
            <div>
              <p style={{ fontWeight: '500' }}>Completed "JavaScript Basics" study session</p>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Score: 14/15 (93%)</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⭐</span>
            <div>
              <p style={{ fontWeight: '500' }}>Starred "Python Data Structures"</p>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>2 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
