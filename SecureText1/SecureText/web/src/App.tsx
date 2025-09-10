import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import DeckCard from './components/DeckCard'
import UserCard from './components/UserCard'
import NotFound from './components/NotFound'
import CreateDeck from './pages/CreateDeck'
import Analytics from './pages/Analytics'
import StudyModeComponent from './components/StudyModeComponent'
import UserProfile from './components/UserProfile'
import CompleteSignup from './components/CompleteSignup'
import apiClient from './lib/api'

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
function LandingPage() {
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

function Dashboard() {
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
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
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
  const [activeTab, setActiveTab] = React.useState<'decks' | 'users'>('decks')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [decks, setDecks] = React.useState(sampleDecks)
  const [users, setUsers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const result = await apiClient.getDiscoverUsers({ search: searchQuery })
      setUsers(result)
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchDecks = async () => {
    try {
      setLoading(true)
      const result = await apiClient.getDecks({ 
        public_only: true, 
        search: searchQuery 
      })
      setDecks(result)
    } catch (error) {
      console.error('Error fetching decks:', error)
      setDecks(sampleDecks) // Fallback to sample data
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers()
    } else {
      fetchDecks()
    }
  }, [activeTab, searchQuery])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return (
    <div className="container">
      <h1 className="text-3xl mb-6">🔍 Discover</h1>
      
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveTab('decks')}
          style={{
            padding: '0.75rem 1rem',
            border: 'none',
            background: 'none',
            fontSize: '1rem',
            fontWeight: activeTab === 'decks' ? '600' : '400',
            color: activeTab === 'decks' ? '#3b82f6' : '#6b7280',
            borderBottom: activeTab === 'decks' ? '2px solid #3b82f6' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          📚 Decks
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '0.75rem 1rem',
            border: 'none',
            background: 'none',
            fontSize: '1rem',
            fontWeight: activeTab === 'users' ? '600' : '400',
            color: activeTab === 'users' ? '#3b82f6' : '#6b7280',
            borderBottom: activeTab === 'users' ? '2px solid #3b82f6' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          👥 Users
        </button>
      </div>
      
      {/* Search Input */}
      <div style={{ marginBottom: '2rem' }}>
        <input 
          type="text" 
          placeholder={activeTab === 'decks' ? "Search public decks..." : "Search users..."}
          value={searchQuery}
          onChange={handleSearch}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '1rem'
          }}
        />
      </div>
      
      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
          Loading...
        </div>
      )}
      
      {/* Content */}
      {!loading && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {activeTab === 'decks' ? (
            decks.length > 0 ? (
              decks.map(deck => (
                <DeckCard key={deck.id} {...deck} />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                No decks found. Try adjusting your search.
              </div>
            )
          ) : (
            users.length > 0 ? (
              users.map(user => (
                <UserCard key={user.id} {...user} />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                No users found. Try adjusting your search.
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
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

function AppContent() {
  const { user, logout, checkAuthStatus } = useAuth()

  const handleSignupComplete = async (username?: string) => {
    // Refresh user data after signup completion
    await checkAuthStatus()
    
    // If username is provided from the signup form, use it directly
    if (username) {
      window.location.href = `/${username}`
      return
    }
    
    // Otherwise, try to get updated user data
    try {
      const updatedUser = await apiClient.getCurrentUser()
      if (updatedUser.username) {
        window.location.href = `/${updatedUser.username}`
      } else {
        // Fallback to dashboard if username is still null
        window.location.href = '/dashboard'
      }
    } catch (error) {
      console.error('Error fetching updated user:', error)
      window.location.href = '/dashboard'
    }
  }

  // If user is logged in but hasn't set username, only show complete-signup route
  if (user && !user.username_set) {
    return (
      <div style={{minHeight: '100vh'}}>
        <nav>
          <div className="nav-container">
            <div className="nav-brand">
              🧠 Magizh Quiz
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                👋 {user.username}
              </span>
              <button onClick={logout} className="btn" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
                Logout
              </button>
            </div>
          </div>
        </nav>
        <main>
          <Routes>
            <Route path="/complete-signup" element={<CompleteSignup onComplete={handleSignupComplete} />} />
            <Route path="*" element={<CompleteSignup onComplete={handleSignupComplete} />} />
          </Routes>
        </main>
      </div>
    )
  }

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
                👋 {user.username}
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
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/decks" element={<ProtectedRoute><Decks /></ProtectedRoute>} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/create" element={<ProtectedRoute><CreateDeck /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/complete-signup" element={<CompleteSignup onComplete={handleSignupComplete} />} />
          <Route path="/study/:deckId" element={<ProtectedRoute><StudyModeComponent /></ProtectedRoute>} />
          <Route path="/exam/:deckId" element={<ProtectedRoute><StudyModeComponent /></ProtectedRoute>} />
          <Route path="/:username" element={<UserProfile />} />
          <Route path="*" element={<NotFound />} />
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