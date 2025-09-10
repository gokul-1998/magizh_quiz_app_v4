import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import apiClient from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import NotFound from './NotFound'

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
  const { user: currentUser } = useAuth()
  const { username } = useParams<{ username: string }>()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview')
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [publicDecks, setPublicDecks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [decksLoading, setDecksLoading] = useState(false)

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!username) return
      
      try {
        const userProfile = await apiClient.getUserProfile(username)
        setProfile(userProfile)
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
        setProfile(null)
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [username])

  useEffect(() => {
    const fetchPublicDecks = async () => {
      if (!username || activeTab !== 'decks') return
      
      setDecksLoading(true)
      try {
        const decks = await apiClient.getUserDecks(username)
        setPublicDecks(decks)
      } catch (error) {
        console.error('Failed to fetch public decks:', error)
        setPublicDecks([])
      } finally {
        setDecksLoading(false)
      }
    }

    fetchPublicDecks()
  }, [username, activeTab])

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
      <NotFound 
        title="404 - User Not Found"
        message={`The user @${username} does not exist or may have been removed.`}
        showHomeButton={true}
      />
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
          { id: 'achievements', label: '🏆 Achievements', count: achievements.length }
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
          {/* Show Create Deck button only if viewing own profile */}
          {currentUser && currentUser.username === profile.username && (
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>My Decks</h2>
              <Link 
                to="/create" 
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                + Create Deck
              </Link>
            </div>
          )}
          
          {decksLoading ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Loading public decks...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {publicDecks.length > 0 ? publicDecks.map((deck: any) => (
                <div key={deck.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                        <Link to={`/deck/${deck.id}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                          {deck.title}
                        </Link>
                      </h3>
            </div>
          )}
        </div>
      )}

      {activeTab === 'stars' && (
        <div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {starredDecks.length > 0 ? starredDecks.map((deck: any) => (
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
              {activity.length > 0 ? activity.map((activityItem: any) => (
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
                    {getActivityIcon(activityItem.action_type)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.875rem', color: '#374151' }}>
                      {getActivityDescription(activityItem)}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {formatDate(activityItem.created_at)}
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
            {achievements.length > 0 ? achievements.map((achievement: any) => (
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