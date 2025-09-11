import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import apiClient from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import NotFound from './NotFound'

interface DeckDetailData {
  id: number
  title: string
  description: string
  is_public: boolean
  tags: string[]
  card_count: number
  created_at: string
  updated_at: string | null
  owner: {
    id: number
    username: string
    name: string
    avatar_url?: string
  }
}

interface Card {
  id: number
  question: string
  question_type: string
  options: string[]
  correct_answers: string[]
  explanation?: string
  image_url?: string
  tags: string[]
  created_at: string
}

export default function DeckDetail() {
  const { user: currentUser } = useAuth()
  const { username, deckname } = useParams<{ username: string; deckname: string }>()
  const navigate = useNavigate()
  const [deck, setDeck] = useState<DeckDetailData | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDeck = async () => {
      if (!username || !deckname) return

      try {
        setLoading(true)
        
        // First, get the user by username
        const userProfile = await apiClient.getUserProfile(username)
        
        // Then, get all public decks for this user
        const userDecks = await apiClient.getUserDecks(username)
        
        // Find the deck by title (decoded from URL)
        const decodedTitle = decodeURIComponent(deckname || '').replace(/-/g, ' ')
        const foundDeck = userDecks.find((d: any) => 
          d.title.toLowerCase() === decodedTitle.toLowerCase()
        )
        
        if (!foundDeck) {
          setError('Deck not found')
          return
        }

        setDeck(foundDeck)
        
        // Fetch cards for this deck
        const deckCards = await apiClient.getDeckCards(foundDeck.id)
        setCards(deckCards)
      } catch (err) {
        console.error('Error fetching deck:', err)
        setError('Failed to load deck')
      } finally {
        setLoading(false)
      }
    }

    fetchDeck()
  }, [username, deckname])

  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>Loading deck...</h2>
        </div>
      </div>
    )
  }

  if (error || !deck) {
    return (
      <NotFound 
        title="404 - Deck Not Found"
        message={`The deck "${deckname}" by @${username} does not exist or may have been removed.`}
        showHomeButton={true}
      />
    )
  }

  const isOwnDeck = currentUser?.username === username

  return (
    <div className="container">
      {/* Header */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#1f2937' }}>
              {deck.title}
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '1rem', lineHeight: '1.6' }}>
              {deck.description}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }}>
              <span>📊 {deck.card_count} cards</span>
              <span>🏷️ {deck.tags.join(', ')}</span>
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <img 
                src={deck.owner.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'} 
                alt={deck.owner.name}
                style={{ width: '32px', height: '32px', borderRadius: '50%' }}
              />
              <Link to={`/${deck.owner.username}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                @{deck.owner.username}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to={`/study/${deck.id}`} className="btn btn-primary">
          📚 Study Mode
        </Link>
        <Link to={`/exam/${deck.id}`} className="btn">
          ⏱️ Exam Mode
        </Link>
        
        {isOwnDeck && (
          <>
            <Link to={`/deck/${deck.id}/edit`} className="btn">
              ✏️ Edit
            </Link>
            <button className="btn" style={{ backgroundColor: '#ef4444', color: 'white' }}>
              🗑️ Delete
            </button>
          </>
        )}
      </div>

      {/* Cards */}
      <div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
          Cards ({cards.length})
        </h2>
        
        {cards.length > 0 ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {cards.map(card => (
              <div key={card.id} className="card">
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                    {card.question}
                  </h3>
                  
                  {card.question_type === 'mcq' && (
                    <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                      {card.options.map((option, index) => (
                        <div key={index} style={{ 
                          padding: '0.5rem', 
                          backgroundColor: card.correct_answers.includes(option) ? '#dcfce7' : '#f3f4f6',
                          borderRadius: '0.25rem',
                          fontSize: '0.875rem'
                        }}>
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {card.explanation && (
                    <div style={{ 
                      padding: '1rem', 
                      backgroundColor: '#f8fafc', 
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      marginTop: '1rem'
                    }}>
                      <strong>Explanation:</strong> {card.explanation}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    {card.tags.map(tag => (
                      <span key={tag} style={{
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem'
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <h3>No cards yet</h3>
            <p style={{ color: '#6b7280' }}>
              {isOwnDeck 
                ? "Add your first card to get started!"
                : "This deck doesn't have any cards yet."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
