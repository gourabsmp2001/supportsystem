import { Database, Download, HardDriveDownload, Info, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import MonthFilter from '../components/MonthFilter';
import { toast } from '../components/Toast';
import { currentMonth } from '../lib/format';
import { supabase } from '../lib/supabaseClient';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const TABLES = [
  { key: 'retailers', title: 'Retail List', monthField: null },
  { key: 'brands', title: 'Brands', monthField: null },
  { key: 'brand_mrp', title: 'Brand MRP', monthField: 'effective_month' },
  { key: 'sss_sales_entries', title: 'SSS Sales Report', monthField: 'month' },
  { key: 'availability_entries', title: 'Availability Report', monthField: 'month' },
  { key: 'scheme_projections', title: 'Scheme Projection', monthField: 'month' },
  { key: 'opening_stock_entries', title: 'Opening Stock', monthField: 'month' },
  { key: 'secondary_market_share_entries', title: 'Market Share', monthField: 'month' },
  { key: 'spot_promotion_entries', title: 'Spot Promotion', monthField: 'month' },
  { key: 'retail_visit_entries', title: 'Retail Visit', monthField: 'visit_month' },
  { key: 'pjp_entries', title: 'PJP', monthField: 'month' },
];

const HIDDEN_COLS = new Set(['id', 'photo_path']);

function styleHeader(row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7F1D1D' } };
    cell.alignment = { horizontal: 'center' };
  });
}

async function fetchAll(table, monthField, month) {
  let query = supabase.from(table).select('*').order('created_at', { ascending: false });
  if (month && monthField) {
    query = query.eq(monthField, month);
  }
  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`);
  return data || [];
}

async function buildWorkbook(month) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Support System';
  workbook.created = new Date();

  for (const table of TABLES) {
    const rows = await fetchAll(table.key, table.monthField, month);
    const sheet = workbook.addWorksheet(table.title.slice(0, 31));

    if (!rows.length) {
      sheet.addRow(['No data']);
      continue;
    }

    const columns = Object.keys(rows[0]).filter((c) => !HIDDEN_COLS.has(c));
    const headerRow = sheet.addRow(columns);
    styleHeader(headerRow);

    rows.forEach((row) => {
      sheet.addRow(columns.map((col) => row[col] ?? ''));
    });

    sheet.columns.forEach((col) => {
      let maxWidth = 14;
      col.eachCell({ includeEmpty: true }, (cell) => {
        maxWidth = Math.max(maxWidth, String(cell.value ?? '').length + 2);
      });
      col.width = Math.min(maxWidth, 34);
    });
  }

  return workbook;
}

export default function Backup() {
  const [month, setMonth] = useState(currentMonth());
  const [downloading, setDownloading] = useState(null);

  async function download(type) {
    if (downloading) return;
    setDownloading(type);
    try {
      const filterMonth = type === 'month' ? month : null;
      const workbook = await buildWorkbook(filterMonth);
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const now = new Date();
      const suffix = filterMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      saveAs(blob, `support-system-backup-${suffix}.xlsx`);
      toast.success('Backup downloaded successfully!');
    } catch (err) {
      toast.error(err.message || 'Backup download failed.');
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-red-700 p-3 text-white">
            <Database size={22} />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-saffron">Support System</p>
            <h1 className="text-2xl font-black text-ink">Backup & Archive</h1>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-slate-500">
          Download a complete Excel backup of all your data. Each table is saved as a separate sheet in one file.
        </p>
      </section>

      {/* Safety notice */}
      <section className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <Info size={20} className="mt-0.5 flex-shrink-0 text-amber-600" />
        <div className="text-sm text-amber-800">
          <p className="font-bold">Data Safety Reminder</p>
          <p className="mt-1">
            For long-term data safety, download a backup <strong>every month</strong> and upload it to{' '}
            <strong>Telegram Saved Messages</strong> or <strong>Google Drive</strong>.
          </p>
          <p className="mt-1 text-amber-600">
            Retail visit photos are stored in Supabase and are not included in Excel backups.
          </p>
        </div>
      </section>

      {/* Actions */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-bold text-ink">Download Options</h2>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="w-full sm:w-48">
            <label className="mb-1 block">Select Month</label>
            <MonthFilter value={month} onChange={setMonth} />
          </div>
          <button
            onClick={() => download('month')}
            disabled={!!downloading}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-saffron px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {downloading === 'month' ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            Download Month Backup
          </button>
        </div>

        <hr className="my-5 border-slate-200" />

        <button
          onClick={() => download('full')}
          disabled={!!downloading}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-red-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50"
        >
          {downloading === 'full' ? <Loader2 size={18} className="animate-spin" /> : <HardDriveDownload size={18} />}
          Download Full Backup (All Data)
        </button>
        <p className="mt-2 text-xs text-slate-400">Includes all records from every table, regardless of month.</p>
      </section>

      {/* Tables included */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-bold text-ink">Tables Included in Backup</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TABLES.map((t) => (
            <div key={t.key} className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {t.title}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
