CREATE TABLE players (
    id            bigserial primary key,
    player_name   varchar unique,
    first_seen_at timestamptz default now(),
    last_seen_at  timestamptz default now()
);