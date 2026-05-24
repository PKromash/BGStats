import type { PlayerStats } from '@/lib/types'

export default function StatsGrid({ stats }: { stats: PlayerStats }) {
  const deltaStr = stats.avg_rating_delta >= 0
    ? `+${stats.avg_rating_delta.toFixed(1)}`
    : stats.avg_rating_delta.toFixed(1)

  return (
    <div className="grid grid-cols-4 gap-3">
      <StatCard label="Rating" value={stats.current_rating ?? stats.peak_rating} />
      <StatCard label="Avg Place" value={stats.avg_placement.toFixed(2)} />
      <StatCard label="1st Place %" value={`${stats.first_place_pct.toFixed(1)}%`} />
      <StatCard label="Avg Δ" value={deltaStr} />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-800 rounded p-4 text-center">
      <div className="text-gray-200 text-xl font-semibold">{value}</div>
      <div className="text-gray-400 text-xs mt-1">{label}</div>
    </div>
  )
}
