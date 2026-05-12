import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, `${title.replaceAll(/[^\w]+/g, '_')}_${month || 'all'}.xlsx`);
}
