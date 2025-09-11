import { BrowserRouter as Router } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './contexts/AuthContext'
import AppContent from './components/AppContent'

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent onSignupComplete={(username?: string) => {
          if (username) {
            window.location.href = `/${username}`
          } else {
            window.location.href = '/dashboard'
          }
        }} />
      </Router>
    </AuthProvider>
  )
}

export default App