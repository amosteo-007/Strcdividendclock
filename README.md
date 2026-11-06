# STRC Dividend Clock

An unofficial, single-page tracker that shows what Strategy's STRC preferred dividend costs in real time, drawn as a leak from the company's USD reserve. Live at **https://strc.wtf**.

> Not affiliated with or endorsed by Strategy Inc. Informational only, not investment advice. Figures are hand-copied or fetched periodically and may lag live data.

## What it shows

- **Two glass tanks on one scale** (full tank = $60B): blue = Strategy's USD assets (USD Reserve + USD Cash), orange = MSTR market cap.
- **The STRC leak**: dividends drip out of the blue tank at `shares x $100 x 12% / 365` per day, shown per second in the headline.
- **Stats grid**: accrual counters (today, since 1 Nov 2026 daily regime, YTD), per-share and aggregate rates.
- **Explainer and FAQ** below the stats, plus a sources block with as-of dates.

The accrual counters are calculations from a fixed share count and rate, not live feeds. The ATM pipe between the tanks is illustrative, not a measured flow.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole site (HTML, CSS, JS). Edit `CONFIG` at the top of the script to update numbers. |
| `data.js` | Written by `fetch-sec.cjs`. Overrides the USD figures when its date is newer than `CONFIG`. |
| `fetch-sec.cjs` | Reads Strategy's 8-K filings from SEC EDGAR and writes `data.js`. |
| `ads.txt` | Google AdSense seller declaration. Must be served at the site root. |
| `privacy.html` | Privacy policy (template, fill in your contact email). |
| `.github/workflows/update-data.yml` | Scheduled GitHub Action that refreshes `data.js`. |
| `.assetsignore` | Keeps non-site files (README, script, workflow) out of the Cloudflare upload. |

## Updating the data

**Automatic (USD Reserve and USD Cash).** SEC requires automated requests to identify you:

```
SEC_USER_AGENT="STRC Dividend Clock you@example.com" node fetch-sec.cjs
```

The GitHub Action already identifies itself with the site owner's contact email, so no setup is needed. To use a different identity, add a repository secret named `SEC_USER_AGENT` (Settings > Secrets and variables > Actions); it overrides the default. The workflow runs every 6 hours and commits `data.js` only when it changes. Weekly 8-Ks update roughly weekly, so this is not tick-by-tick.

**Manual (everything else).** MSTR market cap, annual interest + dividends, STRC price and share count are not in SEC filings. Update them in `CONFIG` in `index.html` together with their `asOf` dates.

## Deploying

Hosted on Cloudflare (Workers static assets) from this repo's root. Automatic redeploy on push is not currently enabled, so deploy manually from the Cloudflare dashboard after changes, or connect the repo under the Worker's Settings > Builds.

## Ads

Google AdSense is loaded from the `<head>` of `index.html`. Enable Auto ads (including Anchor ads) and the consent message in the AdSense dashboard after approval.
