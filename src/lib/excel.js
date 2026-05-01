import * as XLSX from 'xlsx';
import { INITIAL_STATE } from './constants.js';
import { todayISO } from './formatters.js';

const SHEETS = {
  transactions: 'Transactions',
  categories: 'Categories',
  assets: 'Assets',
  investments: 'Investments',
  snapshots: 'Snapshots',
  settings: 'Settings',
};

const HEADERS = {
  transactions: ['id', 'type', 'amount', 'date', 'categoryId', 'description', 'createdAt'],
  categories: ['id', 'name', 'type', 'color', 'budget'],
  assets: ['id', 'name', 'type', 'value', 'notes', 'createdAt'],
  investments: ['id', 'name', 'type', 'initial', 'current', 'date', 'notes', 'createdAt'],
  snapshots: ['month', 'assets', 'investments'],
  settings: ['theme', 'accent', 'currency'],
};

export function exportStateToExcel(state) {
  const workbook = createStateWorkbook(state);
  XLSX.writeFile(workbook, `finova-backup-${todayISO()}.xlsx`);
}

export function exportStateToExcelBuffer(state) {
  const workbook = createStateWorkbook(state);
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
}

export function exportStateToSpreadsheetRows(state) {
  const workbookState = normalizeIdsForWorkbook(state);

  return [
    createSheetRows(SHEETS.transactions, HEADERS.transactions, workbookState.transactions),
    createSheetRows(SHEETS.categories, HEADERS.categories, workbookState.categories),
    createSheetRows(SHEETS.assets, HEADERS.assets, workbookState.assets),
    createSheetRows(SHEETS.investments, HEADERS.investments, workbookState.investments),
    createSheetRows(SHEETS.snapshots, HEADERS.snapshots, workbookState.snapshots),
    createSheetRows(SHEETS.settings, HEADERS.settings, [workbookState.settings]),
  ];
}

function createStateWorkbook(state) {
  const workbookState = normalizeIdsForWorkbook(state);
  const workbook = XLSX.utils.book_new();

  appendSheet(workbook, SHEETS.transactions, HEADERS.transactions, workbookState.transactions);
  appendSheet(workbook, SHEETS.categories, HEADERS.categories, workbookState.categories);
  appendSheet(workbook, SHEETS.assets, HEADERS.assets, workbookState.assets);
  appendSheet(workbook, SHEETS.investments, HEADERS.investments, workbookState.investments);
  appendSheet(workbook, SHEETS.snapshots, HEADERS.snapshots, workbookState.snapshots);
  appendSheet(workbook, SHEETS.settings, HEADERS.settings, [workbookState.settings]);

  return workbook;
}

function normalizeIdsForWorkbook(state) {
  const categoryIdMap = new Map(state.categories.map((item, index) => [item.id, `cat_${index + 1}`]));

  return {
    ...state,
    categories: state.categories.map((item, index) => ({ ...item, id: `cat_${index + 1}` })),
    transactions: state.transactions.map((item, index) => ({
      ...item,
      id: `tx_${index + 1}`,
      categoryId: categoryIdMap.get(item.categoryId) || item.categoryId,
    })),
    assets: state.assets.map((item, index) => ({ ...item, id: `asset_${index + 1}` })),
    investments: state.investments.map((item, index) => ({ ...item, id: `inv_${index + 1}` })),
  };
}

export async function importStateFromExcel(file) {
  const buffer = await file.arrayBuffer();
  return importStateFromExcelBuffer(buffer);
}

export function importStateFromExcelBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });

  return {
    ...INITIAL_STATE,
    transactions: readSheet(workbook, SHEETS.transactions).map(normalizeTransaction),
    categories: readSheet(workbook, SHEETS.categories).map(normalizeCategory),
    assets: readSheet(workbook, SHEETS.assets).map(normalizeAsset),
    investments: readSheet(workbook, SHEETS.investments).map(normalizeInvestment),
    snapshots: readSheet(workbook, SHEETS.snapshots).map(normalizeSnapshot),
    settings: {
      ...INITIAL_STATE.settings,
      ...(readSheet(workbook, SHEETS.settings)[0] || {}),
    },
  };
}

function appendSheet(workbook, name, headers, rows) {
  const sheetRows = rows.map((row) =>
    headers.reduce((out, header) => {
      out[header] = row[header] ?? '';
      return out;
    }, {}),
  );
  const worksheet = XLSX.utils.json_to_sheet(sheetRows, { header: headers });
  worksheet['!cols'] = headers.map((header) => ({ wch: Math.max(12, header.length + 4) }));
  XLSX.utils.book_append_sheet(workbook, worksheet, name);
}

function createSheetRows(name, headers, rows) {
  return {
    name,
    values: [
      headers,
      ...rows.map((row) => headers.map((header) => row[header] ?? '')),
    ],
  };
}

function readSheet(workbook, name) {
  const worksheet = workbook.Sheets[name];
  if (!worksheet) return [];
  return XLSX.utils.sheet_to_json(worksheet, { defval: '' });
}

function normalizeTransaction(row) {
  return {
    id: asString(row.id),
    type: asString(row.type),
    amount: asNumber(row.amount),
    date: asDateString(row.date),
    categoryId: asString(row.categoryId),
    description: asString(row.description),
    createdAt: asCreatedAt(row.createdAt),
  };
}

function normalizeCategory(row) {
  return {
    id: asString(row.id),
    name: asString(row.name),
    type: asString(row.type),
    color: asString(row.color),
    budget: asNumber(row.budget),
  };
}

function normalizeAsset(row) {
  return {
    id: asString(row.id),
    name: asString(row.name),
    type: asString(row.type),
    value: asNumber(row.value),
    notes: asString(row.notes),
    createdAt: asCreatedAt(row.createdAt),
  };
}

function normalizeInvestment(row) {
  return {
    id: asString(row.id),
    name: asString(row.name),
    type: asString(row.type),
    initial: asNumber(row.initial),
    current: asNumber(row.current),
    date: asDateString(row.date),
    notes: asString(row.notes),
    createdAt: asCreatedAt(row.createdAt),
  };
}

function normalizeSnapshot(row) {
  return {
    month: asString(row.month),
    assets: asNumber(row.assets),
    investments: asNumber(row.investments),
  };
}

function asString(value) {
  return String(value ?? '').trim();
}

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function asCreatedAt(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : Date.now();
}

function asDateString(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = asString(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
  }
  return text;
}
