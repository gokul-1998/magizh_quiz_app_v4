import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

interface UserProfileData {
  id: number
  name: string
  username: string
  bio?: string
  avatar_url?: string
  created_at: string
  total_decks: number
  total_stars: number
  current_streak: number
}

interface Activity {
  id: number
  action_type: string
  resource_type: string
  created_at: string
  resource_title?: string
}

export default function UserProfile() {
  const { username } = useParams<{ username: string }>()
  const [activeTab, setActiveTab] = useState('overview')
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  // Mock data for demonstration
  const mockProfile: UserProfileData = {
    id: 1,
    name: "Demo User",
    username: "demo_user",
    bio: "Learning enthusiast passionate about technology and continuous education. Love creating and sharing knowledge through interactive quizzes!",
    avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    created_at: "2025-01-01T00:00:00Z",
    total_decks: 12,
    total_stars: 45,
    current_streak: 7
  }

  const mockDecks = [
    {
      id: 1,
      title: "JavaScript Fundamentals",
      description: "Core concepts every JS developer should know",
      card_count: 25,
      is_starred: true,
      tags: ["javascript", "programming", "fundamentals"]
    },
    {
      id: 2,
      title: "React Hooks Deep Dive",
      description: "Master React hooks with practical examples",
      card_count: 18,
      is_starred: false,
      tags: ["react", "hooks", "frontend"]
    },
    {
      id: 3,
      title: "Python Data Structures",
      description: "Lists, dictionaries, sets, and more",
      card_count: 22,
      is_starred: true,
      tags: ["python", "data-structures", "algorithms"]
    }
  ]

  const mockActivity: Activity[] = [
    {
      id: 1,
      action_type: "complete_quiz",
      resource_type: "deck",
      created_at: "2025-09-07T10:30:00Z",
      resource_title: "JavaScript Fundamentals"
    },
    {
      id: 2,
      action_type: "create_deck",
      resource_type: "deck",
      created_at: "2025-09-06T15:45:00Z",
      resource_title: "Advanced TypeScript"
    },
    {
      id: 3,
      action_type: "star_deck",
      resource_type: "deck",
      created_at: "2025-09-05T09:20:00Z",
      resource_title: "Machine Learning Basics"
    }
  ]

  const mockAchievements = [
    {
      type: "streak_master",
      title: "Streak Master",
      description: "Maintained a 30-day learning streak",
      icon: "🔥",
      earned_at: "2025-08-15T00:00:00Z"
    },
    {
      type: "perfect_scorer",
      title: "Perfect Scorer",
      description: "Achieved 10 perfect quiz scores",
      icon: "🎯",
      earned_at: "2025-08-10T00:00:00Z"
    },
    {
      type: "deck_creator",
      title: "Deck Creator",
      description: "Created 10 educational decks",
      icon: "🎨",
      earned_at: "2025-07-20T00:00:00Z"
    }
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProfile(mockProfile)
      setLoading(false)
    }, 500)
  }, [username])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'complete_quiz': return '✅'
      case 'create_deck': return '🆕'
      case 'star_deck': return '⭐'
      default: return '📝'
    }
  }

  const getActivityDescription = (activity: Activity) => {
    switch (activity.action_type) {
      case 'complete_quiz':
        return `Completed quiz for "${activity.resource_title}"`
      case 'create_deck':
        return `Created deck "${activity.resource_title}"`
      case 'star_deck':
        return `Starred deck "${activity.resource_title}"`
      default:
        return `Activity on "${activity.resource_title}"`
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 className="text-3xl">Loading profile...</h2>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 className="text-3xl">👤 User not found</h2>
          <p style={{ color: '#6b7280', margin: '1rem 0' }}>
            The user @{username} does not exist.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* Profile Header */}
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
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                  {profile.total_decks}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Decks</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  {profile.total_stars}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Stars</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                  {profile.current_streak}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Day Streak</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GitHub-style Navigation Tabs */}
      <div style={{ 
        borderBottom: '1px solid #e5e7eb', 
        marginBottom: '2rem',
        display: 'flex',
        gap: '2rem'
      }}>
        {[
          { id: 'overview', label: '📋 Overview', count: null },
          { id: 'decks', label: '📚 Decks', count: profile.total_decks },
          { id: 'stars', label: '⭐ Stars', count: profile.total_stars },
          { id: 'activity', label: '📊 Activity', count: null },
          { id: 'achievements', label: '🏆 Achievements', count: mockAchievements.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: '1rem 0',
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === tab.id ? '600' : '400',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {tab.label}
            {tab.count !== null && (
              <span style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '1rem',
                minWidth: '1.5rem',
                textAlign: 'center'
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>👋 About</h3>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              Member since {formatDate(profile.created_at)}
            </p>
            <p style={{ lineHeight: '1.6' }}>
              {profile.bio || 'This user hasn\'t added a bio yet.'}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'decks' && (
        <div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {mockDecks.map(deck => (
              <div key={deck.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      <Link to={`/deck/${deck.id}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                        {deck.title}
                      </Link>
                    </h3>
                    <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
                      {deck.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }}>
                      <span style={{ color: '#6b7280' }}>📊 {deck.card_count} cards</span>
                      {deck.is_starred && <span style={{ color: '#f59e0b' }}>⭐ Starred</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginLeft: '1rem' }}>
                    {deck.tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280',
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'stars' && (
        <div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {mockDecks.filter(deck => deck.is_starred).map(deck => (
              <div key={deck.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      <Link to={`/deck/${deck.id}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                        ⭐ {deck.title}
                      </Link>
                    </h3>
                    <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
                      {deck.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }}>
                      <span style={{ color: '#6b7280' }}>📊 {deck.card_count} cards</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div>
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>📊 Recent Activity</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {mockActivity.map(activity => (
                <div
                  key={activity.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '0.5rem'
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>
                    {getActivityIcon(activity.action_type)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.875rem', color: '#374151' }}>
                      {getActivityDescription(activity)}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {mockAchievements.map(achievement => (
              <div key={achievement.type} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '3rem' }}>{achievement.icon}</span>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      {achievement.title}
                    </h3>
                    <p style={{ color: '#6b7280', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      {achievement.description}
                    </p>
                    <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                      Earned on {formatDate(achievement.earned_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}