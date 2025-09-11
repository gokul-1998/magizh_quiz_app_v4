import { Link } from 'react-router-dom'

interface EmptyStateProps {
  icon: string
  title: string
  message: string
  actionText?: string
  actionLink?: string
}

export default function EmptyState({ 
  icon, 
  title, 
  message, 
  actionText, 
  actionLink 
}: EmptyStateProps) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</div>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: '#6b7280', marginBottom: actionText ? '1.5rem' : 0 }}>
        {message}
      </p>
      {actionText && actionLink && (
        <Link to={actionLink} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
          {actionText}
        </Link>
      )}
    </div>
  )
}
