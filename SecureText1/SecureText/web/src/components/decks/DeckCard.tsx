import { Link } from 'react-router-dom'
import type { Deck } from '../../types/user'

interface DeckCardProps {
  deck: Deck
}

export default function DeckCard({ deck }: DeckCardProps) {
  return (
    <div className="card">
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
          {deck.tags && deck.tags.map((tag: string) => (
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
  )
}
