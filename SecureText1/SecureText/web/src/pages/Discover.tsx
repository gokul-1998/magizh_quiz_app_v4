import React from 'react'
import DeckCard from '../components/DeckCard'
import UserCard from '../components/UserCard'
import apiClient from '../lib/api'

// Sample data for now
const sampleDecks = [
  {
    id: 1,
    title: "JavaScript Basics",
    description: "Learn the fundamentals of JavaScript programming",
    cardCount: 15,
    tags: ["javascript", "programming", "web"],
    isStarred: false,
    owner: {
      id: 1,
      name: "Alice Johnson",
      username: "alicej",
      email: "alice@example.com",
      username_set: true
    }
  },
  {
    id: 2,
    title: "Python Data Structures",
    description: "Master lists, dictionaries, and sets in Python",
    cardCount: 20,
    tags: ["python", "data-structures", "programming"],
    isStarred: true,
    owner: {
      id: 2,
      name: "Bob Smith",
      username: "bobsmith",
      email: "bob@example.com",
      username_set: true
    }
  },
  {
    id: 3,
    title: "React Hooks",
    description: "Understanding useState, useEffect, and custom hooks",
    cardCount: 12,
    tags: ["react", "hooks", "frontend"],
    isStarred: false,
    owner: {
      id: 3,
      name: "Carol Davis",
      username: "carold",
      email: "carol@example.com",
      username_set: true
    }
  }
]

export default function Discover() {
  const [activeTab, setActiveTab] = React.useState<'decks' | 'users'>('decks')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [decks, setDecks] = React.useState(sampleDecks)
  const [users, setUsers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const result = await apiClient.getDiscoverUsers({ search: searchQuery })
      setUsers(result)
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchDecks = async () => {
    try {
      setLoading(true)
      const result = await apiClient.getDecks({ 
        public_only: true, 
        search: searchQuery 
      })
      setDecks(result)
    } catch (error) {
      console.error('Error fetching decks:', error)
      setDecks([]) // Empty array instead of sample data
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers()
    } else {
      fetchDecks()
    }
  }, [activeTab, searchQuery])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return (
    <div className="container">
      <h1 className="text-3xl mb-6">🔍 Discover</h1>
      
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveTab('decks')}
          style={{
            padding: '0.75rem 1rem',
            border: 'none',
            background: 'none',
            fontSize: '1rem',
            fontWeight: activeTab === 'decks' ? '600' : '400',
            color: activeTab === 'decks' ? '#3b82f6' : '#6b7280',
            borderBottom: activeTab === 'decks' ? '2px solid #3b82f6' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          📚 Decks
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '0.75rem 1rem',
            border: 'none',
            background: 'none',
            fontSize: '1rem',
            fontWeight: activeTab === 'users' ? '600' : '400',
            color: activeTab === 'users' ? '#3b82f6' : '#6b7280',
            borderBottom: activeTab === 'users' ? '2px solid #3b82f6' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          👥 Users
        </button>
      </div>
      
      {/* Search Input */}
      <div style={{ marginBottom: '2rem' }}>
        <input 
          type="text" 
          placeholder={activeTab === 'decks' ? "Search public decks..." : "Search users..."}
          value={searchQuery}
          onChange={handleSearch}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '1rem'
          }}
        />
      </div>
      
      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
          Loading...
        </div>
      )}
      
      {/* Content */}
      {!loading && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {activeTab === 'decks' ? (
            decks.length > 0 ? (
              decks.map(deck => (
                <DeckCard key={deck.id} {...deck} />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                No decks found. Try adjusting your search.
              </div>
            )
          ) : (
            users.length > 0 ? (
              users.map(user => (
                <UserCard key={user.id} {...user} />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                No users found. Try adjusting your search.
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
