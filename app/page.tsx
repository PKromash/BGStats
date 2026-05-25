import { getLeaderboard, getLeaderboardCount } from '@/lib/queries'
import LeaderboardTable from '@/components/LeaderboardTable'
import LeaderboardPagination from '@/components/LeaderboardPagination'

const PAGE_SIZE = 100

export default async function Home({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const currentPage = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)
  const offset = (currentPage - 1) * PAGE_SIZE

  const [rows, total] = await Promise.all([
    getLeaderboard(18, PAGE_SIZE, offset),
    getLeaderboardCount(18),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-100 mb-6">Season 18 Leaderboard</h1>
      <LeaderboardTable rows={rows} />
      <LeaderboardPagination currentPage={currentPage} totalPages={totalPages} />
    </main>
  )
}
