'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { GameHistoryRow } from '@/lib/types'

export default function RatingHistoryChart({ data }: { data: GameHistoryRow[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
        No game history
      </div>
    )
  }
  const chartData = data.map(row => ({
    date: new Date(row.observed_at).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
    }),
    rating: row.rating_after,
  }))
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="date"
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} domain={['auto', 'auto']} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '4px' }}
          labelStyle={{ color: '#e5e7eb' }}
          itemStyle={{ color: '#60a5fa' }}
          formatter={(value) => [Number(value), 'Rating']}
        />
        <Line
          type="monotone"
          dataKey="rating"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
