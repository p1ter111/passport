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
