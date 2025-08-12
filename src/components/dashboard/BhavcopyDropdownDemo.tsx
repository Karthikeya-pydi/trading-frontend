"use client"

import { useState } from "react"
import { StockBhavcopyDropdown } from "./StockBhavcopyDropdown"

export function BhavcopyDropdownDemo() {
  const [expandedStock, setExpandedStock] = useState<string | null>(null)

  const demoStocks = [
    { symbol: "RELIANCE", name: "Reliance Industries Ltd" },
    { symbol: "TCS", name: "Tata Consultancy Services Ltd" },
    { symbol: "HDFCBANK", name: "HDFC Bank Ltd" },
    { symbol: "INFY", name: "Infosys Ltd" },
    { symbol: "ICICIBANK", name: "ICICI Bank Ltd" }
  ]

  const toggleStock = (symbol: string) => {
    setExpandedStock(expandedStock === symbol ? null : symbol)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bhavcopy Dropdown Demo</h1>
        <p className="text-gray-600">Click on any stock to see the bhavcopy data dropdown</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Portfolio Holdings</h2>
          <p className="text-sm text-gray-600">Your current stock positions with market data</p>
        </div>

        <div className="divide-y divide-gray-200">
          {demoStocks.map((stock, index) => (
            <div key={stock.symbol} className="bg-white">
              {/* Stock Row */}
              <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-gray-900">{stock.name}</div>
                    <div className="text-sm text-gray-500">Symbol: {stock.symbol}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">₹2,450.00</div>
                      <div className="text-sm text-green-600">+₹45.20 (+1.88%)</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">100</div>
                      <div className="text-sm text-gray-500">Qty</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">₹245,000</div>
                      <div className="text-sm text-gray-500">Value</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bhavcopy Dropdown */}
              <StockBhavcopyDropdown
                stockSymbol={stock.symbol}
                stockName={stock.name}
                isExpanded={expandedStock === stock.symbol}
                onToggle={() => toggleStock(stock.symbol)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Click on any stock row to expand and see bhavcopy data</li>
          <li>• The dropdown fetches real-time market data from your files</li>
          <li>• Data includes OHLC prices, volume, turnover, delivery statistics, and more</li>
          <li>• Each dropdown is independent and loads data only when expanded</li>
          <li>• Beautiful, organized display with color-coded information</li>
        </ul>
      </div>
    </div>
  )
}
