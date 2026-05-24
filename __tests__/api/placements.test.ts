// __tests__/api/placements.test.ts
import { GET } from '@/app/api/players/[name]/placements/route'
import { getPlacementDistribution } from '@/lib/queries'
import type { PlacementDistributionRow } from '@/lib/types'

jest.mock('@/lib/queries')

const mockGetPlacementDistribution = jest.mocked(getPlacementDistribution)

const makeParams = (name: string) => ({ params: { name } })

const sampleDistribution: PlacementDistributionRow[] = [
  { placement: 1, count: 6 },
  { placement: 2, count: 8 },
  { placement: 4, count: 10 },
]

describe('GET /api/players/[name]/placements', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns distribution rows for a player', async () => {
    mockGetPlacementDistribution.mockResolvedValue(sampleDistribution)
    const req = new Request('http://localhost/api/players/trumpsc/placements')
    const res = await GET(req, makeParams('trumpsc'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(sampleDistribution)
    expect(mockGetPlacementDistribution).toHaveBeenCalledWith('trumpsc', 18, 'season')
  })

  it('returns [] (not 404) when no games in window', async () => {
    mockGetPlacementDistribution.mockResolvedValue([])
    const req = new Request('http://localhost/api/players/trumpsc/placements?window=7d')
    const res = await GET(req, makeParams('trumpsc'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('passes window=30d to getPlacementDistribution', async () => {
    mockGetPlacementDistribution.mockResolvedValue([])
    const req = new Request('http://localhost/api/players/trumpsc/placements?window=30d')
    await GET(req, makeParams('trumpsc'))
    expect(mockGetPlacementDistribution).toHaveBeenCalledWith('trumpsc', 18, '30d')
  })

  it('defaults invalid window to season', async () => {
    mockGetPlacementDistribution.mockResolvedValue([])
    const req = new Request('http://localhost/api/players/trumpsc/placements?window=weekly')
    await GET(req, makeParams('trumpsc'))
    expect(mockGetPlacementDistribution).toHaveBeenCalledWith('trumpsc', 18, 'season')
  })

  it('respects the season query param', async () => {
    mockGetPlacementDistribution.mockResolvedValue([])
    const req = new Request('http://localhost/api/players/trumpsc/placements?season=17')
    await GET(req, makeParams('trumpsc'))
    expect(mockGetPlacementDistribution).toHaveBeenCalledWith('trumpsc', 17, 'season')
  })

  it('returns 500 on DB error', async () => {
    mockGetPlacementDistribution.mockRejectedValue(new Error('db down'))
    const req = new Request('http://localhost/api/players/trumpsc/placements')
    const res = await GET(req, makeParams('trumpsc'))
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'internal server error' })
  })
})
