/**
 * Home Health Log — Apps Script sync endpoint.
 *
 * This does NOT run on GitHub Pages. It runs inside Google's servers, bound
 * to your Google Sheet. The static app talks to it with a JSON body over
 * POST, using an "action" field:
 *   - "append" (default/omitted) — add a new row
 *   - "update" — overwrite the row matching body.id (falls back to append
 *     if no row with that id exists)
 *   - "delete" — remove the row matching body.id
 *   - "list"   — return every row as JSON, for cross-device sync
 *
 * Setup:
 * 1. Open the Google Sheet you want entries appended to.
 * 2. Extensions > Apps Script. Delete the placeholder `myFunction` code and
 *    paste this whole file in its place.
 * 3. Replace SHARED_SECRET below with a long random string of your own —
 *    it must match exactly what you paste into the app's Sync settings
 *    panel. Do not reuse the placeholder.
 * 4. Make sure a sheet/tab named to match SHEET_NAME exists (create one if
 *    it doesn't — a blank tab is fine, appendRow will just add to row 1).
 *    An optional header row (Date, Time, Systolic, Diastolic, Pulse,
 *    Weight, Notes, ID, Received At) is fine too — it's auto-detected and
 *    skipped when reading entries back.
 * 5. Deploy > New deployment > select type "Web app".
 *      Execute as: Me
 *      Who has access: Anyone
 * 6. Click Deploy, then Authorize access when prompted. This is you
 *    granting your own script permission to edit your own sheet — it's a
 *    one-time consent, not a public OAuth flow, and nobody else sees it.
 * 7. Copy the resulting URL (ends in /exec) into the app's Sync settings
 *    panel, along with the same secret from step 3.
 *
 * If you ever need to rotate the secret, change SHARED_SECRET here, re-Deploy
 * (Manage deployments > Edit > New version), and update the app's settings
 * to match. IMPORTANT: if you ever paste a fresh copy of this whole file in
 * to pick up updates, re-check that this line still has YOUR secret and not
 * this placeholder — pasting the file wholesale overwrites it.
 */

const SHARED_SECRET = 'PASTE_YOUR_OWN_RANDOM_SECRET_HERE';
const SHEET_NAME = 'Entries';

function doPost(e) {
  var result;
  try {
    var body = JSON.parse(e.postData.contents);

    if (body.secret !== SHARED_SECRET) {
      return respond_({ status: 'error', message: 'unauthorized' });
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return respond_({ status: 'error', message: 'sheet "' + SHEET_NAME + '" not found' });
    }

    if (body.action === 'list') {
      return respond_({ status: 'ok', entries: readEntries_(sheet) });
    }

    if (body.action === 'update') {
      var updateRow = findRowById_(sheet, body.id);
      if (updateRow === -1) {
        appendRow_(sheet, body);
      } else {
        sheet.getRange(updateRow, 1, 1, 9).setValues([rowValues_(body)]);
      }
      return respond_({ status: 'ok' });
    }

    if (body.action === 'delete') {
      var deleteRow = findRowById_(sheet, body.id);
      if (deleteRow !== -1) sheet.deleteRow(deleteRow);
      return respond_({ status: 'ok' });
    }

    appendRow_(sheet, body);
    result = { status: 'ok' };
  } catch (err) {
    result = { status: 'error', message: err.message };
  }
  return respond_(result);
}

function rowValues_(body) {
  return [
    body.date || '',
    body.time || '',
    body.sys != null ? body.sys : '',
    body.dia != null ? body.dia : '',
    body.pulse != null ? body.pulse : '',
    body.weight != null ? body.weight : '',
    body.notes || '',
    body.id || '',
    new Date()
  ];
}

function appendRow_(sheet, body) {
  sheet.appendRow(rowValues_(body));
}

function findRowById_(sheet, id) {
  if (!id) return -1;
  var values = sheet.getDataRange().getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][7]) === String(id)) return i + 1; // 1-based row index
  }
  return -1;
}

function readEntries_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length === 0) return [];

  var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  var startRow = 0;
  if (String(values[0][0]).trim().toLowerCase() === 'date') startRow = 1;

  var out = [];
  for (var i = startRow; i < values.length; i++) {
    var r = values[i];
    if (!r[0]) continue; // skip blank rows

    var date = formatDateCell_(r[0], tz);
    var sys = toNumberOrNull_(r[2]);
    var dia = toNumberOrNull_(r[3]);

    // Guard against stray text ending up in a cell (e.g. someone pasting
    // into the sheet by mistake instead of the script editor) — a real
    // entry always has a proper date and both BP readings.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    if (sys === null || dia === null) continue;

    out.push({
      date: date,
      time: formatTimeCell_(r[1], tz),
      sys: sys,
      dia: dia,
      pulse: toNumberOrNull_(r[4]),
      weight: toNumberOrNull_(r[5]),
      notes: r[6] || '',
      id: r[7] ? String(r[7]) : ''
    });
  }
  return out;
}

function toNumberOrNull_(v) {
  if (v === '' || v === null || v === undefined) return null;
  var n = Number(v);
  return isNaN(n) ? null : n;
}

// Sheets auto-converts strings that look like dates/times into real Date
// values, so cells may come back either as the original string or as a
// Date object depending on how they were entered — handle both.

function formatDateCell_(v, tz) {
  if (v instanceof Date) return Utilities.formatDate(v, tz, 'yyyy-MM-dd');
  return String(v);
}

function formatTimeCell_(v, tz) {
  if (v instanceof Date) return Utilities.formatDate(v, tz, 'HH:mm');
  return String(v);
}

function respond_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
