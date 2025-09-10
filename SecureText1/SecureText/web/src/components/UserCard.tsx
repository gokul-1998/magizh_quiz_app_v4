import { Link } from 'react-router-dom'

interface UserCardProps {
  id: number
  name: string
  username: string
  bio?: string
  avatar_url?: string
  total_decks: number
  total_stars: number
  current_streak: number
}

export default function UserCard({
  name,
  username,
  bio,
  avatar_url,
  total_decks,
  total_stars,
  current_streak
}: UserCardProps) {
  return (
    <Link to={`/${username}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div 
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#6b7280',
            backgroundImage: avatar_url ? `url(${avatar_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {!avatar_url && (name ? name.charAt(0).toUpperCase() : username.charAt(0).toUpperCase())}
        </div>
        
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
            {name || username}
          </h3>
          <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
            @{username}
          </p>
        </div>
      </div>
      
      {bio && (
        <p style={{ 
          color: '#6b7280', 
          fontSize: '0.875rem', 
          marginBottom: '1rem',
          lineHeight: '1.4'
        }}>
          {bio}
        </p>
      )}
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        fontSize: '0.875rem',
        color: '#6b7280'
      }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span>📚 {total_decks} decks</span>
          <span>⭐ {total_stars} stars</span>
          {current_streak > 0 && <span>🔥 {current_streak} streak</span>}
        </div>
      </div>
    </Link>
  )
}
