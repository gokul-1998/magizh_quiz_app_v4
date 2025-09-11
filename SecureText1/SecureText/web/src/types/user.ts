// User profile data interface
export interface UserProfileData {
  id: number
  name: string
  username: string
  bio?: string
  avatar_url?: string
  created_at: string
  total_decks: number
  total_stars: number
  current_streak: number
}

// Deck interface for display purposes
export interface Deck {
  id: number
  title: string
  description: string
  card_count: number
  is_starred?: boolean
  tags?: string[]
  user_id?: number
  is_public?: boolean
  created_at?: string
  updated_at?: string
}

// Tab configuration interface
export interface TabConfig {
  id: string
  label: string
  count?: number
}
