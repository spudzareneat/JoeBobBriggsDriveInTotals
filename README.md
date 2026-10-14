# Drive-In Totals

A dataset of Joe Bob Briggs' **Drive-In Totals**: the running tally of dead bodies, breasts, and "fu" that he reads out for every movie he hosts. It also includes his star ratings and Drive-In Academy Award nominations. It covers his newspaper column and book, *Joe Bob's Drive-In Theater* (TMC), *MonsterVision* (TNT), and *The Last Drive-In* (Shudder).

## Stats

| | Count |
|---|---:|
| Movies with Drive-In Totals | **800** |
| …with a star rating | 732 |
| …with Drive-In Academy Award nominations | 220 |
| Movies checked but no totals found | **147** |
| Known movies not scraped yet | **210** |

### Movies with no totals (`no_totals.csv`)

| Status | Movies |
|---|---:|
| `no_totals`: source checked, Joe Bob didn't give totals | 74 |
| `stars_only`: star rating given, no totals | 40 |
| `not_found`: source couldn't be found | 28 |
| `locked`: source exists but isn't accessible | 5 |

### Missing movies (`not_scraped.csv`)

| Series | Movies |
|---|---:|
| Joe Bob's Drive-In Theater (TMC) | 195 |
| MonsterVision | 15 |

## Files

| File | Contents |
|---|---|
| `drivein_totals.csv` | One row per movie: `title`, `year`, `imdb_id`, `first_air_date`, `totals`, `academy_award_nominations`, `star_rating` (Joe Bob's wording), `stars` (numeric), `transcribed`, `llm_model`, `source` |
| `no_totals.csv` | Movies that were checked but have no totals: `title`, `imdb_id`, `series`, `status`, `sources_checked`, `note` |
| `not_scraped.csv` | Movies Joe Bob is known to have hosted that have no source yet: `title`, `year`, `imdb_id`, `series`, `air_date`, `status`, `note` |

## Viewer

`index.html` is a searchable page for the totals, styled after *The Last Drive-In*. To host it, turn on GitHub Pages for this repo (Settings → Pages → deploy from `main`, root folder). Each movie has its own link (`#tt0055830`).

To try it locally, run `python -m http.server` and open http://localhost:8000. Opening the file directly won't work, because the browser blocks it from loading the CSV.

Posters, plots and other IMDb details come from `site/imdb.json`. IMDb doesn't let other websites request its data, so the page can't look titles up live. Instead, run this after adding movies:

```
python scripts/fetch_imdb.py          # fetch only titles missing from imdb.json
python scripts/fetch_imdb.py --all    # refresh everything
```

It asks for 50 titles per request and waits 5 seconds between requests (800 movies take 16 requests). If IMDb returns 429 or 403, it stops and keeps what it already fetched.

## How the scraping was done

<!-- TODO: describe the process. Some prompts:
  - Letterboxd: how the ty0005 list was pulled
  - Audio: how the Patreon / YouTube / local episodes were downloaded and transcribed,
    and which transcription tool was used
  - LLM extraction: how totals, nominations and star ratings were pulled out of the
    transcripts (the `llm_model` column records claude-code, claude-cli, or a local
    Llama 3 8B model)
  - Shudder subtitles and the on-screen totals graphics for The Last Drive-In
  - Cleanup: de-duplication, IMDb matching, air dates
-->

_TODO_

### Where the totals came from

| Source | Movies |
|---|---:|
| Audio transcripts (Patreon, YouTube, local recordings) | 465 |
| Letterboxd list | 233 |
| Video (on-screen totals graphic) | 43 |
| *Joe Bob Goes to the Drive-In* (1987 book) | 41 |
| Shudder subtitles | 18 |

## Sources

<!-- TODO: fill in exact URLs -->

- **Letterboxd**: list by [ty0005](https://letterboxd.com/ty0005/) _(TODO: link the specific list)_
- **Joe Bob Briggs Patreon**: _(TODO: link)_ (Joe Bob's Drive-In Theater and MonsterVision episodes)
- **YouTube**: _(TODO: link channels/playlists)_ (MonsterVision, TMC, and Shudder clips)
- **[joebobbriggs.com](https://joebobbriggs.com/)**: Last Drive-In totals clips and graphics
- **Shudder**: *The Last Drive-In with Joe Bob Briggs* subtitles
- **Book**: Joe Bob Briggs, *Joe Bob Goes to the Drive-In* (1987)
- **TheTVDB**: episode list for *Joe Bob's Drive-In Theater* _(TODO: link)_, used to build `not_scraped.csv`
- **IMDb**: movie ids
