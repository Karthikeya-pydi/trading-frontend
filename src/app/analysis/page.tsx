"use client"

import { useState } from "react"
import { Layout } from "@/components/layout/Layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, TrendingUp, Activity } from "lucide-react"
import ReturnsTab from "@/components/analysis/ReturnsTab"
import BhavcopyTab from "@/components/analysis/BhavcopyTab"

export default function AnalysisPage() {
  const [activeTab, setActiveTab] = useState("returns")

  return (
    <Layout title="Market Analysis">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Market Analysis</h1>
            <p className="text-gray-600 mt-2">Comprehensive analysis of stock returns and market data</p>
          </div>
        </div>



        {/* Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              <span>Analysis Dashboard</span>
            </CardTitle>
            <CardDescription>
              Choose between stock returns analysis and market bhavcopy data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="returns" className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Stock Returns</span>
                </TabsTrigger>
                <TabsTrigger value="bhavcopy" className="flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span>Bhavcopy Data</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="returns" className="mt-6">
                <ReturnsTab />
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
