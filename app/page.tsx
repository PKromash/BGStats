import { getLeaderboard } from '@/lib/queries'
import LeaderboardTable from '@/components/LeaderboardTable'

export default async function Home() {
  const rows = await getLeaderboard()
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-100 mb-6">Season 18 Leaderboard</h1>
      <LeaderboardTable rows={rows} />
    </main>
  )
}
