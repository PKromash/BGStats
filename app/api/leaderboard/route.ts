// app/api/leaderboard/route.ts
import { NextResponse } from 'next/server'
import { getLeaderboard } from '@/lib/queries'

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const season = parseInt(new URL(request.url).searchParams.get('season') ?? '18', 10)
    const rows = await getLeaderboard(season, 100)
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}
