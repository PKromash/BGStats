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
  current_rating: number | null
  current_rank: number | null
}

export interface LeaderboardRow {
  rank: number
  player_name: string
  rating: number
  rating_delta_24h: number | null
}

export type StatsWindow = '7d' | '30d' | 'season'

export interface PlacementDistributionRow {
  placement: number
  count: number
}
