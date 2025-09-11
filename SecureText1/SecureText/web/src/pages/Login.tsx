import { useAuth } from '../contexts/AuthContext'

export default function Login() {
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
