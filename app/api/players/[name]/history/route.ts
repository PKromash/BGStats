// app/api/players/[name]/history/route.ts
import { NextResponse } from 'next/server'
import { getPlayerHistory } from '@/lib/queries'

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
): Promise<NextResponse> {
  try {
    const { name } = params
    const season = parseInt(new URL(request.url).searchParams.get('season') ?? '18', 10)
    const rows = await getPlayerHistory(name, season)
    if (rows.length === 0) {
      return NextResponse.json({ error: 'player not found' }, { status: 404 })
    }
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}
