'use client'

export default function Error({
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <p className="text-gray-400 mb-4">Something went wrong.</p>
      <button onClick={reset} className="text-blue-400 hover:underline text-sm">
        Try again
      </button>
    </main>
  )
}
