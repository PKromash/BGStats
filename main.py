import logging
from dotenv import load_dotenv
# Must run before module-level imports so DATABASE_URL is set before any db code executes
load_dotenv(".env.local")

from poller import fetch_all_players
from db import process_players


def main():
    players = fetch_all_players()
    if players is None:
        logging.error("Error fetching players")
        return

    # None signals a partial fetch — skip processing to avoid persisting incomplete data
    process_players(players)


if __name__ == "__main__":
    main()