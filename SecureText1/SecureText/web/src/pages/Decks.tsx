import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import DeckCard from '../components/DeckCard'

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
  }
]

export default function Decks() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="text-3xl">🔒 Authentication Required</h2>
          <p style={{ color: '#6b7280', margin: '1rem 0' }}>
            Please login to view and manage your decks.
          </p>
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <h1 className="text-3xl">📚 My Decks</h1>
        <Link to="/create" className="btn btn-primary">
          + Create Deck
        </Link>
      </div>
      
      <div style={{ display: 'grid', gap: '1rem' }}>
        {sampleDecks.map(deck => (
          <DeckCard key={deck.id} {...deck} />
        ))}
      </div>
    </div>
  )
}
