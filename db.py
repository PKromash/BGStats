import os
import psycopg2  # type: ignore
from typing import Optional

# Must stay in sync with SEASON_ID in poller.py — they're separate constants
SEASON_ID = 18

def get_connection():
    connection_string = os.environ.get("DATABASE_URL")
    if connection_string is None:
        raise ValueError("No database url specified")
    
    return psycopg2.connect(connection_string)

def process_players(players: list[dict]):
    conn = get_connection()
    try:
        # Single transaction for all players so a mid-batch failure leaves no partial writes
        with conn:
            with conn.cursor() as cur:
                for player in players:
                    _process_single_player(cur, player)
    finally:
        conn.close()

def _upsert_player(cur, player_name: str) -> int:
    sql = """
        INSERT INTO players (player_name)
        VALUES (%s)
        ON CONFLICT (player_name) DO UPDATE
            SET last_seen_at = now()
        RETURNING id;
    """
    cur.execute(sql, (player_name,))
    row = cur.fetchone()
    return row[0]

def _get_last_snapshot(cur, player_id: int) -> Optional[tuple[int, int]]:
    sql = """
        SELECT rating, rank
        FROM snapshots
        WHERE player_id = %s
        ORDER BY captured_at DESC
        LIMIT 1
    """
    cur.execute(sql, (player_id,))
    row = cur.fetchone()
    return None if row is None else row


def _insert_snapshot(cur, player_id: int, rank: int, rating: int):
    sql = """
        INSERT INTO snapshots (player_id, rank, rating, season_id)
        VALUES (%s, %s, %s, %s)
    """
    cur.execute(sql, (player_id, rank, rating, SEASON_ID))

def _insert_inferred_game(cur, player_id: int, rank: int, last_rank: Optional[int], rating: int, last_rating: Optional[int]):
    # estimate_placement is a SQL function — infers finish position from rating delta
    sql = """
        INSERT INTO inferred_games
        (player_id, season_id, rating_before, rating_after, rating_delta, rank_before, rank_after, estimated_placement)
        VALUES (%s, %s, %s, %s, %s, %s, %s, estimate_placement(%s, %s))
    """
    rating_delta = rating - last_rating if last_rating is not None else None
    cur.execute(sql, (player_id, SEASON_ID, last_rating, rating, rating_delta, last_rank, rank, last_rating, rating))
    
def _process_single_player(cur, player: dict):
    player_name = player["accountid"].lower()
    rank        = player["rank"]
    rating      = player["rating"]

    player_id   = _upsert_player(cur, player_name)
    snapshot = _get_last_snapshot(cur, player_id)

    if snapshot is not None:
        last_rating, last_rank = snapshot
        # Skip if rating unchanged — re-polling the same state shouldn't produce duplicate records
        if last_rating != rating:
            _insert_snapshot(cur, player_id, rank, rating)
            _insert_inferred_game(cur, player_id, rank, last_rank, rating, last_rating)

    else:
        # First time seeing this player — record baseline but don't infer a game (no prior data to diff)
        _insert_snapshot(cur, player_id, rank, rating)