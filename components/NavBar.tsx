'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { PlayerSearchResult } from '@/lib/types'

export default function NavBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlayerSearchResult[]>([])
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!query) {
      setResults([])
      setOpen(false)
      return
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data: PlayerSearchResult[] = await res.json()
      setResults(data)
      setOpen(data.length > 0)
    }, 300)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  const handleSelect = (name: string) => {
    setQuery('')
    setOpen(false)
    router.push(`/players/${encodeURIComponent(name)}`)
  }

  return (
    <nav className="flex items-center gap-4 px-6 py-3 border-b border-gray-800 bg-gray-950">
      <Link href="/" className="text-blue-400 font-bold text-lg">
        BGStats
      </Link>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search players..."
          className="bg-gray-800 text-gray-100 placeholder-gray-500 rounded px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {open && (
          <ul className="absolute top-full left-0 mt-1 w-full bg-gray-800 rounded shadow-lg z-10 max-h-60 overflow-auto">
            {results.map(r => (
              <li key={r.id}>
                <button
                  onClick={() => handleSelect(r.player_name)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700"
                >
                  {r.player_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </nav>
  )
}
