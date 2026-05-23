// __tests__/api/history.test.ts
import { GET } from '@/app/api/players/[name]/history/route'
import { getPlayerHistory } from '@/lib/queries'

jest.mock('@/lib/queries')

const mockGetPlayerHistory = jest.mocked(getPlayerHistory)

const makeParams = (name: string) => ({ params: { name } })

describe('GET /api/players/[name]/history', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns game history for a known player', async () => {
    mockGetPlayerHistory.mockResolvedValue([
      {
        observed_at: '2024-01-01T00:00:00Z',
        rating_before: 8000,
        rating_after: 8050,
        rating_delta: 50,
        estimated_placement: 2,
      },
    ])
    const req = new Request('http://localhost/api/players/trumpsc/history')
    const res = await GET(req, makeParams('trumpsc'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].rating_delta).toBe(50)
    expect(mockGetPlayerHistory).toHaveBeenCalledWith('trumpsc', 18)
  })

  it('returns 404 when player has no history', async () => {
    mockGetPlayerHistory.mockResolvedValue([])
    const req = new Request('http://localhost/api/players/unknown/history')
    const res = await GET(req, makeParams('unknown'))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'player not found' })
  })

  it('respects the season query param', async () => {
    mockGetPlayerHistory.mockResolvedValue([])
    const req = new Request('http://localhost/api/players/trumpsc/history?season=17')
    await GET(req, makeParams('trumpsc'))
    expect(mockGetPlayerHistory).toHaveBeenCalledWith('trumpsc', 17)
  })

  it('returns 500 on DB error', async () => {
    mockGetPlayerHistory.mockRejectedValue(new Error('db down'))
    const req = new Request('http://localhost/api/players/trumpsc/history')
    const res = await GET(req, makeParams('trumpsc'))
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'internal server error' })
  })
})
