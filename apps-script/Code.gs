/**
 * Home Health Log — Apps Script sync endpoint.
 *
 * This does NOT run on GitHub Pages. It runs inside Google's servers, bound
 * to your Google Sheet, and the static app POSTs new entries to it.
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
 * to match.
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

    sheet.appendRow([
      body.date || '',
      body.time || '',
      body.sys || '',
      body.dia || '',
      body.pulse || '',
      body.weight || '',
      body.notes || '',
      body.id || '',
      new Date()
    ]);

    result = { status: 'ok' };
  } catch (err) {
    result = { status: 'error', message: err.message };
  }
  return respond_(result);
}

function respond_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
