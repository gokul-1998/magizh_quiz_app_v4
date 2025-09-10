import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import apiClient from '../lib/api'

export default function CreateDeck() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_public: false,
    tags: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!user) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="text-3xl">🔒 Authentication Required</h2>
          <p style={{ color: '#6b7280', margin: '1rem 0' }}>
            Please login to create a new deck.
          </p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Create deck via API
      const deckData = {
        title: formData.title,
        description: formData.description,
        is_public: formData.is_public,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      }

      const newDeck = await apiClient.createDeck(deckData)
      console.log('Created deck:', newDeck)
      
      // Redirect to user profile decks tab
      navigate(`/${user.username}?tab=decks`)
    } catch (error) {
      console.error('Error creating deck:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container">
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 className="text-3xl">📚 Create New Deck</h1>
        
        <div className="card" style={{ marginTop: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                Deck Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
                placeholder="e.g., JavaScript ES6 Features"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this deck covers..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="javascript, programming, web"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                  style={{ accentColor: '#3b82f6' }}
                />
                <span style={{ fontWeight: '500' }}>Make this deck public</span>
              </label>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem', marginLeft: '1.5rem' }}>
                Public decks can be discovered and studied by other users
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => navigate(`/${user.username}?tab=decks`)}
                className="btn"
                style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.title.trim()}
                className="btn btn-primary"
                style={{
                  opacity: isSubmitting || !formData.title.trim() ? 0.5 : 1,
                  cursor: isSubmitting || !formData.title.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Creating...' : 'Create Deck'}
              </button>
            </div>
          </form>
        </div>

        {/* Next Steps Card */}
        <div className="card" style={{ marginTop: '2rem', backgroundColor: '#f0f9ff', border: '1px solid #e0e7ff' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e40af' }}>
            📝 Next Steps
          </h3>
          <p style={{ color: '#1e40af', fontSize: '0.875rem' }}>
            After creating your deck, you'll be able to add cards with different question types:
          </p>
          <ul style={{ color: '#1e40af', fontSize: '0.875rem', marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
            <li>Multiple choice questions</li>
            <li>Multi-select questions</li>
            <li>Fill-in-the-blank questions</li>
          </ul>
        </div>
      </div>
    </div>
  )
}