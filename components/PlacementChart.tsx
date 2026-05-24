'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { PlacementDistributionRow } from '@/lib/types'

export default function PlacementChart({ data }: { data: PlacementDistributionRow[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
        No games in this window
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="placement" tick={{ fill: '#9ca3af', fontSize: 12 }} />
        <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '4px' }}
          labelStyle={{ color: '#e5e7eb' }}
          itemStyle={{ color: '#60a5fa' }}
          formatter={(value) => [Number(value), 'Games']}
          labelFormatter={(label) => {
            const n = Number(label)
            const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'
            return `${n}${suffix} place`
          }}
        />
        <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
