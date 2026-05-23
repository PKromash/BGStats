// __tests__/api/leaderboard.test.ts
import { GET } from '@/app/api/leaderboard/route'
import { getLeaderboard } from '@/lib/queries'
import type { LeaderboardRow } from '@/lib/types'

jest.mock('@/lib/queries')

const mockGetLeaderboard = jest.mocked(getLeaderboard)

const sampleRows: LeaderboardRow[] = [
  { rank: 1, player_name: 'xqn', rating: 12000, rating_delta_24h: 150 },
  { rank: 2, player_name: 'jeef', rating: 11800, rating_delta_24h: null },
]

describe('GET /api/leaderboard', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns leaderboard rows', async () => {
    mockGetLeaderboard.mockResolvedValue(sampleRows)
    const req = new Request('http://localhost/api/leaderboard')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(sampleRows)
    expect(mockGetLeaderboard).toHaveBeenCalledWith(18, 100)
  })

  it('returns empty array when no data', async () => {
    mockGetLeaderboard.mockResolvedValue([])
    const req = new Request('http://localhost/api/leaderboard')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('respects the season query param', async () => {
    mockGetLeaderboard.mockResolvedValue([])
    const req = new Request('http://localhost/api/leaderboard?season=17')
    await GET(req)
    expect(mockGetLeaderboard).toHaveBeenCalledWith(17, 100)
  })

  it('returns 500 on DB error', async () => {
    mockGetLeaderboard.mockRejectedValue(new Error('db down'))
    const req = new Request('http://localhost/api/leaderboard')
    const res = await GET(req)
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'internal server error' })
  })
})
