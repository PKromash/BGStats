CREATE TABLE inferred_games (
    id                  bigserial primary key,
    player_id           bigint references players(id),
    season_id           int references seasons(id),
    rating_before       int,
    rating_after        int,
    rating_delta        int,
    rank_before         int,
    rank_after          int,
    observed_at         timestamptz DEFAULT now(),
    estimated_placement numeric
);