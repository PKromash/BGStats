// __tests__/api/stats.test.ts
import { GET } from '@/app/api/players/[name]/stats/route'
import { getPlayerStats } from '@/lib/queries'
import type { PlayerStats } from '@/lib/types'

jest.mock('@/lib/queries')

const mockGetPlayerStats = jest.mocked(getPlayerStats)

const makeParams = (name: string) => ({ params: { name } })

const sampleStats: PlayerStats = {
  games_played: 42,
  avg_placement: 3.8,
  first_place_pct: 14.3,
  avg_rating_delta: 12.5,
  peak_rating: 9200,
  current_rating: 8900,
  current_rank: 15,
}

describe('GET /api/players/[name]/stats', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns stats for a known player', async () => {
    mockGetPlayerStats.mockResolvedValue(sampleStats)
    const req = new Request('http://localhost/api/players/trumpsc/stats')
    const res = await GET(req, makeParams('trumpsc'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(sampleStats)
    expect(mockGetPlayerStats).toHaveBeenCalledWith('trumpsc', 18)
  })

  it('returns 404 when player not found', async () => {
    mockGetPlayerStats.mockResolvedValue(null)
    const req = new Request('http://localhost/api/players/unknown/stats')
    const res = await GET(req, makeParams('unknown'))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'player not found' })
  })

  it('respects the season query param', async () => {
    mockGetPlayerStats.mockResolvedValue(null)
    const req = new Request('http://localhost/api/players/trumpsc/stats?season=17')
    await GET(req, makeParams('trumpsc'))
    expect(mockGetPlayerStats).toHaveBeenCalledWith('trumpsc', 17)
  })

  it('returns 500 on DB error', async () => {
    mockGetPlayerStats.mockRejectedValue(new Error('db down'))
    const req = new Request('http://localhost/api/players/trumpsc/stats')
    const res = await GET(req, makeParams('trumpsc'))
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'internal server error' })
  })
})
