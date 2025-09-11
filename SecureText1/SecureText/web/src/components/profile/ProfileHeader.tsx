import type { UserProfileData } from '../../types/user'

interface ProfileHeaderProps {
  profile: UserProfileData
}

const StatItem = ({ value, label, color }: { value: number; label: string; color: string }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color }}>{value}</div>
    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{label}</div>
  </div>
)

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'start' }}>
        <img
          src={profile.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
          alt={profile.name}
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>{profile.name}</h1>
          <p style={{ color: '#6b7280', margin: '0 0 1rem 0', fontSize: '1.125rem' }}>
            @{profile.username}
          </p>
          {profile.bio && (
            <p style={{ color: '#374151', marginBottom: '1rem', lineHeight: '1.6' }}>
              {profile.bio}
            </p>
          )}
          
          {/* Stats */}
          <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
            <StatItem value={profile.total_decks} label="Decks" color="#3b82f6" />
            <StatItem value={profile.total_stars} label="Stars" color="#f59e0b" />
            <StatItem value={profile.current_streak} label="Day Streak" color="#ef4444" />
          </div>
        </div>
      </div>
    </div>
  )
}
