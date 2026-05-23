import { NextResponse } from 'next/server'
import { getPlayerStats } from '@/lib/queries'

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
): Promise<NextResponse> {
  try {
    const { name } = params
    const rawSeason = parseInt(new URL(request.url).searchParams.get('season') ?? '18', 10)
    const season = isNaN(rawSeason) ? 18 : rawSeason
    const stats = await getPlayerStats(name, season)
    if (!stats) {
      return NextResponse.json({ error: 'player not found' }, { status: 404 })
    }
    return NextResponse.json(stats)
  } catch {
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}
