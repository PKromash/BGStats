# Frontend Design — Leaderboard & Player Profile

**Date:** 2026-05-24
**Status:** Approved

## Overview

Build two pages on top of the existing data layer:
1. **Home (`/`)** — leaderboard table of top-ranked players with 24h rating delta
2. **Player profile (`/players/[name]`)** — stats grid, placement distribution bar chart, rating history line chart, and a time-window selector

---

## Tech Stack Additions

| Package | Purpose |
|---------|---------|
| `tailwindcss` | Utility-first CSS |
| `postcss` | Required by Tailwind |
| `autoprefixer` | Required by Tailwind |
| `recharts` | Bar chart + line chart |

No new API routes or DB queries. All data comes from the existing layer.

---

## Pages & Routing

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Leaderboard (server component) |
| `/players/[name]` | `app/players/[name]/page.tsx` | Player profile (server component) |

The `?window=` query param is the source of truth for the selected time window on the profile page (e.g. `/players/trumpsc?window=7d`). This makes profiles shareable with a specific window pre-selected. Missing or invalid `window` values default to `'season'`.

---

## Architecture: Server Components + Client Islands

The profile page and leaderboard page are **Server Components** — they fetch data directly (same process, no HTTP round-trip) and render fully before sending HTML. No initial loading spinners.

**Client components** handle only what requires the browser:
- `NavBar` — search autocomplete (debounced fetch to `/api/search`)
- `WindowSelector` — updates the URL on change, triggering a server re-render
- `PlacementChart` — Recharts `BarChart` (requires `"use client"`)
- `RatingHistoryChart` — Recharts `LineChart` (requires `"use client"`)

When the user changes the window, `WindowSelector` calls `router.replace` with the new `?window=` param. This causes the Server Component to re-run and pass new data as props — no client-side fetch loop needed.

---

## Component Architecture

### NavBar (`components/NavBar.tsx`) — client

- Renders the BGStats logo/wordmark as a `<Link href="/">` and a search input
- On keystroke (300ms debounce), fetches `/api/search?q=<value>`
- Shows a dropdown of up to 10 `PlayerSearchResult` items
- Selecting a result navigates to `/players/[name]`
- Empty query hides the dropdown
- Lives in `app/layout.tsx` so it's present on every page

### LeaderboardTable (`components/LeaderboardTable.tsx`) — server-safe

- Receives `LeaderboardRow[]` as props
- Renders a `<table>` with columns: Rank, Player, Rating, 24h Δ
- Each player name is a `<Link href="/players/[name]">`
- Positive 24h delta shown in green, negative in red, null shown as `—`

### StatsGrid (`components/StatsGrid.tsx`) — server-safe

- Receives `PlayerStats` as props
- Renders 4 stat cards: Current Rating, Avg Placement, 1st Place %, Avg Rating Δ
- Current Rank shown in the page header (not in the grid)

### WindowSelector (`components/WindowSelector.tsx`) — client

- Receives current `window` value as prop
- Renders three buttons: `7d`, `30d`, `Season`
- Active window highlighted; clicking calls `router.replace` with updated `?window=` param
- Uses `useRouter` and `useSearchParams` from `next/navigation`

### PlacementChart (`components/PlacementChart.tsx`) — client

- Receives `PlacementDistributionRow[]` as props
- Renders a Recharts `BarChart` with placement (1–8) on X axis, count on Y axis
- Empty array (`[]`) renders a "No games in this window" message instead of an empty chart

### RatingHistoryChart (`components/RatingHistoryChart.tsx`) — client

- Receives `GameHistoryRow[]` as props
- Renders a Recharts `LineChart` with `observed_at` on X axis (formatted as `MM/DD`), `rating_after` on Y axis
- Always shows full season history (history endpoint has no window filter — ignores the active window)
- Empty array renders a "No game history" message

---

## Data Fetching

### Home page (`app/page.tsx`)

```typescript
const rows = await getLeaderboard()
// renders <LeaderboardTable rows={rows} />
```

### Player profile (`app/players/[name]/page.tsx`)

```typescript
const window = validateWindow(searchParams.window)  // defaults 'season'
const [stats, placements, history] = await Promise.all([
  getPlayerStats(name, 18, window),
  getPlacementDistribution(name, 18, window),
  getPlayerHistory(name, 18),
])
if (!stats) return <PlayerNotFound name={name} />
// render profile with stats, placements, history
```

`validateWindow` is a small inline helper that checks against `['7d', '30d', 'season']` and defaults to `'season'`.

---

## Profile Page Layout

```
┌─────────────────────────────────────────────┐
│  NavBar: [BGStats]    [Search players...]   │
├─────────────────────────────────────────────┤
│  trumpsc  #15         [7d] [30d] [Season]  │
├──────────┬──────────┬──────────┬────────────┤
│  8900    │   3.8    │  14.3%   │   +12.5   │
│  Rating  │ Avg Place│  1st %   │  Avg Δ    │
├─────────────────────────────────────────────┤
│  Placement Distribution (BarChart)          │
│  [1][2][3][4][5][6][7][8]                  │
├─────────────────────────────────────────────┤
│  Rating History (LineChart)                 │
│  ~~~~/\/\~~~                                │
└─────────────────────────────────────────────┘
```

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Player not found (`stats === null`) | Inline "Player not found" message on profile page |
| DB error on any page | Next.js `error.tsx` boundary — "Something went wrong" |
| Empty placements for window | `PlacementChart` shows "No games in this window" |
| Empty history | `RatingHistoryChart` shows "No game history" |

Two `error.tsx` files:
- `app/error.tsx` — catches errors from the home page
- `app/players/[name]/error.tsx` — catches errors from the profile page

---

## File Map

| File | Change |
|------|--------|
| `tailwind.config.ts` | New |
| `postcss.config.mjs` | New |
| `app/globals.css` | Add Tailwind directives |
| `app/layout.tsx` | Add `<NavBar>`, Tailwind font class |
| `app/page.tsx` | Rewrite as leaderboard server component |
| `app/error.tsx` | New error boundary |
| `app/players/[name]/page.tsx` | New player profile server component |
| `app/players/[name]/error.tsx` | New error boundary |
| `components/NavBar.tsx` | New client component |
| `components/LeaderboardTable.tsx` | New |
| `components/StatsGrid.tsx` | New |
| `components/WindowSelector.tsx` | New client component |
| `components/PlacementChart.tsx` | New client component |
| `components/RatingHistoryChart.tsx` | New client component |

---

## Existing Behaviour Preserved

- All API routes unchanged
- `lib/queries.ts`, `lib/types.ts`, `lib/db.ts` unchanged
- All 25 existing tests continue to pass
