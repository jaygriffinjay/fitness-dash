#!/usr/bin/env python3
"""
Fetch all Garmin activities and save the full raw API response to data/activities.json.

Overwrites the file every run — no skip logic. Re-run any time you want fresh data.

Usage:
    .venv/bin/python scripts/fetch_activities.py

Credentials are read from a .env file in the project root:
    GARMIN_EMAIL=you@example.com
    GARMIN_PASSWORD=yourpassword

Optional env vars:
    GARMIN_PAGE_SIZE=100    (default: 100)
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from garminconnect import Garmin

load_dotenv()

EMAIL = os.getenv("GARMIN_EMAIL")
PASSWORD = os.getenv("GARMIN_PASSWORD")
# Garmin's API returns activities in pages; 100 is a safe page size
PAGE_SIZE = int(os.getenv("GARMIN_PAGE_SIZE", "100"))

OUT_FILE = Path(__file__).parent.parent / "data" / "activities.json"


def main():
    if not EMAIL or not PASSWORD:
        print("Error: GARMIN_EMAIL and GARMIN_PASSWORD must be set in .env", file=sys.stderr)
        sys.exit(1)

    print(f"Logging in as {EMAIL}…")
    api = Garmin(EMAIL, PASSWORD)
    api.login()

    # Paginate until we get a partial page (meaning we've hit the end)
    print("Fetching all activities…")
    all_raw = []
    start = 0
    while True:
        batch = api.get_activities(start, PAGE_SIZE)
        if not batch:
            break
        all_raw.extend(batch)
        print(f"  fetched {len(all_raw)} so far…")
        if len(batch) < PAGE_SIZE:
            break
        start += PAGE_SIZE

    # Save the full raw API responses — no parsing or stripping here.
    # Parsing happens later in import_to_db.py when loading into SQLite.
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "activity_count": len(all_raw),
        "activities": all_raw,
    }
    OUT_FILE.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
    print(f"Saved {len(all_raw)} activities → {OUT_FILE}")


if __name__ == "__main__":
    main()
