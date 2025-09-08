import { Link } from 'react-router-dom'

interface DeckCardProps {
  id: number
  title: string
  description: string
  cardCount: number
  tags: string[]
  isStarred?: boolean
}

export default function DeckCard({ id, title, description, cardCount, tags, isStarred }: DeckCardProps) {
  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ flex: 1 }}>
          <Link to={`/deck/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 className="text-lg" style={{ marginBottom: '0.5rem', color: '#1f2937', fontWeight: '600' }}>
              {title}
            </h3>
          </Link>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '0.75rem' }}>
            {description}
          </p>
        </div>
        <div style={{ marginLeft: '1rem' }}>
          {isStarred ? '⭐' : '☆'}
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {tags.map((tag, index) => (
            <span
              key={index}
              style={{
                backgroundColor: '#e0e7ff',
                color: '#3730a3',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '500'
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          {cardCount} cards
        </span>
      </div>
      
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        <Link to={`/study/${id}`} className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
          📚 Study
        </Link>
        <Link to={`/exam/${id}`} className="btn" style={{ 
          fontSize: '0.875rem', 
          padding: '0.5rem 1rem',
          backgroundColor: '#f3f4f6',
          color: '#374151',
          border: '1px solid #d1d5db'
        }}>
          ⏱️ Exam
        </Link>
      </div>
    </div>
  )
}