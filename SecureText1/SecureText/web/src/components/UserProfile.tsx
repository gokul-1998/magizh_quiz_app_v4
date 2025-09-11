import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import apiClient from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import NotFound from './NotFound'
import ProfileHeader from './profile/ProfileHeader'
import NavigationTabs from './profile/NavigationTabs'
import OverviewTab from './profile/OverviewTab'
import DecksTab from './profile/DecksTab'
import GenericEmptyTab from './profile/GenericEmptyTab'
import type { UserProfileData, Deck } from '../types/user'

export default function UserProfile() {
  const { user: currentUser } = useAuth()
  const { username } = useParams<{ username: string }>()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview')
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [publicDecks, setPublicDecks] = useState<Deck[]>([])
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

  const isOwnProfile = currentUser?.username === profile.username
  
  const tabs = [
    { id: 'overview', label: '📋 Overview', count: undefined },
    { id: 'decks', label: '📚 Decks', count: profile.total_decks },
    { id: 'stars', label: '⭐ Stars', count: profile.total_stars },
    { id: 'activity', label: '📊 Activity', count: undefined },
    { id: 'achievements', label: '🏆 Achievements', count: 0 }
  ]

  return (
    <div className="container">
      <ProfileHeader profile={profile} />
      
      <NavigationTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        tabs={tabs} 
      />

      {activeTab === 'overview' && (
        <OverviewTab profile={profile} />
      )}

      {activeTab === 'decks' && (
        <DecksTab 
          decks={publicDecks} 
          loading={decksLoading} 
          isOwnProfile={isOwnProfile} 
        />
      )}

      {activeTab === 'stars' && (
        <GenericEmptyTab 
          icon="⭐" 
          title="No starred decks" 
          message="hasn't starred any decks yet. Explore the discover page to find interesting decks!" 
          isOwnProfile={isOwnProfile} 
        />
      )}

      {activeTab === 'activity' && (
        <GenericEmptyTab 
          icon="📊" 
          title="No activity yet" 
          message="hasn't been active yet. Start studying and creating to see activity here!" 
          isOwnProfile={isOwnProfile} 
        />
      )}

      {activeTab === 'achievements' && (
        <GenericEmptyTab 
          icon="🏆" 
          title="No achievements yet" 
          message="hasn't unlocked any achievements yet. Keep studying and creating to unlock achievements!" 
          isOwnProfile={isOwnProfile} 
        />
      )}
    </div>
  )
}
