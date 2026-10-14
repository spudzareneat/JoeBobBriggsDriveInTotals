# Drive-In Totals

This is my best attempt to grab as many of Joe Bob's totals, ratings, and Drive-In Academy Award nominations as I can. It's not a perfect list, but I think it's pretty good. My goal is to have an easy-to-use dataset that can be ported to other things. As a bonus, there's a [cool page](https://spudzareneat.github.io/JoeBobBriggsDriveInTotals) hosted on GitHub where you can look up any movie in the list. The drive-in will never die!

## A note about AI

This was made with the help of AI, so if that's not your thing, I totally get it. But with 800 movies and data sources of varying quality all over the place, it never would have gotten done without it.

## How the scraping was done

Scraping was done in a few ways. First, I started with [this excellent list](https://letterboxd.com/ty0005/) from Lincoln on Letterboxd. Next, I gathered sources from YouTube and Joe Bob's Patreon. I fed the audio to WhisperX in a fast pass to get rough transcripts, then ran a finer pass to clean them up. I passed that output through Claude to clean up the Joe Bob-isms. For The Last Drive-In, most movies were covered by the Letterboxd list, but for the missing ones I fed in the audio and took screen grabs of the on-screen totals. I then passed everything through Claude again to help spot-check and find issues, which I did my best to correct manually. I'm sure it's not perfect, so if you spot any issues, please let me know and I'll get them corrected.

## Files

| File | Contents |
|---|---|
| `drivein_totals.csv` | One row per movie: `title`, `year`, `imdb_id`, `first_air_date`, `totals`, `academy_award_nominations`, `star_rating` (Joe Bob's wording), `stars` (numeric), `transcribed`, `llm_model`, `source` |
| `no_totals.csv` | Movies that were checked but have no totals: `title`, `imdb_id`, `series`, `status`, `sources_checked`, `note` |
| `not_scraped.csv` | Movies Joe Bob is known to have hosted that have no source yet: `title`, `year`, `imdb_id`, `series`, `air_date`, `status`, `note` |

## Stats

| | Count |
|---|---:|
| Totals Scraped | **800** |
| Movies with a Star Rating | 732 |
| Drive-In Academy Award nominations | 220 |
| Movies checked but no totals found | **147** |
| Known movies not scraped yet | **210** |

### Movies with no totals (`no_totals.csv`)

| Status | Movies |
|---|---:|
| `no_totals`: source checked, Joe Bob didn't give totals | 74 |
| `stars_only`: star rating given, no totals | 40 |
| `not_found`: source couldn't be found | 28 |

### Missing movies (`not_scraped.csv`)

| Series | Movies |
|---|---:|
| Joe Bob's Drive-In Theater (TMC) | 195 |
| MonsterVision | 15 |

### Where the totals came from

| Source | Movies |
|---|---:|
| Audio transcripts (Patreon, YouTube, Shudder) | 465 |
| Letterboxd list | 233 |
| Video (Shudder on-screen totals graphic) | 43 |
| *Joe Bob Goes to the Drive-In* (1987 book) | 41 |

## Sources

<!-- TODO: fill in exact URLs -->

- **[Lincoln's Letterboxd Totals](https://letterboxd.com/ty0005/)**
- **[Joe Bob Briggs' Patreon](https://www.patreon.com/c/TheLostDriveIn)**
- **[joebobbriggs.com](https://joebobbriggs.com/)**
- **[Shudder](https://www.shudder.com/)**
- **[Joe Bob Goes to the Drive-In (1987)](https://www.amazon.com/Joe-Bob-Goes-Drive-Updated/dp/150674818X)**
- **[TheTVDB](https://thetvdb.com/)**
- **[IMDb](https://www.imdb.com)**
