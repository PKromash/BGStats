'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import type { StatsWindow } from '@/lib/types'

const WINDOWS: { value: StatsWindow; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: 'season', label: 'Season' },
]

export default function WindowSelector({ current }: { current: StatsWindow }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSelect = (w: StatsWindow) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('window', w)
    router.replace(`?${params.toString()}`)
  }

  return (
    <div className="flex gap-1">
      {WINDOWS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => handleSelect(value)}
          className={`px-3 py-1 rounded text-sm ${
            current === value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
