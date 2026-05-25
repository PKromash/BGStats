'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function LeaderboardPagination({
  currentPage,
  totalPages,
}: {
  currentPage: number
  totalPages: number
}) {
  const router = useRouter()
  const [inputPage, setInputPage] = useState(String(currentPage))

  useEffect(() => {
    setInputPage(String(currentPage))
  }, [currentPage])

  const goToPage = (page: number) => {
    const p = Math.max(1, Math.min(page, totalPages))
    router.push(p === 1 ? '/' : `/?page=${p}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const p = parseInt(inputPage, 10)
    if (!isNaN(p)) goToPage(p)
  }

  return (
    <div className="flex items-center gap-3 mt-6 text-sm">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-3 py-1 rounded bg-gray-800 text-gray-300 disabled:opacity-40 hover:bg-gray-700 disabled:cursor-not-allowed"
      >
        ← Prev
      </button>
      <span className="text-gray-400">Page {currentPage} of {totalPages}</span>
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-3 py-1 rounded bg-gray-800 text-gray-300 disabled:opacity-40 hover:bg-gray-700 disabled:cursor-not-allowed"
      >
        Next →
      </button>
      <form onSubmit={handleSubmit} className="flex items-center gap-2 ml-2">
        <input
          type="number"
          min={1}
          max={totalPages}
          value={inputPage}
          onChange={e => setInputPage(e.target.value)}
          className="w-16 bg-gray-800 text-gray-100 rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-3 py-1 rounded bg-gray-800 text-gray-300 hover:bg-gray-700"
        >
          Go
        </button>
      </form>
    </div>
  )
}
