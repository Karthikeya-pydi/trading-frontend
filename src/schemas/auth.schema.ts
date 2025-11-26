import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const setupFormSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  interactive_api_key: z.string().min(1, 'Interactive API key is required'),
  interactive_secret_key: z.string().min(1, 'Interactive secret key is required'),
  market_api_key: z.string().min(1, 'Market API key is required'),
  market_secret_key: z.string().min(1, 'Market secret key is required'),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type SetupFormData = z.infer<typeof setupFormSchema>

