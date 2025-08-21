'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Layout } from '@/components/layout/Layout'
import StockSearch from '@/components/trading/StockSearch'
import TradingForm from '@/components/trading/TradingForm'
import OrderBook from '@/components/trading/OrderBook'
import TradeHistory from '@/components/trading/TradeHistory'
import ExchangeStatus from '@/components/trading/ExchangeStatus'

export default function TradingPage() {
  const [selectedStock, setSelectedStock] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('trade')

  return (
    <Layout title="Trading">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trading</h1>
            <p className="text-gray-600 mt-2">Buy and sell stocks with real-time market data</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Exchange Status */}
            <ExchangeStatus />
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-green-600 border-green-200">
                Live Market
              </Badge>
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                IIFL Connected
              </Badge>
            </div>
          </div>
        </div>

        {/* Stock Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Stocks</CardTitle>
            <CardDescription>
              Find stocks by name, symbol, or ISIN to start trading
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StockSearch onStockSelect={setSelectedStock} />
          </CardContent>
        </Card>

        {/* Selected Stock Info */}
        {selectedStock && (
          <Card className="border-green-200 bg-green-50 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedStock.symbol} - {selectedStock.name}</span>
                <Badge variant="secondary" className="text-sm">
                  ₹{selectedStock.current_price?.toFixed(2) || 'N/A'}
                </Badge>
              </CardTitle>
              <CardDescription>
                {selectedStock.exchange_segment === 1 ? 'NSE' : 'BSE'} • 
                ISIN: {selectedStock.isin} • 
                Lot Size: {selectedStock.lot_size}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Main Trading Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trade">Trade</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="trades">Trade History</TabsTrigger>
          </TabsList>

          <TabsContent value="trade" className="space-y-4">
            {selectedStock ? (
              <Card>
                <CardHeader>
                  <CardTitle>Place Order</CardTitle>
                  <CardDescription>
                    Trade {selectedStock.symbol} - {selectedStock.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TradingForm 
                    selectedStock={selectedStock}
                    onOrderPlaced={() => {
                      setActiveTab('orders')
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Ready to Trade?</h3>
                  <p className="text-gray-500">
                    Search for a stock above to start trading. You'll be able to place buy/sell orders once you select a stock.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <OrderBook />
          </TabsContent>

          <TabsContent value="trades" className="space-y-4">
            <TradeHistory />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}
