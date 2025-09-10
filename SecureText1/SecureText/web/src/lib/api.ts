const API_BASE_URL = `https://616683ff-c11d-482d-a0ed-5eebff033948-00-222v5u5g089n7.sisko.replit.dev:8001`

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
    this.loadToken()
  }

  private loadToken() {
    // Try to get token from localStorage for demo purposes
    this.token = localStorage.getItem('access_token')
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    
    return headers
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
      credentials: 'include', // Include cookies
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Auth endpoints
  async demoLogin() {
    const result = await this.request<{access_token: string; user: any}>('/api/auth/demo-login', {
      method: 'POST',
    })
    
    this.token = result.access_token
    localStorage.setItem('access_token', result.access_token)
    
    return result
  }

  async logout() {
    await this.request('/api/auth/logout', { method: 'POST' })
    this.token = null
    localStorage.removeItem('access_token')
  }

  async getCurrentUser() {
    return this.request<any>('/api/auth/me')
  }

  async completeSignup(userData: { username: string }) {
    return this.request<any>('/api/auth/complete-signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async getUserProfile(username: string) {
    return this.request<any>(`/api/users/profile/${username}`)
  }

  async getUserDecks(username: string, params: {
    skip?: number
    limit?: number
    search?: string
  } = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })
    
    const query = searchParams.toString()
    return this.request<any[]>(`/api/users/profile/${username}/decks${query ? `?${query}` : ''}`)
  }

  async getDiscoverUsers(params: {
    skip?: number
    limit?: number
    search?: string
  } = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })
    
    const query = searchParams.toString()
    return this.request<any[]>(`/api/users/discover${query ? `?${query}` : ''}`)
  }

  // Deck endpoints
  async getDecks(params: {
    skip?: number
    limit?: number
    public_only?: boolean
    search?: string
    tags?: string
  } = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })
    
    const query = searchParams.toString()
    return this.request<any[]>(`/api/decks${query ? `?${query}` : ''}`)
  }

  async createDeck(deck: {
    title: string
    description?: string
    is_public?: boolean
    tags?: string[]
  }) {
    return this.request<any>('/api/decks', {
      method: 'POST',
      body: JSON.stringify(deck),
    })
  }

  async getDeck(deckId: number) {
    return this.request<any>(`/api/decks/${deckId}`)
  }

  async updateDeck(deckId: number, updates: {
    title?: string
    description?: string
    is_public?: boolean
    tags?: string[]
  }) {
    return this.request<any>(`/api/decks/${deckId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deleteDeck(deckId: number) {
    return this.request<{message: string}>(`/api/decks/${deckId}`, {
      method: 'DELETE',
    })
  }

  async starDeck(deckId: number) {
    return this.request<{message: string; is_starred: boolean}>(`/api/decks/${deckId}/star`, {
      method: 'POST',
    })
  }

  async duplicateDeck(deckId: number) {
    return this.request<any>(`/api/decks/${deckId}/duplicate`, {
      method: 'POST',
    })
  }

  // User endpoints
  async getUserByUsername(username: string) {
    return this.request<any>(`/api/users/profile/${username}`)
  }

  async getUserProgress(username: string) {
    return this.request<any[]>(`/api/users/profile/${username}/progress`)
  }

  async getUserStats(username: string) {
    return this.request<any>(`/api/users/profile/${username}/stats`)
  }

  // Card endpoints
  async getCards(deckId?: number) {
    const params = deckId ? `?deck_id=${deckId}` : ''
    return this.request<any[]>(`/api/cards${params}`)
  }

  async getDeckCards(deckId: number) {
    return this.request<any[]>(`/api/decks/${deckId}/cards`)
  }

  async createCard(card: {
    deck_id: number
    question: string
    question_type: string
    options: string[]
    correct_answers: string[]
    explanation?: string
    tags?: string[]
  }) {
    return this.request<any>('/api/cards', {
      method: 'POST',
      body: JSON.stringify(card),
    })
  }

  async updateCard(cardId: number, updates: {
    question?: string
    question_type?: string
    options?: string[]
    correct_answers?: string[]
    explanation?: string
    tags?: string[]
  }) {
    return this.request<any>(`/api/cards/${cardId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deleteCard(cardId: number) {
    return this.request<{message: string}>(`/api/cards/${cardId}`, {
      method: 'DELETE',
    })
  }

  async bookmarkCard(cardId: number) {
    return this.request<{message: string; is_bookmarked: boolean}>(`/api/cards/${cardId}/bookmark`, {
      method: 'POST',
    })
  }

  // Health check
  async healthCheck() {
    return this.request<{status: string; message: string}>('/health')
  }
}

export const apiClient = new ApiClient()
export default apiClient