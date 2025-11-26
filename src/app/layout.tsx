import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { AppProviders } from "@/components/providers/AppProviders"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "IIFL Trading App",
  description: "Professional trading platform with IIFL integration",
  keywords: ["trading", "IIFL", "stock market", "portfolio", "investments"],
  authors: [{ name: "IIFL Trading Team" }],
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <AppProviders>
          <div className="min-h-screen bg-white overflow-x-hidden">
            {children}
          </div>
        </AppProviders>
      </body>
    </html>
  )
}
