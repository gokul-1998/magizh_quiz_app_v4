import type { UserProfileData } from '../../types/user'

interface OverviewTabProps {
  profile: UserProfileData
}

export default function OverviewTab({ profile }: OverviewTabProps) {
  return (
    <div>
      <div className="card">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>👋 About</h3>
        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
          Member since {new Date(profile.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
        <p style={{ lineHeight: '1.6' }}>
          {profile.bio || 'This user hasn\'t added a bio yet.'}
        </p>
      </div>
    </div>
  )
}
