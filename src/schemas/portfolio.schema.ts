import { z } from 'zod'

export const updatePricesSchema = z.object({
  symbols: z.array(z.string()).optional(),
})

export type UpdatePricesData = z.infer<typeof updatePricesSchema>

