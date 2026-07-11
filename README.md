# Home Health Log

A personal home health logging PWA — morning BP, pulse, and weight, with a
trend dashboard styled after the "specimen report" language of Don's actual
lab reports (reference ranges, red/amber out-of-range flags).

## Current state (design/UX prototype)

- `index.html` — the whole app: entry form, "latest reading" specimen card,
  Chart.js trend charts (BP + weight), recent entries list.
- `manifest.json` + `service-worker.js` + `icons/` — makes it installable to
  a phone home screen and usable offline.
- **Data storage: browser-local only.** Entries are saved via the page's own
  in-browser storage. There is no backend and no sync between devices yet.
- Hosted via GitHub Pages from this repo's root (`main` branch).

## Known gap / next real step

This is explicitly a **design exploration meant to eventually fold into the
existing Chart.js dashboard** (a separate, more complete multi-metric
dashboard covering weight/BMI, lipids, liver enzymes, BP, uric acid/glucose,
and cardiac risk score, built from a long-running health screening
spreadsheet). Candidate directions from here, roughly in order:

1. Add the other tracked metric groups from the main dashboard (currently
   this prototype only handles BP + weight).
2. Replace local-only storage with real Google Sheets API sync (OAuth setup
   required — this is the part that couldn't be done inside a sandboxed
   Claude.ai artifact, which is why this project exists as its own repo).
3. Merge this logging UI into the main Chart.js dashboard as a single
   properly deployed page/app, rather than two separate tools.
4. Retire the AppSheet + Google Sheets logging setup once this replaces it
   end-to-end (not urgent — AppSheet works fine today).

## Local development

No build step — it's static HTML/CSS/JS. To preview changes locally before
pushing, either open `index.html` directly in a browser, or serve it so the
service worker behaves correctly:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## Deploying

Push to `main` — GitHub Pages is configured to deploy from the root of this
branch. Changes typically go live within a minute or two.
