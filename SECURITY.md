# Security

CarFinder is a static page: no server, no account, no cookies, no analytics, no third-party scripts. The page makes
network requests only for the vehicle photos it links on Wikimedia Commons. Everything else, including the data and
the fonts, is inlined or served from this repository on GitHub Pages.

That leaves a small surface, but not none: every string from the data files is escaped with `esc()` before it reaches
`innerHTML`, permalink parameters are validated before they touch the filter state, and the page sets no state anywhere
except `localStorage` under `cf_*` keys on the visitor's own device.

## Reporting

If you find a way to inject markup through a data row, a URL hash or a localStorage value, or anything else that could
affect another visitor, please report it privately rather than in a public issue: use the
[GitHub security advisory form](https://github.com/destinjones/carfinder/security/advisories/new) for this repository.
Expect an acknowledgement within a week; fixes ship as a normal commit and are noted in `CHANGELOG.md`.

Wrong prices and fees are not security issues; they go through the
[wrong price](https://github.com/destinjones/carfinder/issues/new?template=wrong-price.yml) issue template.
