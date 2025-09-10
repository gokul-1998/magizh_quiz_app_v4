import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import UserProfile from '../components/UserProfile'
import { AuthContext } from '../contexts/AuthContext'
import React from 'react'
import apiClient from '../lib/api'

// Mock the API client
vi.mock('../lib/api', () => ({
  default: {
    getUserDecks: vi.fn(),
    getUserProgress: vi.fn(),
    getUserStats: vi.fn()
  }
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ username: 'testuser' }),
    useSearchParams: () => [new URLSearchParams('tab=decks'), vi.fn()]
  }
})

// Mock user data
const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  username: 'testuser',
  bio: 'Test bio',
  avatar_url: 'https://example.com/avatar.jpg',
  username_set: true,
  created_at: '2024-01-01T00:00:00Z'
}

// Mock decks data
const mockDecks = [
  {
    id: 1,
    title: 'Test Deck 1',
    description: 'First test deck',
    is_public: true,
    tags: ['test', 'sample'],
    user_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: null,
    owner: mockUser,
    card_count: 5,
    is_starred: false
  },
  {
    id: 2,
    title: 'Test Deck 2',
    description: 'Second test deck',
    is_public: false,
    tags: ['private'],
    user_id: 1,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: null,
    owner: mockUser,
    card_count: 3,
    is_starred: true
  }
]

// Mock auth context
const mockAuthContext = {
  user: mockUser,
  login: vi.fn(),
  logout: vi.fn(),
  isLoading: false,
  checkAuthStatus: vi.fn()
}

// Wrapper component with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthContext.Provider value={mockAuthContext}>
      {children}
    </AuthContext.Provider>
  </BrowserRouter>
)

describe('UserProfile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiClient.getUserDecks).mockResolvedValue(mockDecks)
    vi.mocked(apiClient.getUserProgress).mockResolvedValue([])
    vi.mocked(apiClient.getUserStats).mockResolvedValue({
      total_decks: 2,
      total_cards_studied: 50,
      current_streak: 5,
      total_quiz_sessions: 10,
      average_score: 85.5,
      weekly_activity: [1, 2, 3, 4, 5, 6, 7]
    })
  })

  describe('Profile Header', () => {
    it('renders user profile information correctly', async () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument()
        expect(screen.getByText('@testuser')).toBeInTheDocument()
        expect(screen.getByText('Test bio')).toBeInTheDocument()
      })
    })

    it('displays avatar when available', async () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      await waitFor(() => {
        const avatar = screen.getByAltText('Test User')
        expect(avatar).toBeInTheDocument()
        expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
      })
    })

    it('shows default avatar when no avatar_url', async () => {
      const userWithoutAvatar = { ...mockUser, avatar_url: null }
      const contextWithoutAvatar = { ...mockAuthContext, user: userWithoutAvatar }

      render(
        <BrowserRouter>
          <AuthContext.Provider value={contextWithoutAvatar}>
            <UserProfile />
          </AuthContext.Provider>
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('TU')).toBeInTheDocument() // Initials
      })
    })
  })

  describe('Tab Navigation', () => {
    it('renders all tab buttons', async () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /decks/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /progress/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /analytics/i })).toBeInTheDocument()
      })
    })

    it('switches tabs when clicked', async () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      await waitFor(() => {
        const progressTab = screen.getByRole('button', { name: /progress/i })
        fireEvent.click(progressTab)
        expect(progressTab).toHaveClass('active') // Assuming active class exists
      })
    })

    it('shows decks tab by default', async () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Test Deck 1')).toBeInTheDocument()
        expect(screen.getByText('Test Deck 2')).toBeInTheDocument()
      })
    })
  })

  describe('Decks Tab', () => {
    it('displays user decks correctly', async () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Test Deck 1')).toBeInTheDocument()
        expect(screen.getByText('First test deck')).toBeInTheDocument()
        expect(screen.getByText('Test Deck 2')).toBeInTheDocument()
        expect(screen.getByText('Second test deck')).toBeInTheDocument()
      })
    })

    it('shows deck metadata correctly', async () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('5 cards')).toBeInTheDocument()
        expect(screen.getByText('3 cards')).toBeInTheDocument()
        expect(screen.getByText('Public')).toBeInTheDocument()
        expect(screen.getByText('Private')).toBeInTheDocument()
      })
    })

    it('displays deck tags', async () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('test')).toBeInTheDocument()
        expect(screen.getByText('sample')).toBeInTheDocument()
        expect(screen.getByText('private')).toBeInTheDocument()
      })
    })

    it('shows create deck button for own profile', async () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create new deck/i })).toBeInTheDocument()
      })
    })

    it('navigates to create deck page when button clicked', async () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create new deck/i })
        fireEvent.click(createButton)
        expect(mockNavigate).toHaveBeenCalledWith('/create')
      })
    })

    it('handles empty decks list', async () => {
      vi.mocked(apiClient.getUserDecks).mockResolvedValue([])

      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/no decks yet/i)).toBeInTheDocument()
      })
    })
  })

  describe('Progress Tab', () => {
    it('switches to progress tab and loads data', async () => {
      const mockProgress = [
        {
          deck_id: 1,
          total_attempts: 5,
          best_score: 90.0,
          last_attempt_at: '2024-01-01T00:00:00Z',
          mastery_level: 0.8,
          deck: mockDecks[0]
        }
      ]
      vi.mocked(apiClient.getUserProgress).mockResolvedValue(mockProgress)

      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      await waitFor(() => {
        const progressTab = screen.getByRole('button', { name: /progress/i })
        fireEvent.click(progressTab)
      })

      await waitFor(() => {
        expect(screen.getByText('90%')).toBeInTheDocument() // Best score
        expect(screen.getByText('5 attempts')).toBeInTheDocument()
      })
    })

    it('handles empty progress data', async () => {
      vi.mocked(apiClient.getUserProgress).mockResolvedValue([])

      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      await waitFor(() => {
        const progressTab = screen.getByRole('button', { name: /progress/i })
        fireEvent.click(progressTab)
      })

      await waitFor(() => {
        expect(screen.getByText(/no progress data/i)).toBeInTheDocument()
      })
    })
  })

  describe('Analytics Tab', () => {
    it('displays user statistics', async () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      await waitFor(() => {
        const analyticsTab = screen.getByRole('button', { name: /analytics/i })
        fireEvent.click(analyticsTab)
      })

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument() // Total decks
        expect(screen.getByText('50')).toBeInTheDocument() // Cards studied
        expect(screen.getByText('5')).toBeInTheDocument() // Current streak
        expect(screen.getByText('85.5%')).toBeInTheDocument() // Average score
      })
    })

    it('handles missing analytics data', async () => {
      vi.mocked(apiClient.getUserStats).mockResolvedValue({
        total_decks: 0,
        total_cards_studied: 0,
        current_streak: 0,
        total_quiz_sessions: 0,
        average_score: 0,
        weekly_activity: [0, 0, 0, 0, 0, 0, 0]
      })

      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      await waitFor(() => {
        const analyticsTab = screen.getByRole('button', { name: /analytics/i })
        fireEvent.click(analyticsTab)
      })

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument()
        expect(screen.getByText('0%')).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('shows loading state initially', () => {
      vi.mocked(apiClient.getUserDecks).mockImplementation(() => new Promise(() => {}))

      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('shows loading for each tab switch', async () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      await waitFor(() => {
        const progressTab = screen.getByRole('button', { name: /progress/i })
        fireEvent.click(progressTab)
      })

      // Should show loading briefly when switching tabs
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      vi.mocked(apiClient.getUserDecks).mockRejectedValue(new Error('API Error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading decks:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('shows error message when data fails to load', async () => {
      vi.mocked(apiClient.getUserDecks).mockRejectedValue(new Error('Network Error'))

      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/error loading data/i)).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Behavior', () => {
    it('adapts layout for different screen sizes', async () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      await waitFor(() => {
        const container = screen.getByTestId('user-profile-container')
        expect(container).toHaveClass('responsive') // Assuming responsive class exists
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', async () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByRole('tablist')).toBeInTheDocument()
        expect(screen.getByRole('tabpanel')).toBeInTheDocument()
      })
    })

    it('supports keyboard navigation', async () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      await waitFor(() => {
        const progressTab = screen.getByRole('button', { name: /progress/i })
        progressTab.focus()
        fireEvent.keyDown(progressTab, { key: 'Enter' })
        expect(progressTab).toHaveClass('active')
      })
    })
  })

  describe('User Permissions', () => {
    it('shows edit options for own profile', async () => {
      render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create new deck/i })).toBeInTheDocument()
      })
    })

    it('hides edit options for other users profiles', async () => {
      const otherUserContext = {
        ...mockAuthContext,
        user: { ...mockUser, username: 'otheruser' }
      }

      render(
        <BrowserRouter>
          <AuthContext.Provider value={otherUserContext}>
            <UserProfile />
          </AuthContext.Provider>
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /create new deck/i })).not.toBeInTheDocument()
      })
    })
  })
})
