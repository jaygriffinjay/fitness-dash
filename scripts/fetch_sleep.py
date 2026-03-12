#!/usr/bin/env python3
"""
Fetch Garmin sleep data and save full raw API responses to data/sleep.json.

Makes one API call per day from START_DATE to today. Saves everything —
including days with no sleep data (watch not worn, etc.) — because absence
of data is itself useful information.

Safe to re-run: skips dates that are already in the output file.

Usage:
    .venv/bin/python scripts/fetch_sleep.py
"""

import json
import os
import sys
from datetime import date, timedelta
from pathlib import Path

from dotenv import load_dotenv
from garminconnect import Garmin

load_dotenv()

EMAIL = os.getenv("GARMIN_EMAIL")
PASSWORD = os.getenv("GARMIN_PASSWORD")

# Hardcoded to the date of the first recorded activity.
# Change this if you want to fetch further back.
START_DATE = date(2024, 3, 5)

OUT_FILE = Path(__file__).parent.parent / "data" / "sleep.json"


def main():
    if not EMAIL or not PASSWORD:
        print("Error: GARMIN_EMAIL and GARMIN_PASSWORD must be set in .env", file=sys.stderr)
        sys.exit(1)

    # Build a set of already-fetched dates so we can skip them on re-runs.
    # Each record is stored as { "date": "YYYY-MM-DD", "data": <raw api response> }
    # so we own the date key and the raw response is untouched inside "data".
    fetched_dates = set()
    existing = {}
    if OUT_FILE.exists():
        for r in json.loads(OUT_FILE.read_text()):
            fetched_dates.add(r["date"])
            existing[r["date"]] = r

    print(f"Logging in as {EMAIL}…")
    api = Garmin(EMAIL, PASSWORD)
    api.login()

    new_records = 0
    d = START_DATE
    while d <= date.today():
        cdate = d.isoformat()
        d += timedelta(days=1)

        if cdate in fetched_dates:
            continue

        try:
            # Full raw response — includes sleepLevels, sleepHeartRate, hrvData,
            # sleepMovement, wellnessEpochRespirationDataDTOList, sleepStress, etc.
            raw = api.get_sleep_data(cdate)
            existing[cdate] = {"date": cdate, "data": raw}
            new_records += 1
            if new_records % 50 == 0:
                print(f"  {new_records} fetched…")
        except Exception as e:
            print(f"  skip {cdate}: {e}")

    sleep_list = [existing[d] for d in sorted(existing.keys(), reverse=True)]
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(sleep_list, indent=2, ensure_ascii=False))
    print(f"\nDone — added {new_records} records. Total: {len(sleep_list)} → {OUT_FILE}")


if __name__ == "__main__":
    main()

