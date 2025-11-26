// =============================================================================
// COMMON & UTILITY TYPES
// =============================================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface ApiError {
  message: string
  status?: number
  code?: string
}

export interface TabComponentProps {
  className?: string
  children?: React.ReactNode
}

