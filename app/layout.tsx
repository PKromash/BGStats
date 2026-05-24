import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/NavBar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BGStats',
  description: 'Hearthstone Battlegrounds leaderboard tracker',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <NavBar />
        {children}
      </body>
    </html>
  )
}
