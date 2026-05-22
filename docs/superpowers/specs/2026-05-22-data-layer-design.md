# Data Layer Design — BGStats Next.js Frontend

**Date:** 2026-05-22  
**Status:** Approved

## Overview

Next.js (App Router) data layer for the Hearthstone Battlegrounds leaderboard tracker. Provides API routes consumed by both server components and client-side fetches. Data lives in a Neon (PostgreSQL) database populated by the Python poller every ~15 minutes.

Current season: **18**. Player names are stored **lowercase**.

---

## Architecture

**Approach:** Route handlers + shared query layer (Option B).

All SQL is centralized in `lib/queries.ts`. Route handlers are thin wrappers that call query functions and return JSON. The Neon client is initialized once in `lib/db.ts`.

---

## File Structure

```
app/
  api/
    search/route.ts                  GET /api/search?q=<prefix>
    players/[name]/
      history/route.ts               GET /api/players/[name]/history?season=18
      stats/route.ts                 GET /api/players/[name]/stats?season=18
    leaderboard/route.ts             GET /api/leaderboard?season=18
lib/
  db.ts                              Neon client singleton (DATABASE_URL from env)
  queries.ts                         searchPlayers, getPlayerHistory, getPlayerStats, getLeaderboard
```

---

## DB Client

`lib/db.ts` initializes `@neondatabase/serverless` using `DATABASE_URL`. All query functions import the client from `db.ts` — no direct instantiation in route files.

---

## Query Contracts

### `searchPlayers(prefix: string, limit = 10)`
- SQL: `WHERE player_name LIKE $1 || '%'` (prefix lowercased by caller)
- Returns: `{ id, player_name, last_seen_at }[]`

### `getPlayerHistory(playerName: string, seasonId = 18)`
- Joins `inferred_games` → `players`
- Returns: `{ observed_at, rating_before, rating_after, rating_delta, estimated_placement }[]`
- Ordered by `observed_at ASC`
- Used as the raw data source for the Recharts rating graph

### `getPlayerStats(playerName: string, seasonId = 18)`
- Aggregates over `inferred_games` for player + season
- Returns a single flat object (easy to extend with new fields):
  ```ts
  {
    games_played: number,
    avg_placement: number,        // AVG(estimated_placement)
    first_place_pct: number,      // % of rows where estimated_placement = 1
    avg_rating_delta: number,
    peak_rating: number,          // MAX(rating_after)
    current_rating: number,       // rating_after of most recent row
    current_rank: number          // rank_after from most recent inferred_games row
  }
  ```

### `getLeaderboard(seasonId = 18, limit = 100)`
- Joins latest `snapshots` with a 24h-ago snapshot subquery
- Returns: `{ rank, player_name, rating, rating_delta_24h }[]`

---

## Route Handler Behavior

| Route | Behavior |
|-------|----------|
| `GET /api/search?q=` | Missing/empty `q` → return `[]`. Lowercase `q` before querying. |
| `GET /api/players/[name]/history` | Player not found (zero rows) → `404 { error: "player not found" }` |
| `GET /api/players/[name]/stats` | Player not found → `404 { error: "player not found" }` |
| `GET /api/leaderboard` | Always returns rows (may be empty). No player-specific lookup. |
| All routes | DB exception → `500 { error: "internal server error" }` (no raw messages exposed) |

- `season` query param defaults to `18` in all routes if omitted.
- `[name]` path param is the URL-decoded lowercase player name.

---

## Database Schema (reference)

```sql
players       (id, player_name, first_seen_at, last_seen_at)
seasons       (id, name, start_at, end_at)
snapshots     (id, player_id, season_id, rank, rating, captured_at)
inferred_games(id, player_id, season_id, rating_before, rating_after,
               rating_delta, rank_before, rank_after, observed_at, estimated_placement)
```

`estimated_placement` is `numeric`, supports half-steps (e.g. `3.5` for ties).

---

## Out of Scope (this spec)

- UI components (Recharts graph, leaderboard table, search box)
- Authentication
- Caching / revalidation strategy
- Player stats beyond the fields listed above (intentionally left extensible)
