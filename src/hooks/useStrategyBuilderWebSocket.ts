'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { API_BASE_URL } from '@/constants'
import type {
  StrategyPnLMessage,
  MarketDataMessage,
  WebSocketMessage,
} from '@/types/strategy-builder'

interface UseStrategyBuilderWebSocketOptions {
  strategyId?: string
  onStrategyUpdate?: (data: StrategyPnLMessage['data']) => void
  onMarketData?: (data: MarketDataMessage['data']) => void
  onError?: (error: string) => void
}

export function useStrategyBuilderWebSocket({
  strategyId,
  onStrategyUpdate,
  onMarketData,
  onError,
}: UseStrategyBuilderWebSocketOptions = {}) {
  const { user, token } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    if (!user?.id || !token) {
      console.warn('User ID or token not available for WebSocket connection')
      return
    }

    try {
      const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws'
      const wsBase = API_BASE_URL.replace(/^https?/, wsProtocol)
      const wsUrl = `${wsBase}/api/strategy-builder/ws/strategy-builder/${String(user.id)}?token=${token}`
      
      console.log('Connecting to WebSocket:', wsUrl.replace(token, '***'))
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('✅ Strategy Builder WebSocket connected')
        setIsConnected(true)
        setError(null)
        reconnectAttempts.current = 0

        // Subscribe to strategy if provided
        if (strategyId) {
          ws.send(
            JSON.stringify({
              type: 'subscribe_strategy',
              strategy_id: strategyId,
            })
          )
        }
      }

      ws.onmessage = (event) => {
        try {
          const message: any = JSON.parse(event.data)
          console.log('WebSocket message received:', message.type)

          // Handle welcome message
          if (message.type === 'connected') {
            console.log('WebSocket connected:', message.message)
            return
          }

          // Handle pong (keep-alive response)
          if (message.type === 'pong') {
            console.log('WebSocket pong received')
            return
          }

          // Handle subscription result
          if (message.type === 'subscription_result') {
            console.log('Subscription result:', message.result)
            return
          }

          // Handle strategy P&L updates
          if (message.type === 'strategy_pnl') {
            // API returns: { type: "strategy_pnl", strategy_id: "...", result: { type: "success", strategy: {...} } }
            if (message.result && message.result.strategy) {
              const strategy = message.result.strategy
              if (onStrategyUpdate) {
                onStrategyUpdate({
                  strategy_id: message.strategy_id || strategy.strategy_id,
                  positions: strategy.positions || [],
                  total_pnl: strategy.total_pnl || 0,
                })
              }
            }
            return
          }

          // Handle strategy data updates
          if (message.type === 'strategy_data') {
            const strategyMessage = message as StrategyPnLMessage
            if (onStrategyUpdate && strategyMessage.data) {
              onStrategyUpdate(strategyMessage.data)
            }
            return
          }

          // Handle market data
          if (message.type === 'market_data') {
            const marketMessage = message as MarketDataMessage
            if (onMarketData && marketMessage.data) {
              onMarketData(marketMessage.data)
            }
            return
          }

          // Handle errors
          if (message.type === 'error' || message.error) {
            const errorMsg = message.error || message.message || 'Unknown error'
            console.error('WebSocket error message:', errorMsg)
            setError(errorMsg)
            if (onError) {
              onError(errorMsg)
            }
            return
          }

          // Log unhandled message types
          console.log('Unhandled WebSocket message type:', message.type, message)
        } catch (err) {
          console.error('Error parsing WebSocket message:', err, event.data)
        }
      }

      ws.onerror = (event) => {
        // WebSocket error event doesn't provide much info, log what we can
        console.error('WebSocket error event:', event)
        const errorMsg = 'WebSocket connection error. Please check if the backend is running.'
        setError(errorMsg)
        if (onError) {
          onError(errorMsg)
        }
      }

      ws.onclose = (event) => {
        console.log('Strategy Builder WebSocket disconnected', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        })
        setIsConnected(false)
        
        // Clear the ref so we can reconnect if needed
        wsRef.current = null

        // Only attempt to reconnect if:
        // 1. It wasn't a clean close (unexpected disconnect)
        // 2. We haven't exceeded max attempts
        // 3. The close code is not 1000 (normal closure) or 1001 (going away)
        const shouldReconnect = 
          !event.wasClean && 
          event.code !== 1000 && 
          event.code !== 1001 &&
          reconnectAttempts.current < maxReconnectAttempts

        if (shouldReconnect) {
          reconnectAttempts.current += 1
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`)
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          const errorMsg = 'Max reconnection attempts reached. Please refresh the page.'
          setError(errorMsg)
          if (onError) {
            onError(errorMsg)
          }
        }
      }

      wsRef.current = ws
    } catch (err) {
      console.error('Error creating WebSocket:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to create WebSocket'
      setError(errorMsg)
      if (onError) {
        onError(errorMsg)
      }
    }
  }, [user?.id, token, strategyId, onStrategyUpdate, onMarketData, onError])

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
  }, [])

  const subscribeStrategy = useCallback(
    (id: string) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'subscribe_strategy',
            strategy_id: id,
          })
        )
      }
    },
    []
  )

  const getStrategyPnL = useCallback(
    (id: string) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'get_strategy_pnl',
            strategy_id: id,
          })
        )
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
      }, 1000)
      
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
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, token]) // Only depend on user and token, not connect/disconnect

  // Update subscription when strategyId changes
  useEffect(() => {
    if (strategyId && isConnected) {
      subscribeStrategy(strategyId)
    }
  }, [strategyId, isConnected, subscribeStrategy])

  return {
    isConnected,
    error,
    subscribeStrategy,
    getStrategyPnL,
    disconnect,
    connect,
  }
}

