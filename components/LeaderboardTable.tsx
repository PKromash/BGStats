import Link from 'next/link'
import type { LeaderboardRow } from '@/lib/types'

export default function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-gray-400 border-b border-gray-800">
          <th className="pb-2 pr-4 font-medium">Rank</th>
          <th className="pb-2 pr-4 font-medium">Player</th>
          <th className="pb-2 pr-4 font-medium">Rating</th>
          <th className="pb-2 font-medium">24h Δ</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.player_name} className="border-b border-gray-800/50 hover:bg-gray-800/30">
            <td className="py-2 pr-4 text-gray-400">#{row.rank}</td>
            <td className="py-2 pr-4">
              <Link
                href={`/players/${encodeURIComponent(row.player_name)}`}
                className="text-blue-400 hover:underline"
              >
                {row.player_name}
              </Link>
            </td>
            <td className="py-2 pr-4 text-gray-200">{row.rating}</td>
            <td className={`py-2 ${
              row.rating_delta_24h === null
                ? 'text-gray-500'
                : row.rating_delta_24h >= 0
                  ? 'text-green-400'
                  : 'text-red-400'
            }`}>
              {row.rating_delta_24h === null
                ? '—'
                : row.rating_delta_24h >= 0
                  ? `+${row.rating_delta_24h}`
                  : row.rating_delta_24h}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
