import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { availabilityCodes, bottleSizes, flattenSpotBrands, sizeKeys, spotPromotionGroups, ssMarketShareCodes, ssReportBrands, sumBottles, sumCases } from './reportDefinitions';

const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7F1D1D' } };
const subHeaderFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };

function styleHeader(row, fill = subHeaderFill) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FF111827' } };
    cell.fill = fill;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder();
  });
}

function thinBorder() {
  return {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
  };
}

function normalizeFilePart(value) {
  return String(value || 'all').replaceAll(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'all';
}

async function saveWorkbook(workbook, filename) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, filename);
}

export async function downloadExcel({ title, columns, rows, month }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Support System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(title.slice(0, 31));
  const lastColumn = Math.max(columns.length, 1);
  sheet.mergeCells(1, 1, 1, lastColumn);
  sheet.getCell(1, 1).value = `Support System - ${title}`;
  sheet.getCell(1, 1).font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  sheet.getCell(1, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7F1D1D' } };
  sheet.getCell(1, 1).alignment = { horizontal: 'center' };

  sheet.mergeCells(2, 1, 2, lastColumn);
  sheet.getCell(2, 1).value = `Generated: ${new Date().toLocaleString()}${month ? ` | Month: ${month}` : ''}`;
  sheet.getCell(2, 1).font = { italic: true, color: { argb: 'FF475569' } };

  sheet.addRow([]);
  const header = sheet.addRow(columns.map((column) => column.label));
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FF111827' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };
    cell.alignment = { horizontal: 'center' };
  });

  rows.forEach((row) => {
    sheet.addRow(columns.map((column) => row[column.name] ?? ''));
  });

  sheet.columns.forEach((column) => {
    let width = 14;
    column.eachCell({ includeEmpty: true }, (cell) => {
      width = Math.max(width, String(cell.value ?? '').length + 2);
    });
    column.width = Math.min(width, 34);
  });

  sheet.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: 4, column: lastColumn }
  };

  await saveWorkbook(workbook, `${title.replaceAll(/[^\w]+/g, '_')}_${month || 'all'}.xlsx`);
}

export async function downloadSsReport({ rows, month, executiveName = '', area = '' }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Support System';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('SSS Report');
  const brandWidth = ssReportBrands.reduce((sum) => sum + sizeKeys.length + 2, 0);
  const lastColumn = 3 + brandWidth + ssMarketShareCodes.length;

  sheet.mergeCells(1, 1, 1, lastColumn);
  sheet.getCell(1, 1).value = 'SSS Report';
  sheet.getCell(1, 1).font = { bold: true, size: 16 };
  sheet.getCell(1, 1).alignment = { horizontal: 'center' };
  sheet.getCell(2, 1).value = 'EXE NAME';
  sheet.getCell(2, 2).value = executiveName;
  sheet.getCell(3, 1).value = 'Area';
  sheet.getCell(3, 2).value = area;
  sheet.getCell(4, 1).value = 'MONTH OF';
  sheet.getCell(4, 2).value = month;

  sheet.getRow(6).values = ['SL', 'RETAIL NAME'];
  sheet.getRow(7).values = ['', ''];
  sheet.getRow(8).values = ['', ''];
  let column = 3;
  ssReportBrands.forEach((brand) => {
    const start = column;
    const end = column + sizeKeys.length + 1;
    sheet.mergeCells(6, start, 6, end);
    sheet.getCell(6, start).value = brand.name;
    sizeKeys.forEach((size, index) => {
      sheet.getCell(7, start + index).value = brand.exportCode || brand.code;
      sheet.getCell(8, start + index).value = size.replace('ml', '');
    });
    sheet.getCell(7, start + sizeKeys.length).value = 'TTL BTLS';
    sheet.getCell(8, start + sizeKeys.length).value = 'TTL BTLS';
    sheet.getCell(7, end).value = 'TTL CS';
    sheet.getCell(8, end).value = 'TTL CS';
    column = end + 1;
  });
  sheet.mergeCells(6, column, 6, column + ssMarketShareCodes.length - 1);
  sheet.getCell(6, column).value = 'RUM MARKET SHARE (%)';
  ssMarketShareCodes.forEach((code, index) => {
    sheet.getCell(7, column + index).value = code;
    sheet.getCell(8, column + index).value = '%';
  });
  [6, 7, 8].forEach((rowNumber) => styleHeader(sheet.getRow(rowNumber)));

  rows.forEach((row, rowIndex) => {
    const output = [rowIndex + 1, row.retail_name];
      const salesData = row.sales_data || {};
    ssReportBrands.forEach((brand) => {
      const values = salesData[brand.code] || {};
      sizeKeys.forEach((size) => output.push(Number(values[size] || 0)));
      output.push(sumBottles(values));
      output.push(sumCases(values));
    });
    const marketShare = row.market_share_data || {};
    ssMarketShareCodes.forEach((code) => output.push(marketShare[code] ?? ''));
    sheet.addRow(output);
  });

  finishWideSheet(sheet, lastColumn);
  await saveWorkbook(workbook, `ss-report-${normalizeFilePart(month)}.xlsx`);
}

export async function downloadAvailabilityReport({ rows, month, executiveName = '', area = '' }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Support System';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('Availability Report');
  const columns = ['S.L', 'RETAIL NAME', 'EXE', 'CAT', 'Depot', 'STATUS', ...availabilityCodes];
  sheet.mergeCells(1, 1, 1, columns.length);
  sheet.getCell(1, 1).value = `Retail wise AVAILABILITY Report for the Month of: ${month || ''}`;
  sheet.getCell(2, 1).value = 'AREA';
  sheet.getCell(2, 2).value = area;
  sheet.getCell(3, 1).value = 'Name of Exe.';
  sheet.getCell(3, 2).value = executiveName;
  const header = sheet.addRow(columns);
  styleHeader(header);
  rows.forEach((row, index) => {
    const data = row.availability_data || {};
    sheet.addRow([
      index + 1,
      row.retail_name,
      row.executive_name || executiveName,
      row.category || '',
      row.depot || '',
      row.status || '',
      ...availabilityCodes.map((code) => data[code] || '')
    ]);
  });
  finishWideSheet(sheet, columns.length, 4);
  await saveWorkbook(workbook, `availability-report-${normalizeFilePart(month)}.xlsx`);
}

export async function downloadSpotPromotionReport({ rows, month }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Support System';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('Spot Promotion');
  const brands = flattenSpotBrands();
  const totalColumns = ['Total Bottles', 'Total Cases'];
  const lastColumn = 2 + brands.reduce((sum) => sum + sizeKeys.length, 0) + totalColumns.length;
  sheet.mergeCells(1, 1, 1, lastColumn);
  sheet.getCell(1, 1).value = `SPOT PROMOTION REPORT ${month || ''}`;
  sheet.getCell(1, 1).font = { bold: true, size: 16 };
  sheet.getCell(1, 1).alignment = { horizontal: 'center' };

  sheet.getCell(3, 1).value = 'DATE';
  sheet.getCell(3, 2).value = 'RETAIL NAME';
  sheet.getCell(4, 1).value = '';
  sheet.getCell(4, 2).value = '';
  sheet.getCell(5, 1).value = '';
  sheet.getCell(5, 2).value = '';
  let column = 3;
  spotPromotionGroups.forEach((group) => {
    const categoryStart = column;
    group.brands.forEach((brand) => {
      const start = column;
      const end = column + sizeKeys.length - 1;
      if (end > start) sheet.mergeCells(4, start, 4, end);
      sheet.getCell(4, start).value = brand.code;
      sizeKeys.forEach((size, index) => {
        sheet.getCell(5, start + index).value = size.replace('ml', '');
      });
      column = end + 1;
    });
    sheet.mergeCells(3, categoryStart, 3, column - 1);
    sheet.getCell(3, categoryStart).value = group.category;
  });
  totalColumns.forEach((label, index) => {
    sheet.mergeCells(3, column + index, 5, column + index);
    sheet.getCell(3, column + index).value = label;
  });
  [3, 4, 5].forEach((rowNumber) => styleHeader(sheet.getRow(rowNumber)));

  rows.forEach((row) => {
    const data = row.promotion_data || {};
    const output = [row.date || '', row.retail_name];
    const rowGrid = {};
    brands.forEach((brand) => {
      const values = data?.[brand.category]?.[brand.code] || data?.[brand.code] || {};
      rowGrid[brand.code] = values;
      sizeKeys.forEach((size) => output.push(Number(values[size] || 0)));
    });
    output.push(row.total_bottles || Object.values(rowGrid).reduce((total, values) => total + sumBottles(values), 0));
    output.push(row.total_cases || Object.values(rowGrid).reduce((total, values) => total + sumCases(values), 0));
    sheet.addRow(output);
  });

  finishWideSheet(sheet, lastColumn, 5);
  await saveWorkbook(workbook, `spot-promotion-${normalizeFilePart(month)}.xlsx`);
}

export async function downloadSizeColumnReport({ title, rows, month, filenamePrefix, stock = false, mrp = false }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Support System';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(title.slice(0, 31));
  const columns = mrp
    ? [
        { header: 'Brand Name', key: 'brand_name' },
        { header: 'Category', key: 'category' },
        ...bottleSizes.map((size) => ({ header: `${size.label} MRP`, key: size.mrpDb })),
        { header: 'Effective Month', key: 'effective_month' },
        { header: 'Status', key: 'status' }
      ]
    : [
        { header: stock ? 'Month' : 'Date', key: stock ? 'month' : 'date' },
        { header: 'Retail Name', key: 'retail_name' },
        { header: 'Brand Name', key: 'brand_name' },
        ...bottleSizes.map((size) => ({ header: stock ? `${size.label} Stock` : size.label, key: stock ? size.stockDb : size.db })),
        { header: stock ? 'Total Stock Bottles' : 'Total Bottles', key: stock ? 'total_stock_bottles' : 'total_bottles' },
        { header: stock ? 'Total Stock Cases' : 'Total Cases', key: stock ? 'total_stock_cases' : 'total_cases' }
      ];
  sheet.columns = columns;
  styleHeader(sheet.getRow(1));
  rows.forEach((row) => sheet.addRow(row));
  finishWideSheet(sheet, columns.length, 1);
  await saveWorkbook(workbook, `${filenamePrefix}-${normalizeFilePart(month)}.xlsx`);
}

function finishWideSheet(sheet, lastColumn, filterRow = 8) {
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = thinBorder();
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
  });
  sheet.columns.forEach((col, index) => {
    col.width = index === 1 ? 28 : 12;
  });
  sheet.views = [{ state: 'frozen', xSplit: 2, ySplit: filterRow }];
  sheet.autoFilter = {
    from: { row: filterRow, column: 1 },
    to: { row: filterRow, column: lastColumn }
  };
}
