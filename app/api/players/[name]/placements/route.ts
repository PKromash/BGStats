// app/api/players/[name]/placements/route.ts
import { NextResponse } from 'next/server'
import { getPlacementDistribution } from '@/lib/queries'
import type { StatsWindow } from '@/lib/types'

const VALID_WINDOWS: StatsWindow[] = ['7d', '30d', 'season']

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
): Promise<NextResponse> {
  try {
    const { name } = params
    const url = new URL(request.url)
    const rawSeason = parseInt(url.searchParams.get('season') ?? '18', 10)
    const season = isNaN(rawSeason) ? 18 : rawSeason
    const rawWindow = url.searchParams.get('window') ?? 'season'
    const window: StatsWindow = VALID_WINDOWS.includes(rawWindow as StatsWindow)
      ? (rawWindow as StatsWindow)
      : 'season'
    const rows = await getPlacementDistribution(name, season, window)
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}
