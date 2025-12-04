'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { API_BASE_URL } from '@/constants'
import type { MarketDataMessage, WebSocketMessage } from '@/types/strategy-builder'

interface UseMarketDataWebSocketOptions {
  stocks?: string[]
  onMarketData?: (data: MarketDataMessage['data']) => void
  onError?: (error: string) => void
}

export function useMarketDataWebSocket({
  stocks = [],
  onMarketData,
  onError,
}: UseMarketDataWebSocketOptions = {}) {
  const { user, token } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const subscribedStocksRef = useRef<Set<string>>(new Set())

  const connect = useCallback(() => {
    if (!user?.id || !token) {
      console.warn('User ID or token not available for WebSocket connection')
      return
    }

    try {
      const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws'
      const wsBase = API_BASE_URL.replace(/^https?/, wsProtocol)
      const wsUrl = `${wsBase}/api/ws/market-data/${String(user.id)}?token=${token}`
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('Market Data WebSocket connected')
        setIsConnected(true)
        setError(null)
        reconnectAttempts.current = 0

        // Subscribe to initial stocks
        stocks.forEach((stock) => {
          if (!subscribedStocksRef.current.has(stock)) {
            ws.send(
              JSON.stringify({
                type: 'subscribe_stock',
                stock_name: stock,
              })
            )
            subscribedStocksRef.current.add(stock)
          }
        })
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)

          if (message.type === 'market_data') {
            const marketMessage = message as MarketDataMessage
            if (onMarketData && marketMessage.data) {
              onMarketData(marketMessage.data)
            }
          } else if (message.type === 'error') {
            const errorMsg = message.error || 'Unknown error'
            setError(errorMsg)
            if (onError) {
              onError(errorMsg)
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      ws.onerror = (event) => {
        console.error('WebSocket error:', event)
        setError('WebSocket connection error')
        if (onError) {
          onError('WebSocket connection error')
        }
      }

      ws.onclose = () => {
        console.log('Market Data WebSocket disconnected')
        setIsConnected(false)
        subscribedStocksRef.current.clear()

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`)
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        } else {
          setError('Max reconnection attempts reached')
        }
      }

      wsRef.current = ws
    } catch (err) {
      console.error('Error creating WebSocket:', err)
      setError(err instanceof Error ? err.message : 'Failed to create WebSocket')
    }
  }, [user?.id, token, stocks, onMarketData, onError])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
    subscribedStocksRef.current.clear()
  }, [])

  const subscribeStock = useCallback(
    (stockName: string) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        if (!subscribedStocksRef.current.has(stockName)) {
          wsRef.current.send(
            JSON.stringify({
              type: 'subscribe_stock',
              stock_name: stockName,
            })
          )
          subscribedStocksRef.current.add(stockName)
        }
      }
    },
    []
  )

  const unsubscribeStock = useCallback(
    (stockName: string) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'unsubscribe_stock',
            stock_name: stockName,
          })
        )
        subscribedStocksRef.current.delete(stockName)
      }
    },
    []
  )

  useEffect(() => {
    // Only connect if user and token are available
    // WebSocket is optional - app should work without it
    if (user?.id && token && !wsRef.current) {
      // Delay connection slightly to avoid blocking initial render
      const timeoutId = setTimeout(() => {
        connect()
      }, 1500) // Delay market data WS a bit more to avoid conflicts
      
      return () => {
        clearTimeout(timeoutId)
        if (wsRef.current) {
          wsRef.current.close()
          wsRef.current = null
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
        setIsConnected(false)
        subscribedStocksRef.current.clear()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, token]) // Only depend on user and token

  // Update subscriptions when stocks change
  useEffect(() => {
    if (isConnected && wsRef.current) {
      // Subscribe to new stocks
      stocks.forEach((stock) => {
        if (!subscribedStocksRef.current.has(stock)) {
          subscribeStock(stock)
        }
      })

      // Unsubscribe from removed stocks
      subscribedStocksRef.current.forEach((stock) => {
        if (!stocks.includes(stock)) {
          unsubscribeStock(stock)
        }
      })
    }
  }, [stocks, isConnected, subscribeStock, unsubscribeStock])

  return {
    isConnected,
    error,
    subscribeStock,
    unsubscribeStock,
    disconnect,
    connect,
  }
}

