import * as XLSX from 'xlsx';
import { currentMonth } from './format';

const fieldAliases = {
  retail_name: ['retail_name', 'retail name', 'retailer', 'retailer name', 'shop_name', 'shop name', 'shop', 'name', 'retail'],
  license_code: ['license_code', 'license code', 'licence_code', 'licence code', 'license', 'licence'],
  shop_type: ['shop_type', 'shop type', 'type'],
  area: ['area', 'location', 'territory'],
  contact_person: ['contact_person', 'contact person', 'contact', 'owner'],
  phone: ['phone', 'mobile', 'contact number', 'phone number'],
  status: ['status'],
  brand_name: ['brand_name', 'brand name', 'brand', 'name'],
  report_code: ['report_code', 'report code', 'short code', 'code'],
  category: ['category', 'segment'],
  bottle_size: ['bottle_size', 'bottle size', 'size', 'pack size', 'pack_size'],
  mrp: ['mrp', 'price', 'rate'],
  mrp_750ml: ['mrp_750ml', '750 ml mrp', '750ml mrp', '750 mrp'],
  mrp_500ml: ['mrp_500ml', '500 ml mrp', '500ml mrp', '500 mrp'],
  mrp_375ml: ['mrp_375ml', '375 ml mrp', '375ml mrp', '375 mrp'],
  mrp_180ml: ['mrp_180ml', '180 ml mrp', '180ml mrp', '180 mrp'],
  mrp_90ml: ['mrp_90ml', '90 ml mrp', '90ml mrp', '90 mrp'],
  effective_month: ['effective_month', 'effective month', 'month', 'effective date'],
  month: ['month', 'month of', 'report month'],
  date: ['date', 'sale date', 'promotion date'],
  retail_name: ['retail_name', 'retail name', 'retailer', 'retailer name', 'shop_name', 'shop name', 'shop', 'name', 'retail'],
  qty_750ml: ['qty_750ml', '750 ml', '750ml', '750 quantity', '750 ml quantity'],
  qty_500ml: ['qty_500ml', '500 ml', '500ml', '500 quantity', '500 ml quantity'],
  qty_375ml: ['qty_375ml', '375 ml', '375ml', '375 quantity', '375 ml quantity'],
  qty_180ml: ['qty_180ml', '180 ml', '180ml', '180 quantity', '180 ml quantity'],
  qty_90ml: ['qty_90ml', '90 ml', '90ml', '90 quantity', '90 ml quantity'],
  stock_750ml: ['stock_750ml', '750 ml stock', '750ml stock', '750 stock'],
  stock_500ml: ['stock_500ml', '500 ml stock', '500ml stock', '500 stock'],
  stock_375ml: ['stock_375ml', '375 ml stock', '375ml stock', '375 stock'],
  stock_180ml: ['stock_180ml', '180 ml stock', '180ml stock', '180 stock'],
  stock_90ml: ['stock_90ml', '90 ml stock', '90ml stock', '90 stock'],
  rum_market_share: ['rum_market_share', 'rum market share', 'market share', 'rum market share %'],
  remarks: ['remarks', 'remark', 'notes']
};

const textFields = new Set([
  'retail_name',
  'license_code',
  'shop_type',
  'area',
  'contact_person',
  'phone',
  'status',
  'brand_name',
  'report_code',
  'category',
  'bottle_size',
  'effective_month',
  'month',
  'date',
  'remarks'
]);

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function normalizeText(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim().replace(/\s+/g, ' ');
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase();
}

function fallbackName(values) {
  const textValues = values.filter((value) => !/^\d+(\.\d+)?$/.test(value));
  return textValues[textValues.length - 1] || '';
}

function valueFor(row, field) {
  const aliases = fieldAliases[field] || [field];
  const matchingKey = Object.keys(row).find((key) => aliases.includes(normalizeHeader(key)));
  if (matchingKey) return row[matchingKey];

  const values = Object.values(row).map(normalizeText).filter(Boolean);
  if (field === 'brand_name' || field === 'retail_name') return fallbackName(values);
  if (field === 'status') return values.find((value) => ['active', 'inactive'].includes(value.toLowerCase())) || '';
  return '';
}

function normalizeMonth(value) {
  if (!value) return currentMonth();
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 7);

  const raw = normalizeText(value);
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.slice(0, 7);
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
    const [day, month, year] = raw.split('/');
    return `${year}-${month.padStart(2, '0')}`;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? currentMonth() : parsed.toISOString().slice(0, 7);
}

function numeric(value) {
  const parsed = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);

  const raw = normalizeText(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
    const [day, month, year] = raw.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString().slice(0, 10) : parsed.toISOString().slice(0, 10);
}

function quantityTotals(record, prefix) {
  const totalBottles =
    numeric(record[`${prefix}_750ml`]) +
    numeric(record[`${prefix}_500ml`]) +
    numeric(record[`${prefix}_375ml`]) +
    numeric(record[`${prefix}_180ml`]) +
    numeric(record[`${prefix}_90ml`]);
  const totalCases = Number((
    numeric(record[`${prefix}_750ml`]) / 12 +
    numeric(record[`${prefix}_500ml`]) / 24 +
    numeric(record[`${prefix}_375ml`]) / 24 +
    numeric(record[`${prefix}_180ml`]) / 48 +
    numeric(record[`${prefix}_90ml`]) / 96
  ).toFixed(2));
  return { totalBottles, totalCases };
}

export async function readWorkbookRows(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  const headerIndex = matrix.findIndex((row) => row.some((cell) => isKnownHeader(cell)));

  if (headerIndex >= 0) {
    const headers = matrix[headerIndex].map((cell, index) => normalizeText(cell) || `__EMPTY_${index}`);
    return matrix
      .slice(headerIndex + 1)
      .filter((row) => row.some((cell) => normalizeText(cell)))
      .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
  }

  return matrix
    .filter((row) => row.some((cell) => normalizeText(cell)))
    .map((row) => Object.fromEntries(row.map((cell, index) => [`__EMPTY_${index}`, cell ?? ''])));
}

function isKnownHeader(value) {
  const header = normalizeHeader(value);
  if (!header) return false;
  return Object.values(fieldAliases).some((aliases) => aliases.includes(header)) || ['s.l', 'sl', 'retail name'].includes(header);
}

export function prepareRetailRows(rawRows, existingRetailers) {
  const existing = new Set(existingRetailers.map(normalizeKey));
  const seen = new Set();

  return rawRows
    .map((row, index) => {
      const record = {
        retail_name: normalizeText(valueFor(row, 'retail_name')),
        license_code: normalizeText(valueFor(row, 'license_code')),
        shop_type: normalizeText(valueFor(row, 'shop_type')),
        area: normalizeText(valueFor(row, 'area')),
        contact_person: normalizeText(valueFor(row, 'contact_person')),
        phone: normalizeText(valueFor(row, 'phone')),
        status: normalizeText(valueFor(row, 'status')) || 'Active'
      };
      const key = normalizeKey(record.retail_name);
      const invalid = !record.retail_name;
      const duplicate = key && (existing.has(key) || seen.has(key));
      if (key) seen.add(key);
      return { index: index + 1, record, key, invalid, duplicate, status: invalid ? 'Invalid' : duplicate ? 'Duplicate' : 'Ready' };
    });
}

export function prepareBrandRows(rawRows, existingBrands) {
  const existing = new Set(existingBrands.map(normalizeKey));
  const seen = new Set();

  return rawRows
    .map((row, index) => {
      const record = {
        brand_name: normalizeText(valueFor(row, 'brand_name')),
        report_code: normalizeText(valueFor(row, 'report_code')),
        category: normalizeText(valueFor(row, 'category')),
        status: normalizeText(valueFor(row, 'status')) || 'Active'
      };
      record.report_code = record.report_code || record.brand_name;
      const key = normalizeKey(record.brand_name);
      const invalid = !record.brand_name;
      const duplicate = key && (existing.has(key) || seen.has(key));
      if (key) seen.add(key);
      return { index: index + 1, record, key, invalid, duplicate, status: invalid ? 'Invalid' : duplicate ? 'Duplicate' : 'Ready' };
    });
}

export function prepareMrpRows(rawRows, existingMrpRows) {
  const existing = new Set(existingMrpRows.map((row) => mrpKey(row)));
  const seen = new Set();

  return rawRows
    .map((row, index) => {
      const record = {
        brand_name: normalizeText(valueFor(row, 'brand_name')),
        category: normalizeText(valueFor(row, 'category')),
        bottle_size: normalizeText(valueFor(row, 'bottle_size')),
        mrp: numeric(valueFor(row, 'mrp')),
        mrp_750ml: numeric(valueFor(row, 'mrp_750ml')),
        mrp_500ml: numeric(valueFor(row, 'mrp_500ml')),
        mrp_375ml: numeric(valueFor(row, 'mrp_375ml')),
        mrp_180ml: numeric(valueFor(row, 'mrp_180ml')),
        mrp_90ml: numeric(valueFor(row, 'mrp_90ml')),
        effective_month: normalizeMonth(valueFor(row, 'effective_month')),
        status: normalizeText(valueFor(row, 'status')) || 'Active'
      };
      const key = mrpKey(record);
      const invalid = !record.brand_name;
      const duplicate = key && (existing.has(key) || seen.has(key));
      if (key) seen.add(key);
      return { index: index + 1, record, key, invalid, duplicate, status: invalid ? 'Invalid' : duplicate ? 'Duplicate' : 'Ready' };
    });
}

export function prepareSssRows(rawRows, existingRows = []) {
  const existing = new Set(existingRows.map((row) => reportKey(row, ['month', 'retail_name', 'brand_name'])));
  const seen = new Set();

  return rawRows.map((row, index) => {
    const record = {
      month: normalizeMonth(valueFor(row, 'month')),
      retail_name: normalizeText(valueFor(row, 'retail_name')),
      brand_name: normalizeText(valueFor(row, 'brand_name')),
      qty_750ml: numeric(valueFor(row, 'qty_750ml')),
      qty_500ml: numeric(valueFor(row, 'qty_500ml')),
      qty_375ml: numeric(valueFor(row, 'qty_375ml')),
      qty_180ml: numeric(valueFor(row, 'qty_180ml')),
      qty_90ml: numeric(valueFor(row, 'qty_90ml')),
      rum_market_share: numeric(valueFor(row, 'rum_market_share')),
      remarks: normalizeText(valueFor(row, 'remarks'))
    };
    const totals = quantityTotals(record, 'qty');
    record.total_bottles = totals.totalBottles;
    record.total_cases = totals.totalCases;
    record.quantity_sold = totals.totalBottles;
    const key = reportKey(record, ['month', 'retail_name', 'brand_name']);
    const invalid = !record.retail_name || !record.brand_name;
    const duplicate = key && (existing.has(key) || seen.has(key));
    if (key) seen.add(key);
    return { index: index + 1, record, key, invalid, duplicate, status: invalid ? 'Invalid' : duplicate ? 'Duplicate' : 'Ready' };
  });
}

export function prepareSpotPromotionRows(rawRows, existingRows = []) {
  const existing = new Set(existingRows.map((row) => reportKey(row, ['month', 'date', 'retail_name', 'brand_name'])));
  const seen = new Set();

  return rawRows.map((row, index) => {
    const record = {
      promoter_name: 'Spot Promotion',
      month: normalizeMonth(valueFor(row, 'month')),
      date: normalizeDate(valueFor(row, 'date')),
      retail_name: normalizeText(valueFor(row, 'retail_name')),
      brand_name: normalizeText(valueFor(row, 'brand_name')),
      qty_750ml: numeric(valueFor(row, 'qty_750ml')),
      qty_500ml: numeric(valueFor(row, 'qty_500ml')),
      qty_375ml: numeric(valueFor(row, 'qty_375ml')),
      qty_180ml: numeric(valueFor(row, 'qty_180ml')),
      qty_90ml: numeric(valueFor(row, 'qty_90ml')),
      remarks: normalizeText(valueFor(row, 'remarks'))
    };
    const totals = quantityTotals(record, 'qty');
    record.total_bottles = totals.totalBottles;
    record.total_cases = totals.totalCases;
    record.quantity_sold = totals.totalBottles;
    const key = reportKey(record, ['month', 'date', 'retail_name', 'brand_name']);
    const invalid = !record.retail_name || !record.brand_name;
    const duplicate = key && (existing.has(key) || seen.has(key));
    if (key) seen.add(key);
    return { index: index + 1, record, key, invalid, duplicate, status: invalid ? 'Invalid' : duplicate ? 'Duplicate' : 'Ready' };
  });
}

export function prepareOpeningStockRows(rawRows, existingRows = []) {
  const existing = new Set(existingRows.map((row) => reportKey(row, ['month', 'retail_name', 'brand_name'])));
  const seen = new Set();

  return rawRows.map((row, index) => {
    const record = {
      month: normalizeMonth(valueFor(row, 'month')),
      date: `${normalizeMonth(valueFor(row, 'month'))}-01`,
      retail_name: normalizeText(valueFor(row, 'retail_name')),
      brand_name: normalizeText(valueFor(row, 'brand_name')),
      stock_750ml: numeric(valueFor(row, 'stock_750ml')),
      stock_500ml: numeric(valueFor(row, 'stock_500ml')),
      stock_375ml: numeric(valueFor(row, 'stock_375ml')),
      stock_180ml: numeric(valueFor(row, 'stock_180ml')),
      stock_90ml: numeric(valueFor(row, 'stock_90ml')),
      remarks: normalizeText(valueFor(row, 'remarks'))
    };
    const totals = quantityTotals(record, 'stock');
    record.total_stock_bottles = totals.totalBottles;
    record.total_stock_cases = totals.totalCases;
    record.opening_stock_quantity = totals.totalBottles;
    record.opening_stock_cases = totals.totalCases;
    const key = reportKey(record, ['month', 'retail_name', 'brand_name']);
    const invalid = !record.retail_name || !record.brand_name;
    const duplicate = key && (existing.has(key) || seen.has(key));
    if (key) seen.add(key);
    return { index: index + 1, record, key, invalid, duplicate, status: invalid ? 'Invalid' : duplicate ? 'Duplicate' : 'Ready' };
  });
}

export function importSummary(preparedRows) {
  return {
    ready: preparedRows.filter((row) => row.status === 'Ready').length,
    duplicates: preparedRows.filter((row) => row.status === 'Duplicate').length,
    invalid: preparedRows.filter((row) => row.status === 'Invalid').length,
    total: preparedRows.length
  };
}

export function readyRecords(preparedRows) {
  return preparedRows.filter((row) => row.status === 'Ready').map((row) => cleanRecord(row.record));
}

function cleanRecord(record) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => {
      if (textFields.has(key)) return [key, normalizeText(value) || null];
      return [key, value];
    })
  );
}

function mrpKey(row) {
  return [row.brand_name, row.bottle_size || 'wide', row.effective_month].map(normalizeKey).join('|');
}

function reportKey(row, fields) {
  return fields.map((field) => normalizeKey(row[field])).join('|');
}
