import { CheckCircle2, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from '../components/Toast';
import { invalidateEntityCache } from '../hooks/useEntityOptions';
import {
  importSummary,
  prepareBrandRows,
  prepareMrpRows,
  prepareOpeningStockRows,
  prepareRetailRows,
  prepareSpotPromotionRows,
  prepareSssRows,
  readWorkbookRows,
  readyRecords
} from '../lib/importData';
import { supabase } from '../lib/supabaseClient';

const importConfigs = {
  retailers: {
    title: 'Import Retail List',
    table: 'retailers',
    existingQuery: () => supabase.from('retailers').select('retail_name'),
    prepare: (rows, existing) => prepareRetailRows(rows, existing.map((row) => row.retail_name)),
    columns: [
      ['retail_name', 'Retail Name'],
      ['license_code', 'License Code'],
      ['shop_type', 'Shop Type'],
      ['area', 'Area'],
      ['contact_person', 'Contact Person'],
      ['phone', 'Phone'],
      ['status', 'Status']
    ]
  },
  brands: {
    title: 'Import Brand List',
    table: 'brands',
    existingQuery: () => supabase.from('brands').select('brand_name'),
    prepare: (rows, existing) => prepareBrandRows(rows, existing.map((row) => row.brand_name)),
    columns: [
      ['brand_name', 'Brand Name'],
      ['report_code', 'Report Code'],
      ['category', 'Category'],
      ['status', 'Status']
    ]
  },
  brand_mrp: {
    title: 'Import Brand MRP',
    table: 'brand_mrp',
    existingQuery: () => supabase.from('brand_mrp').select('brand_name,bottle_size,effective_month'),
    prepare: prepareMrpRows,
    columns: [
      ['brand_name', 'Brand Name'],
      ['category', 'Category'],
      ['mrp_750ml', '750 ml MRP'],
      ['mrp_500ml', '500 ml MRP'],
      ['mrp_375ml', '375 ml MRP'],
      ['mrp_180ml', '180 ml MRP'],
      ['mrp_90ml', '90 ml MRP'],
      ['effective_month', 'Effective Month'],
      ['status', 'Status']
    ]
  },
  sss_sales_entries: {
    title: 'Import SSS/Sales Entries',
    table: 'sss_sales_entries',
    existingQuery: () => supabase.from('sss_sales_entries').select('month,retail_name,brand_name'),
    prepare: prepareSssRows,
    columns: [
      ['month', 'Month'],
      ['retail_name', 'Retail Name'],
      ['brand_name', 'Brand Name'],
      ['qty_750ml', '750 ml'],
      ['qty_500ml', '500 ml'],
      ['qty_375ml', '375 ml'],
      ['qty_180ml', '180 ml'],
      ['qty_90ml', '90 ml'],
      ['rum_market_share', 'Rum Market Share'],
      ['remarks', 'Remarks']
    ]
  },
  spot_promotion_entries: {
    title: 'Import Spot Promotion Sales',
    table: 'spot_promotion_entries',
    existingQuery: () => supabase.from('spot_promotion_entries').select('month,date,retail_name,brand_name'),
    prepare: prepareSpotPromotionRows,
    columns: [
      ['month', 'Month'],
      ['date', 'Date'],
      ['retail_name', 'Retail Name'],
      ['brand_name', 'Brand Name'],
      ['qty_750ml', '750 ml'],
      ['qty_500ml', '500 ml'],
      ['qty_375ml', '375 ml'],
      ['qty_180ml', '180 ml'],
      ['qty_90ml', '90 ml'],
      ['remarks', 'Remarks']
    ]
  },
  opening_stock_entries: {
    title: 'Import Opening Stock',
    table: 'opening_stock_entries',
    existingQuery: () => supabase.from('opening_stock_entries').select('month,retail_name,brand_name'),
    prepare: prepareOpeningStockRows,
    columns: [
      ['month', 'Month'],
      ['retail_name', 'Retail Name'],
      ['brand_name', 'Brand Name'],
      ['stock_750ml', '750 ml Stock'],
      ['stock_500ml', '500 ml Stock'],
      ['stock_375ml', '375 ml Stock'],
      ['stock_180ml', '180 ml Stock'],
      ['stock_90ml', '90 ml Stock'],
      ['remarks', 'Remarks']
    ]
  }
};

async function insertInChunks(table, records) {
  const size = 500;
  for (let index = 0; index < records.length; index += size) {
    const chunk = records.slice(index, index + size);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) throw error;
  }
}

function ImportSection({ type, config }) {
  const [fileName, setFileName] = useState('');
  const [preparedRows, setPreparedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const summary = importSummary(preparedRows);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setFileName(file.name);
    setPreparedRows([]);

    try {
      const rawRows = await readWorkbookRows(file);
      const { data, error } = await config.existingQuery();
      if (error) throw error;
      const nextRows = config.prepare(rawRows, data || []);
      setPreparedRows(nextRows);
      toast.success(`${nextRows.length} rows parsed from ${file.name}.`);
    } catch (error) {
      toast.error(`Import preview failed: ${error.message}`);
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  }

  async function confirmImport() {
    const records = readyRecords(preparedRows);
    if (!records.length) {
      toast.info('No new rows are ready to import.');
      return;
    }

    setImporting(true);
    try {
      await insertInChunks(config.table, records);
      if (type === 'retailers' || type === 'brands') invalidateEntityCache();
      toast.success(`${records.length} ${records.length === 1 ? 'row' : 'rows'} imported successfully.`);
      setPreparedRows([]);
      setFileName('');
    } catch (error) {
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-black text-ink">{config.title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Upload `.xlsx`, `.xls`, or `.csv`. Files are parsed in this browser only; the original file is not stored.
          </p>
          {fileName ? <p className="mt-2 text-sm font-semibold text-red-700">{fileName}</p> : null}
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          Choose File
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} disabled={loading || importing} />
        </label>
      </div>

      {preparedRows.length ? (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <CountCard label="Total rows" value={summary.total} />
            <CountCard label="Will insert" value={summary.ready} tone="green" />
            <CountCard label="Duplicates skipped" value={summary.duplicates} tone="amber" />
            <CountCard label="Invalid skipped" value={summary.invalid} tone="red" />
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
            <div className="table-scroll max-h-80 overflow-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="sticky top-0 bg-ink text-white">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-bold uppercase">Row</th>
                    <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-bold uppercase">Status</th>
                    {config.columns.map(([, label]) => (
                      <th key={label} className="whitespace-nowrap px-3 py-2 text-left text-xs font-bold uppercase">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {preparedRows.slice(0, 100).map((row) => (
                    <tr key={row.index} className={row.status === 'Ready' ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-3 py-2 text-slate-500">{row.index}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={row.status} />
                      </td>
                      {config.columns.map(([key]) => (
                        <td key={key} className="max-w-[220px] whitespace-nowrap px-3 py-2 text-slate-700">
                          <span className="block truncate">{row.record[key] || '-'}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">Preview shows the first 100 rows.</p>
            <button
              onClick={confirmImport}
              disabled={!summary.ready || importing}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-saffron px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              Confirm Import
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}

function CountCard({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    red: 'border-red-200 bg-red-50 text-red-700'
  };

  return (
    <div className={`rounded-lg border p-3 ${tones[tone]}`}>
      <p className="text-xs font-bold uppercase tracking-wide opacity-75">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const classes = {
    Ready: 'bg-emerald-100 text-emerald-700',
    Duplicate: 'bg-amber-100 text-amber-700',
    Invalid: 'bg-red-100 text-red-700'
  };

  return <span className={`rounded px-2 py-1 text-xs font-bold ${classes[status] || classes.Invalid}`}>{status}</span>;
}

export default function ImportData() {
  return (
    <div className="space-y-5">
      <section className="rounded-lg bg-[linear-gradient(135deg,#111827,#7f1d1d_58%,#f59e0b)] p-6 text-white shadow-soft">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-white/15 p-3">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-100">Support System</p>
            <h1 className="mt-1 text-3xl font-black">Import Data</h1>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm text-slate-100">
          Import retailer, brand, and MRP master data from Excel or CSV files. Review the preview first, then confirm only the clean new rows.
        </p>
      </section>

      {Object.entries(importConfigs).map(([type, config]) => (
        <ImportSection key={type} type={type} config={config} />
      ))}
    </div>
  );
}
