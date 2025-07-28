"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Layout } from "@/components/layout/Layout"
import { StockDataTab } from "@/components/market/StockDataTab"

export default function StocksPage() {
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