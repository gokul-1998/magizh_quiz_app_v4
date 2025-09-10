import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import apiClient from '../lib/api'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    })
    // Reset API client token to ensure fresh state
    apiClient['token'] = null
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Authentication', () => {
    it('includes auth token in requests when available', async () => {
      const mockToken = 'test-token'
      vi.mocked(localStorage.getItem).mockReturnValue(mockToken)
      
      // Force reload token after mocking localStorage
      apiClient['loadToken']()
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'success' })
      })

      await apiClient.getCurrentUser()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/me'),
        expect.objectContaining({
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          })
        })
      )
    })

    it('makes requests without auth token when not available', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null)
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      })

      await apiClient.getDecks()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/decks'),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      )
    })
  })

  describe('Deck Operations', () => {
    const mockDeck = {
      id: 1,
      title: 'Test Deck',
      description: 'Test description',
      is_public: true,
      tags: ['test'],
      user_id: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: null,
      owner: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        username_set: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      card_count: 0,
      is_starred: false
    }

    describe('getDecks', () => {
      it('fetches decks successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [mockDeck]
        })

        const result = await apiClient.getDecks()

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/decks'),
          expect.objectContaining({
            credentials: 'include',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            })
          })
        )
        expect(result).toEqual([mockDeck])
      })

      it('handles query parameters correctly', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => []
        })

        await apiClient.getDecks({ 
          skip: 10, 
          limit: 5, 
          search: 'test',
          public_only: true 
        })

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('skip=10&limit=5&search=test&public_only=true'),
          expect.any(Object)
        )
      })

      it('throws error on failed request', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        })

        await expect(apiClient.getDecks()).rejects.toThrow('API error: 500 Internal Server Error')
      })
    })

    describe('createDeck', () => {
      const deckData = {
        title: 'New Deck',
        description: 'New description',
        is_public: false,
        tags: ['new']
      }

      it('creates deck successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockDeck
        })

        const result = await apiClient.createDeck(deckData)

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/decks'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            }),
            body: JSON.stringify(deckData)
          })
        )
        expect(result).toEqual(mockDeck)
      })

      it('handles validation errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 422,
          json: async () => ({
            detail: [
              {
                loc: ['body', 'title'],
                msg: 'field required',
                type: 'value_error.missing'
              }
            ]
          })
        })

        await expect(apiClient.createDeck(deckData)).rejects.toThrow('API error: 422')
      })

      it('requires authentication', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized'
        })

        await expect(apiClient.createDeck(deckData)).rejects.toThrow('API error: 401 Unauthorized')
      })
    })

    describe('updateDeck', () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description'
      }

      it('updates deck successfully', async () => {
        const updatedDeck = { ...mockDeck, ...updateData }
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => updatedDeck
        })

        const result = await apiClient.updateDeck(1, updateData)

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/decks/1'),
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(updateData)
          })
        )
        expect(result).toEqual(updatedDeck)
      })

      it('handles deck not found', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        })

        await expect(apiClient.updateDeck(999, updateData)).rejects.toThrow('API error: 404 Not Found')
      })
    })

    describe('deleteDeck', () => {
      it('deletes deck successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Deck deleted' })
        })

        const result = await apiClient.deleteDeck(1)

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/decks/1'),
          expect.objectContaining({
            method: 'DELETE'
          })
        )
        expect(result).toEqual({ message: 'Deck deleted' })
      })
    })

    describe('starDeck', () => {
      it('stars deck successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Deck starred', is_starred: true })
        })

        const result = await apiClient.starDeck(1)

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/decks/1/star'),
          expect.objectContaining({
            method: 'POST'
          })
        )
        expect(result).toEqual({ message: 'Deck starred', is_starred: true })
      })

      it('unstars deck when already starred', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Deck unstarred', is_starred: false })
        })

        const result = await apiClient.starDeck(1)

        expect(result).toEqual({ message: 'Deck unstarred', is_starred: false })
      })
    })
  })

  describe('User Operations', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      username: 'testuser',
      bio: 'Test bio',
      avatar_url: 'https://example.com/avatar.jpg',
      username_set: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: null
    }

    describe('getCurrentUser', () => {
      it('fetches current user successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockUser
        })

        const result = await apiClient.getCurrentUser()

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/me'),
          expect.objectContaining({
            credentials: 'include',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            })
          })
        )
        expect(result).toEqual(mockUser)
      })

      it('handles unauthenticated request', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized'
        })

        await expect(apiClient.getCurrentUser()).rejects.toThrow('API error: 401 Unauthorized')
      })
    })

    describe('getUserByUsername', () => {
      it('fetches user by username successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockUser
        })

        const result = await apiClient.getUserByUsername('testuser')

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/users/profile/testuser'),
          expect.any(Object)
        )
        expect(result).toEqual(mockUser)
      })

      it('handles user not found', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        })

        await expect(apiClient.getUserByUsername('nonexistent')).rejects.toThrow('API error: 404 Not Found')
      })
    })

    describe('getUserDecks', () => {
      it('fetches user decks successfully', async () => {
        const mockDecks = [mockUser]
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockDecks
        })

        const result = await apiClient.getUserDecks('testuser')

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/users/profile/testuser/decks'),
          expect.any(Object)
        )
        expect(result).toEqual(mockDecks)
      })
    })
  })

  describe('Error Handling', () => {
    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(apiClient.getDecks()).rejects.toThrow('Network error')
    })

    it('handles JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        }
      })

      await expect(apiClient.getDecks()).rejects.toThrow('Invalid JSON')
    })

    it('handles empty response body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null
      })

      const result = await apiClient.getDecks()
      expect(result).toBeNull()
    })
  })

  describe('Request Configuration', () => {
    it('sets correct base URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })

      await apiClient.getDecks()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/decks'),
        expect.any(Object)
      )
    })

    it('sets correct content type for POST requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      })

      await apiClient.createDeck({
        title: 'Test',
        description: '',
        is_public: false,
        tags: []
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })

    it('handles different HTTP methods correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({})
      })

      await apiClient.getDecks() // GET
      await apiClient.createDeck({ title: 'Test', description: '', is_public: false, tags: [] }) // POST
      await apiClient.updateDeck(1, { title: 'Updated' }) // PUT
      await apiClient.deleteDeck(1) // DELETE

      // Check that methods are properly set (GET is default, so not explicitly set)
      expect(mockFetch).toHaveBeenNthCalledWith(1, expect.any(String), expect.not.objectContaining({ method: expect.any(String) }))
      expect(mockFetch).toHaveBeenNthCalledWith(2, expect.any(String), expect.objectContaining({ method: 'POST' }))
      expect(mockFetch).toHaveBeenNthCalledWith(3, expect.any(String), expect.objectContaining({ method: 'PUT' }))
      expect(mockFetch).toHaveBeenNthCalledWith(4, expect.any(String), expect.objectContaining({ method: 'DELETE' }))
    })
  })

  describe('Query Parameters', () => {
    it('builds query strings correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })

      await apiClient.getDecks({
        skip: 0,
        limit: 10,
        search: 'test query',
        public_only: true,
        tags: 'tag1,tag2'
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('skip=0&limit=10&search=test+query&public_only=true&tags=tag1%2Ctag2'),
        expect.any(Object)
      )
    })

    it('handles undefined query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })

      await apiClient.getDecks({
        skip: 0,
        limit: undefined,
        search: undefined
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('skip=0'),
        expect.any(Object)
      )
      expect(mockFetch).toHaveBeenCalledWith(
        expect.not.stringContaining('limit='),
        expect.any(Object)
      )
    })
  })
})
