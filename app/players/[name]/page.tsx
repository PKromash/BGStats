import { getPlayerStats, getPlacementDistribution, getPlayerHistory } from '@/lib/queries'
import { validateWindow } from '@/lib/utils'
import StatsGrid from '@/components/StatsGrid'
import WindowSelector from '@/components/WindowSelector'
import PlacementChart from '@/components/PlacementChart'
import RatingHistoryChart from '@/components/RatingHistoryChart'

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: { name: string }
  searchParams: { window?: string }
}) {
  const name = decodeURIComponent(params.name)
  const window = validateWindow(searchParams.window)

  const [stats, placements, history] = await Promise.all([
    getPlayerStats(name, 18, window),
    getPlacementDistribution(name, 18, window),
    getPlayerHistory(name, 18),
  ])

  if (!stats) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-gray-400">Player &quot;{name}&quot; not found.</p>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">{name}</h1>
          {stats.current_rank !== null && (
            <p className="text-gray-400 text-sm mt-1">Rank #{stats.current_rank}</p>
          )}
        </div>
        <WindowSelector current={window} />
      </div>
      <div className="mb-6">
        <StatsGrid stats={stats} />
      </div>
      <div className="bg-gray-900 rounded p-4 mb-4">
        <h2 className="text-gray-400 text-sm font-medium mb-3">Placement Distribution</h2>
        <PlacementChart data={placements} />
      </div>
      <div className="bg-gray-900 rounded p-4">
        <h2 className="text-gray-400 text-sm font-medium mb-3">Rating History</h2>
        <RatingHistoryChart data={history} />
      </div>
    </main>
  )
}
