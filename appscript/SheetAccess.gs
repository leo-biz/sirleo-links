// ── SheetAccess.gs ────────────────────────────────────────────────────────────
// All spreadsheet reads and writes go through here. Nothing else touches the DB.

function db() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// Read a two-column key/value sheet into a plain object
function getKV(name) {
  const sh = db().getSheetByName(name);
  if (!sh) return {};
  const obj = {};
  sh.getDataRange().getValues().forEach(([k, v]) => { if (k) obj[String(k).trim()] = v; });
  return obj;
}

// Read all rows except the header row
function getRows(name) {
  const sh = db().getSheetByName(name);
  if (!sh) return [];
  const v = sh.getDataRange().getValues();
  return v.length > 1 ? v.slice(1) : [];
}

// Append a row, creating the sheet if it doesn't exist
function appendRow(name, row) {
  const ss = db();
  (ss.getSheetByName(name) || ss.insertSheet(name)).appendRow(row);
}

// Config and identity cached per execution
let _config   = null;
let _identity = null;

function config() {
  return _config || (_config = getKV(SHEET.CONFIG));
}

function identity() {
  return _identity || (_identity = getKV(SHEET.IDENTITY));
}
