# Home Health Log

A personal home health logging PWA — morning BP, pulse, and weight, with a
trend dashboard styled after the "specimen report" language of Don's actual
lab reports (reference ranges, red/amber out-of-range flags).

## Current state (design/UX prototype)

- `index.html` — the whole app: entry form, "latest reading" specimen card,
  Chart.js trend charts (BP + weight), recent entries list, and a Sync
  settings panel.
- `manifest.json` + `service-worker.js` + `icons/` — makes it installable to
  a phone home screen and usable offline.
- `apps-script/Code.gs` — Google Apps Script source for the sync endpoint
  (see "Google Sheet sync" below). Not deployed automatically — you paste it
  into your own Sheet's script editor.
- **Data storage: local-first, two-way sync.** Every entry is saved to the
  browser's `localStorage` immediately, so the app works fully offline. If
  sync is configured (see below), each entry is also POSTed to your Google
  Sheet in the background (queued and retried automatically if you're
  offline), and on load — plus whenever you come back online — the app
  pulls the full entry list back from the Sheet and merges it in. That's
  what makes entries logged on one device show up on another.
- **Edit / delete**: each row in "Recent entries" has Edit and Delete
  buttons. Editing overwrites the same row on the Sheet (matched by a
  hidden id) rather than creating a new one; deleting removes it there too.
  Both queue and retry the same way as new entries if you're offline. A
  correction made directly in the Sheet itself (or synced in from another
  device) also gets pulled into the app on next refresh, as long as there's
  no unsynced local edit to that same entry in flight.
- Hosted via GitHub Pages from this repo's root (`main` branch).

## Google Sheet sync

Entries can sync to a Google Sheet via a small Apps Script Web App — no
OAuth consent screen, no client library, just a URL the page POSTs to.

1. Open the target Google Sheet, then **Extensions > Apps Script**.
2. Paste in the contents of [`apps-script/Code.gs`](apps-script/Code.gs).
3. Set `SHARED_SECRET` to your own long random string (do not use the
   placeholder). This is what stops the URL alone from being enough to
   write data — anyone who finds the endpoint URL still needs the secret.
4. Make sure a tab named `Entries` exists in the sheet.
5. **Deploy > New deployment > Web app**, execute as yourself, access set
   to "Anyone." Authorize when prompted (a one-time, self-only consent).
6. Copy the deployed `/exec` URL.
7. In the app, open the "Sync to Google Sheet" panel, paste in the URL and
   the same secret, and save.

Full details and rotation notes are in the comment header of `Code.gs`.

## Known gap / next real step

This is explicitly a **design exploration meant to eventually fold into the
existing Chart.js dashboard** (a separate, more complete multi-metric
dashboard covering weight/BMI, lipids, liver enzymes, BP, uric acid/glucose,
and cardiac risk score, built from a long-running health screening
spreadsheet). Candidate directions from here, roughly in order:

1. Add the other tracked metric groups from the main dashboard (currently
   this prototype only handles BP + weight).
2. ~~Replace local-only storage with real Google Sheets sync~~ — done via
   an Apps Script Web App endpoint (see above); local storage remains the
   offline-first source of truth with sync as a background best-effort.
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
