// __tests__/api/search.test.ts
import { GET } from '@/app/api/search/route'
import { searchPlayers } from '@/lib/queries'

jest.mock('@/lib/queries')

const mockSearchPlayers = jest.mocked(searchPlayers)

describe('GET /api/search', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns [] when q param is missing', async () => {
    const req = new Request('http://localhost/api/search')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
    expect(mockSearchPlayers).not.toHaveBeenCalled()
  })

  it('returns [] when q is empty string', async () => {
    const req = new Request('http://localhost/api/search?q=')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
    expect(mockSearchPlayers).not.toHaveBeenCalled()
  })

  it('lowercases q and returns query results', async () => {
    mockSearchPlayers.mockResolvedValue([
      { id: 1, player_name: 'trumpsc', last_seen_at: '2024-01-01T00:00:00Z' },
    ])
    const req = new Request('http://localhost/api/search?q=Trump')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([
      { id: 1, player_name: 'trumpsc', last_seen_at: '2024-01-01T00:00:00Z' },
    ])
    expect(mockSearchPlayers).toHaveBeenCalledWith('trump')
  })

  it('returns 500 on DB error', async () => {
    mockSearchPlayers.mockRejectedValue(new Error('db down'))
    const req = new Request('http://localhost/api/search?q=trump')
    const res = await GET(req)
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'internal server error' })
  })
})
