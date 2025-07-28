"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Layout } from "@/components/layout/Layout"
import { StockDataTab } from "@/components/market/StockDataTab"
import { Loader2 } from "lucide-react"

function StocksContent() {
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get('search') || ""

  return (
    <Layout title="Stocks">
      <div className="max-w-7xl mx-auto">
        <StockDataTab initialSearch={initialSearch} />
      </div>
    </Layout>
  )
}

function LoadingFallback() {
  return (
    <Layout title="Stocks">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading stocks...</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default function StocksPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <StocksContent />
    </Suspense>
  )
} 