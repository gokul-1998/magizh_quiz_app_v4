import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import apiClient from '../lib/api'

interface CompleteSignupProps {
  onComplete: (username?: string) => void
}

function CompleteSignup({ onComplete }: CompleteSignupProps) {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim()) {
      setError('Username is required')
      return
    }

    if (username.length < 1) {
      setError('Username cannot be empty')
      return
    }

    if (username.length > 39) {
      setError('Username cannot be longer than 39 characters')
      return
    }

    if (!/^[a-zA-Z0-9]([a-zA-Z0-9-])*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(username)) {
      setError('Username may only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await apiClient.completeSignup({ username })
      onComplete(username)
    } catch (error: any) {
      if (error.message.includes('400')) {
        setError('Username already taken. Please choose a different one.')
      } else {
        setError('Failed to complete signup. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container">
      <div style={{ maxWidth: '500px', margin: '0 auto', marginTop: '4rem' }}>
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 className="text-3xl" style={{ marginBottom: '1rem' }}>
              🎉 Welcome to Magizh Quiz!
            </h1>
            <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
              Hi {user?.name}! Let's complete your profile by choosing a username.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label 
                htmlFor="username" 
                style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                Choose a Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                disabled={isLoading}
              />
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#6b7280', 
                marginTop: '0.5rem' 
              }}>
                Username may only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen. Maximum 39 characters.
              </p>
            </div>

            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ 
                width: '100%', 
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: '600'
              }}
              disabled={isLoading || !username.trim()}
            >
              {isLoading ? 'Creating Profile...' : 'Complete Signup'}
            </button>
          </form>

          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            backgroundColor: '#f9fafb', 
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            <p style={{ 
              fontSize: '0.875rem', 
              color: '#6b7280',
              margin: 0
            }}>
              🔒 Your username will be used for your public profile and cannot be changed later.
            </p>
            <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#9ca3af' }}>
              <p style={{ margin: '0.25rem 0' }}>✅ Valid: john, jane-doe, user123, a</p>
              <p style={{ margin: '0.25rem 0' }}>❌ Invalid: -john, jane-, john--doe, john_doe</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompleteSignup
