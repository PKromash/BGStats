# BGStats Data Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Next.js API route layer — player search, rating history, player stats, and leaderboard — backed by Neon PostgreSQL, with TypeScript types and route handler tests.

**Architecture:** All SQL lives in `lib/queries.ts`; route handlers in `app/api/` are thin wrappers that call query functions and return JSON. The Neon client is a singleton in `lib/db.ts`. Route handlers are unit-tested with mocked queries; SQL correctness is verified via a script run against the real Neon database.

**Tech Stack:** Next.js 15 (App Router), TypeScript, @neondatabase/serverless, Jest (via next/jest + SWC)

---

## File Map

| File | Responsibility |
|------|----------------|
| `lib/db.ts` | Neon client singleton — export `sql` tagged template fn |
| `lib/types.ts` | TypeScript interfaces for all query return shapes |
| `lib/queries.ts` | `searchPlayers`, `getPlayerHistory`, `getPlayerStats`, `getLeaderboard` |
| `app/api/search/route.ts` | `GET /api/search?q=` |
| `app/api/players/[name]/history/route.ts` | `GET /api/players/[name]/history?season=` |
| `app/api/players/[name]/stats/route.ts` | `GET /api/players/[name]/stats?season=` |
| `app/api/leaderboard/route.ts` | `GET /api/leaderboard?season=` |
| `__tests__/api/search.test.ts` | Unit tests for search route |
| `__tests__/api/history.test.ts` | Unit tests for history route |
| `__tests__/api/stats.test.ts` | Unit tests for stats route |
| `__tests__/api/leaderboard.test.ts` | Unit tests for leaderboard route |
| `scripts/verify-queries.ts` | Runs all queries against real Neon, prints shapes |
| `jest.config.ts` | Jest config using next/jest SWC transform |

---

### Task 1: Scaffold Next.js project at repo root

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx` (all generated)

- [ ] **Step 1: Run create-next-app at repo root**

```bash
npx create-next-app@latest . --typescript --app --no-src-dir --no-tailwind --import-alias "@/*" --eslint --use-npm --yes
```

If prompted "The directory . contains files that could conflict" — type `y` and press Enter.

- [ ] **Step 2: Verify the dev server starts**

```bash
npm run dev
```

Expected: Server on http://localhost:3000 with no errors. Press Ctrl+C to stop.

- [ ] **Step 3: Commit scaffolded files**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts next-env.d.ts .eslintrc.json app/ public/
git commit -m "chore: scaffold next.js app at repo root"
```

---

### Task 2: Install @neondatabase/serverless and configure Jest

**Files:**
- Modify: `package.json` (add test script)
- Create: `jest.config.ts`

- [ ] **Step 1: Install dependencies**

```bash
npm install @neondatabase/serverless
npm install --save-dev jest @types/jest
```

- [ ] **Step 2: Create jest.config.ts**

```typescript
// jest.config.ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const customConfig: Config = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
}

export default createJestConfig(customConfig)
```

- [ ] **Step 3: Add test script to package.json**

In `package.json`, add `"test": "jest"` to the `scripts` object.

- [ ] **Step 4: Verify Jest runs (no tests yet)**

```bash
npm test -- --passWithNoTests
```

Expected: `Test Suites: 0 passed` with exit code 0.

- [ ] **Step 5: Commit**

```bash
git add jest.config.ts package.json package-lock.json
git commit -m "chore: install neon driver and configure jest"
```

---

### Task 3: Create lib/db.ts and lib/types.ts

**Files:**
- Create: `lib/db.ts`
- Create: `lib/types.ts`

- [ ] **Step 1: Create lib/db.ts**

```typescript
// lib/db.ts
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

export const sql = neon(process.env.DATABASE_URL)
```

- [ ] **Step 2: Create lib/types.ts**

```typescript
// lib/types.ts
export interface PlayerSearchResult {
  id: number
  player_name: string
  last_seen_at: string
}

export interface GameHistoryRow {
  observed_at: string
  rating_before: number
  rating_after: number
  rating_delta: number
  estimated_placement: number
}

export interface PlayerStats {
  games_played: number
  avg_placement: number
  first_place_pct: number
  avg_rating_delta: number
  peak_rating: number
  current_rating: number
  current_rank: number
}

export interface LeaderboardRow {
  rank: number
  player_name: string
  rating: number
  rating_delta_24h: number | null
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/db.ts lib/types.ts
git commit -m "feat: add neon db client and query type definitions"
```

---

### Task 4: Implement lib/queries.ts

**Files:**
- Create: `lib/queries.ts`

> Note: These queries interact with the real Neon DB. Shape correctness is verified in Task 9. The query functions are tested here by running the test suite in later tasks (routes mock this module).

- [ ] **Step 1: Create lib/queries.ts**

```typescript
// lib/queries.ts
import { sql } from './db'
import type { PlayerSearchResult, GameHistoryRow, PlayerStats, LeaderboardRow } from './types'

export async function searchPlayers(prefix: string, limit = 10): Promise<PlayerSearchResult[]> {
  const rows = await sql`
    SELECT id, player_name, last_seen_at
    FROM players
    WHERE player_name LIKE ${prefix + '%'}
    ORDER BY player_name
    LIMIT ${limit}
  `
  return rows as PlayerSearchResult[]
}

export async function getPlayerHistory(playerName: string, seasonId = 18): Promise<GameHistoryRow[]> {
  const rows = await sql`
    SELECT ig.observed_at, ig.rating_before, ig.rating_after, ig.rating_delta,
           ig.estimated_placement
    FROM inferred_games ig
    JOIN players p ON p.id = ig.player_id
    WHERE p.player_name = ${playerName}
      AND ig.season_id = ${seasonId}
    ORDER BY ig.observed_at ASC
  `
  return rows as GameHistoryRow[]
}

export async function getPlayerStats(playerName: string, seasonId = 18): Promise<PlayerStats | null> {
  const rows = await sql`
    SELECT
      COUNT(*)::int                                                         AS games_played,
      ROUND(AVG(ig.estimated_placement), 2)::float                         AS avg_placement,
      ROUND(
        100.0 * SUM(CASE WHEN ig.estimated_placement = 1 THEN 1 ELSE 0 END)
              / NULLIF(COUNT(*), 0),
        2
      )::float                                                              AS first_place_pct,
      ROUND(AVG(ig.rating_delta), 2)::float                                AS avg_rating_delta,
      MAX(ig.rating_after)::int                                             AS peak_rating,
      (
        SELECT ig2.rating_after
        FROM inferred_games ig2
        JOIN players p2 ON p2.id = ig2.player_id
        WHERE p2.player_name = ${playerName} AND ig2.season_id = ${seasonId}
        ORDER BY ig2.observed_at DESC
        LIMIT 1
      )                                                                     AS current_rating,
      (
        SELECT ig2.rank_after
        FROM inferred_games ig2
        JOIN players p2 ON p2.id = ig2.player_id
        WHERE p2.player_name = ${playerName} AND ig2.season_id = ${seasonId}
        ORDER BY ig2.observed_at DESC
        LIMIT 1
      )                                                                     AS current_rank
    FROM inferred_games ig
    JOIN players p ON p.id = ig.player_id
    WHERE p.player_name = ${playerName}
      AND ig.season_id = ${seasonId}
  `

  if (!rows[0] || (rows[0] as PlayerStats).games_played === 0) return null
  return rows[0] as PlayerStats
}

export async function getLeaderboard(seasonId = 18, limit = 100): Promise<LeaderboardRow[]> {
  const rows = await sql`
    WITH latest AS (
      SELECT DISTINCT ON (player_id)
        player_id, rank, rating, captured_at
      FROM snapshots
      WHERE season_id = ${seasonId}
      ORDER BY player_id, captured_at DESC
    ),
    day_ago AS (
      SELECT DISTINCT ON (player_id)
        player_id, rating AS rating_24h_ago
      FROM snapshots
      WHERE season_id = ${seasonId}
        AND captured_at <= NOW() - INTERVAL '24 hours'
      ORDER BY player_id, captured_at DESC
    )
    SELECT
      l.rank,
      p.player_name,
      l.rating,
      (l.rating - d.rating_24h_ago) AS rating_delta_24h
    FROM latest l
    JOIN players p ON p.id = l.player_id
    LEFT JOIN day_ago d ON d.player_id = l.player_id
    ORDER BY l.rank ASC
    LIMIT ${limit}
  `
  return rows as LeaderboardRow[]
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/queries.ts
git commit -m "feat: add query functions for search, history, stats, and leaderboard"
```

---

### Task 5: TDD — GET /api/search

**Files:**
- Create: `__tests__/api/search.test.ts`
- Create: `app/api/search/route.ts`

- [ ] **Step 1: Write the failing test**

```typescript
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
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- __tests__/api/search.test.ts
```

Expected: FAIL — `Cannot find module '@/app/api/search/route'`

- [ ] **Step 3: Implement the route handler**

```typescript
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
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm test -- __tests__/api/search.test.ts
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add __tests__/api/search.test.ts app/api/search/route.ts
git commit -m "feat: add GET /api/search with tests"
```

---

### Task 6: TDD — GET /api/players/[name]/history

**Files:**
- Create: `__tests__/api/history.test.ts`
- Create: `app/api/players/[name]/history/route.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/api/history.test.ts
import { GET } from '@/app/api/players/[name]/history/route'
import { getPlayerHistory } from '@/lib/queries'

jest.mock('@/lib/queries')

const mockGetPlayerHistory = jest.mocked(getPlayerHistory)

const makeParams = (name: string) => ({ params: Promise.resolve({ name }) })

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
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- __tests__/api/history.test.ts
```

Expected: FAIL — `Cannot find module '@/app/api/players/[name]/history/route'`

- [ ] **Step 3: Create the directory and implement the route handler**

```typescript
// app/api/players/[name]/history/route.ts
import { NextResponse } from 'next/server'
import { getPlayerHistory } from '@/lib/queries'

export async function GET(
  request: Request,
  context: { params: Promise<{ name: string }> }
): Promise<NextResponse> {
  try {
    const { name } = await context.params
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
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm test -- __tests__/api/history.test.ts
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add "__tests__/api/history.test.ts" "app/api/players/[name]/history/route.ts"
git commit -m "feat: add GET /api/players/[name]/history with tests"
```

---

### Task 7: TDD — GET /api/players/[name]/stats

**Files:**
- Create: `__tests__/api/stats.test.ts`
- Create: `app/api/players/[name]/stats/route.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/api/stats.test.ts
import { GET } from '@/app/api/players/[name]/stats/route'
import { getPlayerStats } from '@/lib/queries'
import type { PlayerStats } from '@/lib/types'

jest.mock('@/lib/queries')

const mockGetPlayerStats = jest.mocked(getPlayerStats)

const makeParams = (name: string) => ({ params: Promise.resolve({ name }) })

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
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- __tests__/api/stats.test.ts
```

Expected: FAIL — `Cannot find module '@/app/api/players/[name]/stats/route'`

- [ ] **Step 3: Implement the route handler**

```typescript
// app/api/players/[name]/stats/route.ts
import { NextResponse } from 'next/server'
import { getPlayerStats } from '@/lib/queries'

export async function GET(
  request: Request,
  context: { params: Promise<{ name: string }> }
): Promise<NextResponse> {
  try {
    const { name } = await context.params
    const season = parseInt(new URL(request.url).searchParams.get('season') ?? '18', 10)
    const stats = await getPlayerStats(name, season)
    if (!stats) {
      return NextResponse.json({ error: 'player not found' }, { status: 404 })
    }
    return NextResponse.json(stats)
  } catch {
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm test -- __tests__/api/stats.test.ts
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add "__tests__/api/stats.test.ts" "app/api/players/[name]/stats/route.ts"
git commit -m "feat: add GET /api/players/[name]/stats with tests"
```

---

### Task 8: TDD — GET /api/leaderboard

**Files:**
- Create: `__tests__/api/leaderboard.test.ts`
- Create: `app/api/leaderboard/route.ts`

- [ ] **Step 1: Write the failing test**

```typescript
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
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- __tests__/api/leaderboard.test.ts
```

Expected: FAIL — `Cannot find module '@/app/api/leaderboard/route'`

- [ ] **Step 3: Implement the route handler**

```typescript
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
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm test -- __tests__/api/leaderboard.test.ts
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Run the full test suite**

```bash
npm test
```

Expected: PASS — 16 tests across 4 suites

- [ ] **Step 6: Commit**

```bash
git add __tests__/api/leaderboard.test.ts app/api/leaderboard/route.ts
git commit -m "feat: add GET /api/leaderboard with tests"
```

---

### Task 9: Verify query shapes against real Neon

**Files:**
- Create: `scripts/verify-queries.ts`

This step runs all four queries against the live Neon DB and prints the result shapes so you can confirm they match `lib/types.ts` before building any UI.

- [ ] **Step 1: Install tsx (TypeScript script runner)**

```bash
npm install --save-dev tsx
```

- [ ] **Step 2: Create scripts/verify-queries.ts**

```typescript
// scripts/verify-queries.ts
import { searchPlayers, getPlayerHistory, getPlayerStats, getLeaderboard } from '../lib/queries'

async function main() {
  console.log('\n=== searchPlayers("a", limit=3) ===')
  const players = await searchPlayers('a', 3)
  console.log(`${players.length} rows`)
  if (players.length > 0) console.log('Sample:', players[0])

  const testName = players[0]?.player_name
  if (testName) {
    console.log(`\n=== getPlayerHistory("${testName}") ===`)
    const history = await getPlayerHistory(testName)
    console.log(`${history.length} rows`)
    if (history.length > 0) console.log('Sample:', history[0])

    console.log(`\n=== getPlayerStats("${testName}") ===`)
    const stats = await getPlayerStats(testName)
    console.log(stats)
  }

  console.log('\n=== getLeaderboard(18, limit=3) ===')
  const board = await getLeaderboard(18, 3)
  console.log(`${board.length} rows`)
  if (board.length > 0) console.log('Sample:', board[0])
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 3: Run the verification script**

```bash
npx tsx --env-file=.env.local scripts/verify-queries.ts
```

Expected: Output showing rows for each query. Spot-check that:
- `searchPlayers` returns objects with `{ id, player_name, last_seen_at }`
- `getPlayerHistory` returns objects with `{ observed_at, rating_before, rating_after, rating_delta, estimated_placement }`
- `getPlayerStats` returns `{ games_played, avg_placement, first_place_pct, avg_rating_delta, peak_rating, current_rating, current_rank }` or `null`
- `getLeaderboard` returns `{ rank, player_name, rating, rating_delta_24h }` (delta may be null for players with no 24h-ago snapshot)

If any field is missing or mis-typed, fix the SQL in `lib/queries.ts` and re-run.

- [ ] **Step 4: Commit**

```bash
git add scripts/verify-queries.ts package.json package-lock.json
git commit -m "chore: add query shape verification script"
```
