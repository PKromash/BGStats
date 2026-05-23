// app/api/search/route.ts
import { NextResponse } from 'next/server'
import { searchPlayers } from '@/lib/queries'

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const q = new URL(request.url).searchParams.get('q') ?? ''
    if (!q) return NextResponse.json([])
    const results = await searchPlayers(q.toLowerCase())
    return NextResponse.json(results)
  } catch {
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}
