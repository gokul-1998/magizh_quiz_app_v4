import { Link } from 'react-router-dom'

interface NotFoundProps {
  title?: string
  message?: string
  showHomeButton?: boolean
}

export default function NotFound({ 
  title = "404 - Page Not Found",
  message = "The page you're looking for doesn't exist.",
  showHomeButton = true
}: NotFoundProps) {
  return (
    <div className="container">
      <div style={{ 
        textAlign: 'center', 
        maxWidth: '600px', 
        margin: '4rem auto',
        padding: '2rem'
      }}>
        <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>🔍</div>
        
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem',
          color: '#374151'
        }}>
          {title}
        </h1>
        
        <p style={{ 
          fontSize: '1.125rem', 
          color: '#6b7280', 
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          {message}
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {showHomeButton && (
            <Link 
              to="/" 
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.5rem' }}
            >
              🏠 Go Home
            </Link>
          )}
          
          <Link 
            to="/discover" 
            className="btn"
            style={{ 
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f3f4f6',
              color: '#374151'
            }}
          >
            🔍 Discover Users
          </Link>
        </div>
        
        <div style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Looking for something specific?
          </h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Try browsing our public decks or discovering other users in the community.
          </p>
        </div>
      </div>
    </div>
  )
}
