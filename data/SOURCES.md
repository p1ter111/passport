# Passport data sources

## Visa requirements matrix

- Source: `imorte/passport-index-data`
- Repository: https://github.com/imorte/passport-index-data
- Snapshot: 17 February 2026
- Coverage: 199 passports and 199 destinations
- License: MIT
- Local file: `passport-index.json`
- Product freshness policy: review the matrix every 3 days and mark it stale after 7 days

The source distinguishes visa-free travel, visa on arrival, ETA, e-visa,
visa required, no admission, and the passport holder's own country.

## Official passport ranking overlay

- Source: `Henley Passport Index`
- Ranking page: https://www.henleyglobal.com/passport-index/ranking
- API snapshot: `henley-ranking-2026.json`
- Edition: July 2026
- Coverage: 199 passports
- Methodology: destinations accessible without obtaining a prior visa; visa-on-arrival and ETA access are included.

The generated `accessibleCountries`, `passportRank`, and relative `freedomScore`
fields use this official ranking snapshot. The local matrix counts remain
available for the country detail map, where visa-free, visa-on-arrival, ETA,
e-visa, and visa-required destinations are shown separately.

Visa policies can change without notice. This dataset is suitable for product
exploration and comparison, but travelers should confirm requirements with the
destination's official immigration authority before departure.

The travel planner records the time a user opens a route-specific visa search in
local browser storage. That timestamp indicates when the search was opened; it
does not replace confirmation from the destination authority.

## Passport cover history

- Archive source: `Passport Index` country cover images preserved by the `Internet Archive`
- Archive query: https://web.archive.org/cdx/search/cdx?url=www.passportindex.org/countries/&matchType=prefix&output=json&fl=urlkey,timestamp,digest,statuscode,mimetype,original&filter=statuscode:200&filter=mimetype:image/png&collapse=digest&from=2014&to=2025&limit=10000
- Local index: `passport-history-sources.json`
- Local assets: `public/passports-history/<iso3>/`
- Coverage: all 199 project countries; 464 visually distinct archive captures plus current source references

Archive entries use `dateType: archive-observed`. Their year and `observedAt`
are the date when the real image was captured by the web archive, not an
official passport issue date. The interface states this distinction on every
entry. Where an issuing authority or a public-domain record supports an issue
period, the entry uses `dateType: official-issue` instead. Passport Index
images remain subject to the source site's rights; each archive card links to
the original replay and the CDX evidence record.
