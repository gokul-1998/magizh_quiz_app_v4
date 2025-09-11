import { Link } from 'react-router-dom'
import type { Deck } from '../../types/user'
import DeckCard from '../decks/DeckCard'
import EmptyState from '../common/EmptyState'

interface DecksTabProps {
  decks: Deck[]
  loading: boolean
  isOwnProfile: boolean
}

export default function DecksTab({ decks, loading, isOwnProfile }: DecksTabProps) {
  return (
    <div>
      {isOwnProfile && (
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
      
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading public decks...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {decks.length > 0 ? (
            decks.map(deck => <DeckCard key={deck.id} deck={deck} />)
          ) : (
            <EmptyState
              icon="📚"
              title="No decks yet"
              message={isOwnProfile 
                ? "You haven't created any public decks yet. Start by creating your first deck!"
                : "This user hasn't created any public decks yet."
              }
              actionText={isOwnProfile ? "Create Your First Deck" : undefined}
              actionLink={isOwnProfile ? "/create" : undefined}
            />
          )}
        </div>
      )}
    </div>
  )
}
