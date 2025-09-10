import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import CreateDeck from '../pages/CreateDeck'
import { AuthContext } from '../contexts/AuthContext'
import apiClient from '../lib/api'

// Mock the API client
vi.mock('../lib/api', () => ({
  default: {
    createDeck: vi.fn()
  }
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock user data
const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  username: 'testuser',
  username_set: true,
  created_at: '2024-01-01T00:00:00Z'
}

// Mock auth context
const mockAuthContext = {
  user: mockUser,
  login: vi.fn(),
  logout: vi.fn(),
  loading: false
}

// Wrapper component with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthContext.Provider value={mockAuthContext}>
      {children}
    </AuthContext.Provider>
  </BrowserRouter>
)

describe('CreateDeck Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders create deck form correctly', () => {
      render(
        <TestWrapper>
          <CreateDeck />
        </TestWrapper>
      )

      expect(screen.getByText('📚 Create New Deck')).toBeInTheDocument()
      expect(screen.getByLabelText(/deck title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/make this deck public/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create deck/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('shows loading state when user is not available', () => {
      const loadingAuthContext = {
        ...mockAuthContext,
        user: null,
        loading: true
      }

      render(
        <BrowserRouter>
          <AuthContext.Provider value={loadingAuthContext}>
            <CreateDeck />
          </AuthContext.Provider>
        </BrowserRouter>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('redirects to login when user is not authenticated', () => {
      const noUserAuthContext = {
        ...mockAuthContext,
        user: null,
        loading: false
      }

      render(
        <BrowserRouter>
          <AuthContext.Provider value={noUserAuthContext}>
            <CreateDeck />
          </AuthContext.Provider>
        </BrowserRouter>
      )

      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  describe('Form Interactions', () => {
    it('updates form fields when user types', async () => {
      render(
        <TestWrapper>
          <CreateDeck />
        </TestWrapper>
      )

      const titleInput = screen.getByLabelText(/deck title/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      const tagsInput = screen.getByLabelText(/tags/i)

      fireEvent.change(titleInput, { target: { value: 'Test Deck Title' } })
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } })
      fireEvent.change(tagsInput, { target: { value: 'tag1, tag2, tag3' } })

      expect(titleInput).toHaveValue('Test Deck Title')
      expect(descriptionInput).toHaveValue('Test description')
      expect(tagsInput).toHaveValue('tag1, tag2, tag3')
    })

    it('toggles public checkbox correctly', () => {
      render(
        <TestWrapper>
          <CreateDeck />
        </TestWrapper>
      )

      const publicCheckbox = screen.getByLabelText(/make this deck public/i)
      expect(publicCheckbox).not.toBeChecked()

      fireEvent.click(publicCheckbox)
      expect(publicCheckbox).toBeChecked()

      fireEvent.click(publicCheckbox)
      expect(publicCheckbox).not.toBeChecked()
    })

    it('disables create button when title is empty', () => {
      render(
        <TestWrapper>
          <CreateDeck />
        </TestWrapper>
      )

      const createButton = screen.getByRole('button', { name: /create deck/i })
      expect(createButton).toBeDisabled()

      const titleInput = screen.getByLabelText(/deck title/i)
      fireEvent.change(titleInput, { target: { value: 'Test Title' } })
      expect(createButton).not.toBeDisabled()

      fireEvent.change(titleInput, { target: { value: '   ' } })
      expect(createButton).toBeDisabled()
    })
  })

  describe('Form Submission', () => {
    it('submits form with correct data', async () => {
      const mockCreateDeck = vi.mocked(apiClient.createDeck)
      mockCreateDeck.mockResolvedValue({
        id: 1,
        title: 'Test Deck',
        description: 'Test description',
        is_public: true,
        tags: ['tag1', 'tag2'],
        user_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: null,
        owner: mockUser,
        card_count: 0,
        is_starred: false
      })

      render(
        <TestWrapper>
          <CreateDeck />
        </TestWrapper>
      )

      // Fill form
      fireEvent.change(screen.getByLabelText(/deck title/i), {
        target: { value: 'Test Deck' }
      })
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Test description' }
      })
      fireEvent.click(screen.getByLabelText(/make this deck public/i))
      fireEvent.change(screen.getByLabelText(/tags/i), {
        target: { value: 'tag1, tag2' }
      })

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /create deck/i }))

      await waitFor(() => {
        expect(mockCreateDeck).toHaveBeenCalledWith({
          title: 'Test Deck',
          description: 'Test description',
          is_public: true,
          tags: ['tag1', 'tag2']
        })
      })

      expect(mockNavigate).toHaveBeenCalledWith('/testuser?tab=decks')
    })

    it('handles API error gracefully', async () => {
      const mockCreateDeck = vi.mocked(apiClient.createDeck)
      mockCreateDeck.mockRejectedValue(new Error('API Error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <TestWrapper>
          <CreateDeck />
        </TestWrapper>
      )

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/deck title/i), {
        target: { value: 'Test Deck' }
      })
      fireEvent.click(screen.getByRole('button', { name: /create deck/i }))

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error creating deck:', expect.any(Error))
      })

      // Should not navigate on error
      expect(mockNavigate).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('shows loading state during submission', async () => {
      const mockCreateDeck = vi.mocked(apiClient.createDeck)
      mockCreateDeck.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(
        <TestWrapper>
          <CreateDeck />
        </TestWrapper>
      )

      fireEvent.change(screen.getByLabelText(/deck title/i), {
        target: { value: 'Test Deck' }
      })

      const createButton = screen.getByRole('button', { name: /create deck/i })
      fireEvent.click(createButton)

      expect(createButton).toBeDisabled()
      expect(createButton).toHaveTextContent('Creating...')
    })

    it('processes tags correctly', async () => {
      const mockCreateDeck = vi.mocked(apiClient.createDeck)
      mockCreateDeck.mockResolvedValue({
        id: 1,
        title: 'Test Deck',
        description: '',
        is_public: false,
        tags: ['tag1', 'tag2', 'tag3'],
        user_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: null,
        owner: mockUser,
        card_count: 0,
        is_starred: false
      })

      render(
        <TestWrapper>
          <CreateDeck />
        </TestWrapper>
      )

      fireEvent.change(screen.getByLabelText(/deck title/i), {
        target: { value: 'Test Deck' }
      })
      fireEvent.change(screen.getByLabelText(/tags/i), {
        target: { value: '  tag1 , tag2,  tag3  ,  ' }
      })

      fireEvent.click(screen.getByRole('button', { name: /create deck/i }))

      await waitFor(() => {
        expect(mockCreateDeck).toHaveBeenCalledWith({
          title: 'Test Deck',
          description: '',
          is_public: false,
          tags: ['tag1', 'tag2', 'tag3'] // Should trim whitespace and filter empty
        })
      })
    })
  })

  describe('Navigation', () => {
    it('navigates to user profile on cancel', () => {
      render(
        <TestWrapper>
          <CreateDeck />
        </TestWrapper>
      )

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/testuser?tab=decks')
    })

    it('navigates to user profile after successful creation', async () => {
      const mockCreateDeck = vi.mocked(apiClient.createDeck)
      mockCreateDeck.mockResolvedValue({
        id: 1,
        title: 'Test Deck',
        description: '',
        is_public: false,
        tags: [],
        user_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: null,
        owner: mockUser,
        card_count: 0,
        is_starred: false
      })

      render(
        <TestWrapper>
          <CreateDeck />
        </TestWrapper>
      )

      fireEvent.change(screen.getByLabelText(/deck title/i), {
        target: { value: 'Test Deck' }
      })
      fireEvent.click(screen.getByRole('button', { name: /create deck/i }))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/testuser?tab=decks')
      })
    })
  })

  describe('Form Validation', () => {
    it('validates required title field', () => {
      render(
        <TestWrapper>
          <CreateDeck />
        </TestWrapper>
      )

      const createButton = screen.getByRole('button', { name: /create deck/i })
      expect(createButton).toBeDisabled()

      const titleInput = screen.getByLabelText(/deck title/i)
      fireEvent.change(titleInput, { target: { value: 'Valid Title' } })
      expect(createButton).not.toBeDisabled()

      fireEvent.change(titleInput, { target: { value: '' } })
      expect(createButton).toBeDisabled()
    })

    it('handles empty description gracefully', async () => {
      const mockCreateDeck = vi.mocked(apiClient.createDeck)
      mockCreateDeck.mockResolvedValue({
        id: 1,
        title: 'Test Deck',
        description: '',
        is_public: false,
        tags: [],
        user_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: null,
        owner: mockUser,
        card_count: 0,
        is_starred: false
      })

      render(
        <TestWrapper>
          <CreateDeck />
        </TestWrapper>
      )

      fireEvent.change(screen.getByLabelText(/deck title/i), {
        target: { value: 'Test Deck' }
      })
      // Leave description empty
      fireEvent.click(screen.getByRole('button', { name: /create deck/i }))

      await waitFor(() => {
        expect(mockCreateDeck).toHaveBeenCalledWith({
          title: 'Test Deck',
          description: '',
          is_public: false,
          tags: []
        })
      })
    })

    it('handles empty tags gracefully', async () => {
      const mockCreateDeck = vi.mocked(apiClient.createDeck)
      mockCreateDeck.mockResolvedValue({
        id: 1,
        title: 'Test Deck',
        description: 'Test description',
        is_public: false,
        tags: [],
        user_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: null,
        owner: mockUser,
        card_count: 0,
        is_starred: false
      })

      render(
        <TestWrapper>
          <CreateDeck />
        </TestWrapper>
      )

      fireEvent.change(screen.getByLabelText(/deck title/i), {
        target: { value: 'Test Deck' }
      })
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Test description' }
      })
      // Leave tags empty
      fireEvent.click(screen.getByRole('button', { name: /create deck/i }))

      await waitFor(() => {
        expect(mockCreateDeck).toHaveBeenCalledWith({
          title: 'Test Deck',
          description: 'Test description',
          is_public: false,
          tags: []
        })
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles whitespace-only tags correctly', async () => {
      const mockCreateDeck = vi.mocked(apiClient.createDeck)
      mockCreateDeck.mockResolvedValue({
        id: 1,
        title: 'Test Deck',
        description: '',
        is_public: false,
        tags: [],
        user_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: null,
        owner: mockUser,
        card_count: 0,
        is_starred: false
      })

      render(
        <TestWrapper>
          <CreateDeck />
        </TestWrapper>
      )

      fireEvent.change(screen.getByLabelText(/deck title/i), {
        target: { value: 'Test Deck' }
      })
      fireEvent.change(screen.getByLabelText(/tags/i), {
        target: { value: '   ,  ,   ' }
      })

      fireEvent.click(screen.getByRole('button', { name: /create deck/i }))

      await waitFor(() => {
        expect(mockCreateDeck).toHaveBeenCalledWith({
          title: 'Test Deck',
          description: '',
          is_public: false,
          tags: [] // Should filter out empty/whitespace tags
        })
      })
    })

    it('handles very long title', async () => {
      const longTitle = 'A'.repeat(200)
      const mockCreateDeck = vi.mocked(apiClient.createDeck)
      mockCreateDeck.mockResolvedValue({
        id: 1,
        title: longTitle,
        description: '',
        is_public: false,
        tags: [],
        user_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: null,
        owner: mockUser,
        card_count: 0,
        is_starred: false
      })

      render(
        <TestWrapper>
          <CreateDeck />
        </TestWrapper>
      )

      fireEvent.change(screen.getByLabelText(/deck title/i), {
        target: { value: longTitle }
      })
      fireEvent.click(screen.getByRole('button', { name: /create deck/i }))

      await waitFor(() => {
        expect(mockCreateDeck).toHaveBeenCalledWith({
          title: longTitle,
          description: '',
          is_public: false,
          tags: []
        })
      })
    })
  })
})
