// lib/queries.ts
import { sql } from './db'
import type { PlayerSearchResult, GameHistoryRow, PlayerStats, LeaderboardRow, StatsWindow, PlacementDistributionRow } from './types'

export async function searchPlayers(prefix: string, limit = 10): Promise<PlayerSearchResult[]> {
  const safePrefix = prefix.replace(/[%_\\]/g, c => '\\' + c)
  const rows = await sql`
    SELECT id::int, player_name, last_seen_at
    FROM players
    WHERE player_name LIKE ${safePrefix + '%'} ESCAPE '\\'
    ORDER BY player_name
    LIMIT ${limit}
  `
  return rows as PlayerSearchResult[]
}

export async function getPlayerHistory(playerName: string, seasonId = 18): Promise<GameHistoryRow[]> {
  const rows = await sql`
    SELECT ig.observed_at, ig.rating_before, ig.rating_after, ig.rating_delta,
           ig.estimated_placement::float
    FROM inferred_games ig
    JOIN players p ON p.id = ig.player_id
    WHERE p.player_name = ${playerName}
      AND ig.season_id = ${seasonId}
    ORDER BY ig.observed_at ASC
  `
  return rows as GameHistoryRow[]
}

function windowToIntervalStr(window: StatsWindow): string | null {
  if (window === '7d') return '7 days'
  if (window === '30d') return '30 days'
  return null
}

export async function getPlayerStats(
  playerName: string,
  seasonId = 18,
  window: StatsWindow = 'season'
): Promise<PlayerStats | null> {
  const intervalStr = windowToIntervalStr(window)
  const rows = intervalStr
    ? await sql`
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
          -- peak_rating above is window-scoped; current_rating and current_rank below are always season-wide
          (
            SELECT ig2.rating_after::int
            FROM inferred_games ig2
            JOIN players p2 ON p2.id = ig2.player_id
            WHERE p2.player_name = ${playerName} AND ig2.season_id = ${seasonId}
            ORDER BY ig2.observed_at DESC
            LIMIT 1
          )                                                                     AS current_rating,
          (
            SELECT ig2.rank_after::int
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
          AND ig.observed_at >= NOW() - ${intervalStr}::interval
      `
    : await sql`
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
            SELECT ig2.rating_after::int
            FROM inferred_games ig2
            JOIN players p2 ON p2.id = ig2.player_id
            WHERE p2.player_name = ${playerName} AND ig2.season_id = ${seasonId}
            ORDER BY ig2.observed_at DESC
            LIMIT 1
          )                                                                     AS current_rating,
          (
            SELECT ig2.rank_after::int
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
      (l.rating - d.rating_24h_ago)::int AS rating_delta_24h
    FROM latest l
    JOIN players p ON p.id = l.player_id
    LEFT JOIN day_ago d ON d.player_id = l.player_id
    ORDER BY l.rank ASC
    LIMIT ${limit}
  `
  return rows as LeaderboardRow[]
}

export async function getPlacementDistribution(
  playerName: string,
  seasonId = 18,
  window: StatsWindow = 'season'
): Promise<PlacementDistributionRow[]> {
  const intervalStr = windowToIntervalStr(window)
  const rows = intervalStr
    ? await sql`
        SELECT FLOOR(ig.estimated_placement)::int AS placement,
               COUNT(*)::int AS count
        FROM inferred_games ig
        JOIN players p ON p.id = ig.player_id
        WHERE p.player_name = ${playerName}
          AND ig.season_id = ${seasonId}
          AND ig.observed_at >= NOW() - ${intervalStr}::interval
        GROUP BY FLOOR(ig.estimated_placement)::int
        ORDER BY placement ASC
      `
    : await sql`
        SELECT FLOOR(ig.estimated_placement)::int AS placement,
               COUNT(*)::int AS count
        FROM inferred_games ig
        JOIN players p ON p.id = ig.player_id
        WHERE p.player_name = ${playerName}
          AND ig.season_id = ${seasonId}
        GROUP BY FLOOR(ig.estimated_placement)::int
        ORDER BY placement ASC
      `
  return rows as PlacementDistributionRow[]
}
