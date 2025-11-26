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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Trading</h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Buy and sell stocks with real-time market data</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            {/* Exchange Status */}
            <ExchangeStatus />
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-green-600 border-green-200 text-xs sm:text-sm">
                Live Market
              </Badge>
              <Badge variant="outline" className="text-teal-600 border-teal-200 text-xs sm:text-sm">
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
          <Card className="border-green-200 bg-green-50 mb-6 shadow-premium">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-base sm:text-lg">{selectedStock.symbol} - {selectedStock.name}</span>
                <Badge variant="secondary" className="text-sm w-fit">
                  ₹{selectedStock.current_price?.toFixed(2) || 'N/A'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {selectedStock.exchange_segment === 1 ? 'NSE' : 'BSE'} • 
                ISIN: {selectedStock.isin} • 
                Lot Size: {selectedStock.lot_size}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Main Trading Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 border border-gray-200 shadow-premium rounded-xl p-1">
            <TabsTrigger value="trade" className="data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-md data-[state=active]:scale-105 text-gray-700 transition-all duration-300">Trade</TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-md data-[state=active]:scale-105 text-gray-700 transition-all duration-300">Orders</TabsTrigger>
            <TabsTrigger value="trades" className="data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-md data-[state=active]:scale-105 text-gray-700 transition-all duration-300">History</TabsTrigger>
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
