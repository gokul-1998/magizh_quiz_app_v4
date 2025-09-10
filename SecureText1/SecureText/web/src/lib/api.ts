const API_BASE_URL = 'http://localhost:8001'

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

  async starDeck(deckId: number) {
    return this.request<{message: string; is_starred: boolean}>(`/api/decks/${deckId}/star`, {
      method: 'POST',
    })
  }

  // Card endpoints
  async getCards(deckId?: number) {
    const params = deckId ? `?deck_id=${deckId}` : ''
    return this.request<any[]>(`/api/cards${params}`)
  }

  // Health check
  async healthCheck() {
    return this.request<{status: string; message: string}>('/health')
  }
}

export const apiClient = new ApiClient()
export default apiClient