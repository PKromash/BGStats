# Player Stats Extended Design — Placement Distribution & Time Windows

**Date:** 2026-05-23  
**Status:** Approved

## Overview

Extend the player stats data layer with two additions:
1. A placement distribution query — counts of each finish (1st–8th) per player, for use in a bar chart
2. Time-window filtering on stats and distribution — `7d`, `30d`, or `season` (full season, default)

Both features accept the same `?window=` parameter and apply to the same player + season scope.

---

## Changes to `lib/types.ts`

Add two new exports:

```typescript
export type StatsWindow = '7d' | '30d' | 'season'

export interface PlacementDistributionRow {
  placement: number  // integer 1–8 (FLOOR of estimated_placement)
  count: number
}
```

`PlayerStats` is unchanged.

---

## Changes to `lib/queries.ts`

### Modified: `getPlayerStats`

Add `window: StatsWindow = 'season'` as a third parameter. Inject a conditional time filter into the existing WHERE clause:

- `'7d'` → `AND ig.observed_at >= NOW() - INTERVAL '7 days'`
- `'30d'` → `AND ig.observed_at >= NOW() - INTERVAL '30 days'`
- `'season'` → no additional filter (existing behavior)

Null handling and return type (`PlayerStats | null`) are unchanged.

### New: `getPlacementDistribution`

```typescript
getPlacementDistribution(
  playerName: string,
  seasonId = 18,
  window: StatsWindow = 'season'
): Promise<PlacementDistributionRow[]>
```

SQL:
```sql
SELECT FLOOR(ig.estimated_placement)::int AS placement,
       COUNT(*)::int AS count
FROM inferred_games ig
JOIN players p ON p.id = ig.player_id
WHERE p.player_name = $playerName
  AND ig.season_id = $seasonId
  -- window = '7d':  AND ig.observed_at >= NOW() - INTERVAL '7 days'
  -- window = '30d': AND ig.observed_at >= NOW() - INTERVAL '30 days'
  -- window = 'season': no additional filter
GROUP BY FLOOR(ig.estimated_placement)::int
ORDER BY placement ASC
```

Returns only placements that occurred (no zero-count rows). Returns `[]` when no games exist in the window — this is valid, not an error.

---

## Route Changes

### Modified: `GET /api/players/[name]/stats`

Add `?window=` query param. Parse and validate before passing to `getPlayerStats`:
- Valid values: `'7d'`, `'30d'`, `'season'`
- Invalid or missing → default `'season'`
- Null from query → 404 `{ error: 'player not found' }` (unchanged)
- DB error → 500 (unchanged)

### New: `GET /api/players/[name]/placements`

New file: `app/api/players/[name]/placements/route.ts`

Same `?season=` and `?window=` param handling as `/stats`. Calls `getPlacementDistribution`. Always returns 200:
- Empty array → `200 []` (no 404 — empty window is a valid state)
- DB error → 500

---

## File Map

| File | Change |
|------|--------|
| `lib/types.ts` | Add `StatsWindow`, `PlacementDistributionRow` |
| `lib/queries.ts` | Modify `getPlayerStats`, add `getPlacementDistribution` |
| `app/api/players/[name]/stats/route.ts` | Add `?window=` param |
| `app/api/players/[name]/placements/route.ts` | New route |

---

## Existing Behaviour Preserved

- `GET /api/players/[name]/stats` with no `window` param behaves identically to today
- `getPlayerStats` with no `window` arg behaves identically to today
- No changes to search, history, or leaderboard routes
