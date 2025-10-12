"use client"

import { useState } from "react"
import { Layout } from "@/components/layout/Layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, TrendingUp, Activity, Search } from "lucide-react"
import ReturnsTab from "@/components/analysis/ReturnsTab"
import BhavcopyTab from "@/components/analysis/BhavcopyTab"
import StockAnalysisTab from "@/components/analysis/StockAnalysisTab"

export default function AnalysisPage() {
  const [activeTab, setActiveTab] = useState("returns")

  return (
    <Layout title="Market Analysis">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Market Analysis</h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Comprehensive analysis of stock returns and market data</p>
          </div>
        </div>



        {/* Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-teal-600" />
              <span>Analysis Dashboard</span>
            </CardTitle>
            <CardDescription>
              Choose between comprehensive stock analysis, returns analysis, and market bhavcopy data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="returns" className="flex items-center justify-center gap-1 sm:gap-2">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline">Stock Returns</span>
                  <span className="sm:hidden">Returns</span>
                </TabsTrigger>
                <TabsTrigger value="stock-analysis" className="flex items-center justify-center gap-1 sm:gap-2">
                  <Search className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline">Stock Analysis</span>
                  <span className="sm:hidden">Analysis</span>
                </TabsTrigger>
                <TabsTrigger value="bhavcopy" className="flex items-center justify-center gap-1 sm:gap-2">
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline">Bhavcopy Data</span>
                  <span className="sm:hidden">Bhavcopy</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="returns" className="mt-6">
                <ReturnsTab />
              </TabsContent>

              <TabsContent value="stock-analysis" className="mt-6">
                <StockAnalysisTab />
              </TabsContent>

              <TabsContent value="bhavcopy" className="mt-6">
                <BhavcopyTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
