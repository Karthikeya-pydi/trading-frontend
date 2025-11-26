import { z } from 'zod'

export const orderFormSchema = z.object({
  underlying_instrument: z.string().optional(),
  option_type: z.string().optional(),
  strike_price: z.number().positive().optional(),
  expiry_date: z.string().optional(),
  order_type: z.enum(['LIMIT', 'MARKET', 'SL', 'SLM'], {
    errorMap: () => ({ message: 'Invalid order type' }),
  }),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  price: z.number().positive('Price must be positive'),
  stop_loss_price: z.number().positive().optional(),
  symbol: z.string().optional(),
  side: z.enum(['BUY', 'SELL']).optional(),
}).refine(
  (data) => {
    // If option_type is provided, strike_price and expiry_date are required
    if (data.option_type) {
      return data.strike_price !== undefined && data.expiry_date !== undefined
    }
    return true
  },
  {
    message: 'Strike price and expiry date are required when option type is specified',
    path: ['strike_price'],
  }
)

export const cancelOrderSchema = z.object({
  order_id: z.union([z.string(), z.number()]),
})

export const modifyOrderSchema = z.object({
  order_id: z.union([z.string(), z.number()]),
  quantity: z.number().int().positive().optional(),
  price: z.number().positive().optional(),
})

export const squareOffSchema = z.object({
  position_id: z.string().min(1, 'Position ID is required'),
})

export type OrderFormData = z.infer<typeof orderFormSchema>
export type CancelOrderData = z.infer<typeof cancelOrderSchema>
export type ModifyOrderData = z.infer<typeof modifyOrderSchema>
export type SquareOffData = z.infer<typeof squareOffSchema>

