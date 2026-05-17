import requests
import logging

# Target leaderboard configuration — update SEASON_ID each new BG season
SEASON_ID = 18
REGION = "US"
LEADERBOARD_ID = "battlegrounds"

def fetch_page(page_number):
    try:
        response = requests.get("https://hearthstone.blizzard.com/en-us/api/community/leaderboardsData",
        params={
            "seasonId": SEASON_ID,
            "region": REGION,
            "leaderboardId": LEADERBOARD_ID,
            "page": page_number
        })

        if response.status_code == 200:
            data = response.json()
            return data["leaderboard"]["rows"]

        else:
            logging.error(f"Failed to fetch page {page_number}. status: {response.status_code}")
            return None

    except requests.exceptions.RequestException as e:
        logging.error(f"Network error fetching page {page_number}: {e}")
        return None

def fetch_all_players():
    rows = []
    page_number = 1
    success = True

    # An empty page signals the last page
    while True:
        page = fetch_page(page_number)
        if page is None:
            success = False
            break

        if len(page) == 0:
            break

        rows.extend(page)
        page_number += 1

    # Return None on any fetch failure to avoid persisting a partial snapshot
    return rows if success else None