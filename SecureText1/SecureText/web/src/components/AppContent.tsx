import { Routes, Route, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LandingPage from '../pages/LandingPage'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Decks from '../pages/Decks'
import Discover from '../pages/Discover'
import CreateDeck from '../pages/CreateDeck'
import Analytics from '../pages/Analytics'
import StudyModeComponent from '../components/StudyModeComponent'
import UserProfile from '../components/UserProfile'
import DeckDetail from '../components/DeckDetail'
import CompleteSignup from '../components/CompleteSignup'
import NotFound from '../components/NotFound'
import ProtectedRoute from '../components/common/ProtectedRoute'
import Navigation from '../components/layout/Navigation'

interface AppContentProps {
  onSignupComplete: (username?: string) => void
}

export default function AppContent({ onSignupComplete }: AppContentProps) {
  const { user, logout, checkAuthStatus } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // If user is logged in but hasn't set username, only show complete-signup
  if (user && !user.username_set) {
    return (
      <div style={{minHeight: '100vh'}}>
        <Navigation onLogout={handleLogout} />
        <main>
          <Routes>
            <Route path="/complete-signup" element={<CompleteSignup onComplete={onSignupComplete} />} />
            <Route path="*" element={<CompleteSignup onComplete={onSignupComplete} />} />
          </Routes>
        </main>
      </div>
    )
  }

  return (
    <div style={{minHeight: '100vh'}}>
      <Navigation onLogout={handleLogout} />
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/decks" element={<ProtectedRoute><Decks /></ProtectedRoute>} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/create" element={<ProtectedRoute><CreateDeck /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/complete-signup" element={<CompleteSignup onComplete={onSignupComplete} />} />
          <Route path="/study/:deckId" element={<ProtectedRoute><StudyModeComponent /></ProtectedRoute>} />
          <Route path="/exam/:deckId" element={<ProtectedRoute><StudyModeComponent /></ProtectedRoute>} />
          <Route path="/:username" element={<UserProfile />} />
          <Route path="/:username/:deckname" element={<DeckDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}
