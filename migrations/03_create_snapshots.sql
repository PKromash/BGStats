CREATE TABLE snapshots (
    id            bigserial primary key,
    player_id     bigint references players(id),
    season_id     int references seasons(id),
    rank          int,
    rating        int,
    captured_at   timestamptz
);