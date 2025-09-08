import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import DeckCard from './components/DeckCard'
import CreateDeck from './pages/CreateDeck'
import Analytics from './pages/Analytics'
import StudyModeComponent from './components/StudyModeComponent'
import UserProfile from './components/UserProfile'

// Sample data
const sampleDecks = [
  {
    id: 1,
    title: "JavaScript Basics",
    description: "Learn the fundamentals of JavaScript programming",
    cardCount: 15,
    tags: ["javascript", "programming", "web"],
    isStarred: false
  },
  {
    id: 2,
    title: "Python Data Structures",
    description: "Master lists, dictionaries, and sets in Python",
    cardCount: 20,
    tags: ["python", "data-structures", "programming"],
    isStarred: true
  },
  {
    id: 3,
    title: "React Hooks",
    description: "Understanding useState, useEffect, and custom hooks",
    cardCount: 12,
    tags: ["react", "hooks", "frontend"],
    isStarred: false
  }
]

// Basic page components
function Dashboard() {
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

function Login() {
  const { login, isLoading } = useAuth()

  const handleLogin = () => {
    login()
  }

  return (
    <div className="container">
      <div style={{maxWidth: '400px', margin: '0 auto'}}>
        <h1 className="text-3xl text-center mb-6">🧠 Login to Magizh Quiz</h1>
        <div className="card">
          <button 
            className="btn btn-primary" 
            style={{width: '100%', padding: '1rem'}}
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Decks() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="text-3xl">🔒 Authentication Required</h2>
          <p style={{ color: '#6b7280', margin: '1rem 0' }}>
            Please login to view and manage your decks.
          </p>
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <h1 className="text-3xl">📚 My Decks</h1>
        <Link to="/create" className="btn btn-primary">
          + Create Deck
        </Link>
      </div>
      
      <div style={{ display: 'grid', gap: '1rem' }}>
        {sampleDecks.map(deck => (
          <DeckCard key={deck.id} {...deck} />
        ))}
      </div>
    </div>
  )
}

function Discover() {
  return (
    <div className="container">
      <h1 className="text-3xl mb-6">🔍 Discover Decks</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <input 
          type="text" 
          placeholder="Search public decks..." 
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '1rem'
          }}
        />
      </div>
      
      <div style={{ display: 'grid', gap: '1rem' }}>
        {sampleDecks.map(deck => (
          <DeckCard key={deck.id} {...deck} />
        ))}
      </div>
    </div>
  )
}

function AppContent() {
  const { user, logout } = useAuth()

  return (
    <div style={{minHeight: '100vh'}}>
      {/* Navigation */}
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
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                👋 {user.name}
              </span>
              <button onClick={logout} className="btn" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* Main content */}
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/decks" element={<Decks />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/create" element={<CreateDeck />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/complete-signup" element={<Dashboard />} />
          <Route path="/study/:deckId" element={<StudyModeComponent />} />
          <Route path="/exam/:deckId" element={<StudyModeComponent />} />
          <Route path="/:username" element={<UserProfile />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App