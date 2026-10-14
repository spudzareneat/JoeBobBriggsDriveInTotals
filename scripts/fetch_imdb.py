"""Fetch IMDb metadata (poster, plot, rating, etc.) for every imdb_id in
drivein_totals.csv and save it to site/imdb.json for the viewer page.

IMDb blocks requests from other websites, so the page can't look titles up
live. Run this again after adding movies; titles already in imdb.json are
skipped, so a re-run only asks IMDb for the new ones.

To stay polite it requests 50 titles per call, waits between calls, and stops
if IMDb returns 429/403 (whatever was fetched so far is still saved).

    python scripts/fetch_imdb.py          # fetch only missing titles
    python scripts/fetch_imdb.py --all    # refresh everything
"""
import csv
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "drivein_totals.csv"
OUT_PATH = ROOT / "site" / "imdb.json"
ENDPOINT = "https://caching.graphql.imdb.com/"
BATCH = 50
DELAY = 5  # seconds between requests

QUERY = """query DriveInTitles($ids: [ID!]!) {
  titles(ids: $ids) {
    id
    titleText { text }
    releaseYear { year }
    plot { plotText { plainText } }
    primaryImage { url }
    ratingsSummary { aggregateRating voteCount }
    runtime { seconds }
    certificate { rating }
    titleGenres { genres { genre { text } } }
    directors: credits(first: 3, filter: { categories: ["director"] }) {
      edges { node { name { nameText { text } } } }
    }
    cast: credits(first: 4, filter: { categories: ["actor", "actress"] }) {
      edges { node { name { nameText { text } } } }
    }
  }
}"""


def fetch(ids):
    url = ENDPOINT + "?" + urllib.parse.urlencode({
        "operationName": "DriveInTitles",
        "query": QUERY,
        "variables": json.dumps({"ids": ids}),
    }, quote_via=urllib.parse.quote)
    req = urllib.request.Request(url, headers={
        "Accept": "application/graphql+json, application/json",
        "Content-Type": "application/json",
        "x-imdb-client-name": "imdb-web-next-localized",
        "x-imdb-user-language": "en-US",
        "x-imdb-user-country": "US",
        "User-Agent": "DriveInTotals/1.0 (fan dataset; github.com/spudzareneat/DriveInTotals)",
    })
    with urllib.request.urlopen(req, timeout=60) as resp:
        body = json.load(resp)
    if body.get("errors") and not body.get("data"):
        raise RuntimeError(body["errors"][0].get("message"))
    return body["data"]["titles"]


def names(credits):
    return [e["node"]["name"]["nameText"]["text"] for e in (credits or {}).get("edges", [])]


def simplify(t):
    rating = t.get("ratingsSummary") or {}
    poster = (t.get("primaryImage") or {}).get("url")
    if poster:
        # Ask Amazon's image CDN for a 500px-wide copy instead of the full-size original.
        poster = poster.replace("._V1_.", "._V1_SX500_.")
    return {
        "title": (t.get("titleText") or {}).get("text"),
        "year": (t.get("releaseYear") or {}).get("year"),
        "plot": ((t.get("plot") or {}).get("plotText") or {}).get("plainText"),
        "poster": poster,
        "rating": rating.get("aggregateRating"),
        "votes": rating.get("voteCount"),
        "runtime": ((t.get("runtime") or {}).get("seconds") or 0) // 60 or None,
        "certificate": (t.get("certificate") or {}).get("rating"),
        "genres": [g["genre"]["text"] for g in (t.get("titleGenres") or {}).get("genres", [])],
        "directors": names(t.get("directors")),
        "cast": names(t.get("cast")),
    }


def save(out):
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=0, sort_keys=True), encoding="utf-8")


def main():
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        ids = sorted({r["imdb_id"] for r in csv.DictReader(f) if r["imdb_id"].startswith("tt")})
    out = {} if "--all" in sys.argv or not OUT_PATH.exists() else json.loads(OUT_PATH.read_text(encoding="utf-8"))
    todo = [i for i in ids if i not in out]
    print(f"{len(ids)} titles in CSV, {len(todo)} to fetch")
    for n in range(0, len(todo), BATCH):
        if n:
            time.sleep(DELAY)
        chunk = todo[n:n + BATCH]
        try:
            titles = fetch(chunk)
        except urllib.error.HTTPError as e:
            if e.code in (403, 429):
                print(f"IMDb returned {e.code}; stopping. Saved what we have, re-run later to resume.")
                break
            raise
        for t in titles:
            if t:
                out[t["id"]] = simplify(t)
        save(out)
        print(f"  {min(n + BATCH, len(todo))}/{len(todo)}")
    missing = [i for i in ids if i not in out]
    if missing:
        print("No IMDb data for:", ", ".join(missing))
    save(out)
    print(f"{len(out)} titles in {OUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
