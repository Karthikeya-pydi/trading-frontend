// =============================================================================
// AUTHENTICATION TYPES
// =============================================================================

export interface User {
  id: number
  email: string
  name: string
  profile_picture?: string
  is_verified: boolean
  has_iifl_market_credentials: boolean
  has_iifl_interactive_credentials: boolean
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
}

export interface LoginForm {
  email: string
  password: string
}

export interface ApiKeys {
  market_api_key: string
  market_secret_key: string
  interactive_api_key?: string
  interactive_secret_key?: string
}

export interface IIFLCredentials {
  api_key: string
  secret_key: string
}

export interface SetupForm {
  market_api_key: string
  market_secret_key: string
  interactive_api_key: string
  interactive_secret_key: string
}

