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
  category: ['category', 'segment'],
  bottle_size: ['bottle_size', 'bottle size', 'size', 'pack size', 'pack_size'],
  mrp: ['mrp', 'price', 'rate'],
  effective_month: ['effective_month', 'effective month', 'month', 'effective date']
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
  'category',
  'bottle_size',
  'effective_month'
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

function valueFor(row, field) {
  const aliases = fieldAliases[field] || [field];
  const matchingKey = Object.keys(row).find((key) => aliases.includes(normalizeHeader(key)));
  return matchingKey ? row[matchingKey] : '';
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

export async function readWorkbookRows(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
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
        category: normalizeText(valueFor(row, 'category')),
        status: normalizeText(valueFor(row, 'status')) || 'Active'
      };
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
  return [row.brand_name, row.bottle_size, row.effective_month].map(normalizeKey).join('|');
}
