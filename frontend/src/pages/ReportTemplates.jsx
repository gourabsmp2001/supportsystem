import { CheckCircle2, Download, LayoutTemplate, Loader2, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import SearchableSelect from '../components/SearchableSelect';
import { toast } from '../components/Toast';
import { useEntityOptions } from '../hooks/useEntityOptions';
import { calculateRecord } from '../lib/calculations';
import { downloadExcel } from '../lib/exportExcel';
import { currentMonth } from '../lib/format';
import { supabase } from '../lib/supabaseClient';

const bottleSizes = ['750ml', '500ml', '375ml', '180ml', '90ml'];

const reportTemplates = {
  sss_sales_entries: {
    title: 'SSS/Sales Template',
    table: 'sss_sales_entries',
    duplicateFields: ['month', 'retail_name', 'brand_name'],
    defaultRow: { bottle_size: '750ml', quantity_sold: 0 },
    columns: [
      { name: 'month', label: 'Month', type: 'month', readOnly: true },
      { name: 'retail_name', label: 'Retail Name', readOnly: true },
      { name: 'brand_name', label: 'Brand Name', readOnly: true },
      { name: 'bottle_size', label: 'Bottle Size', type: 'select', options: bottleSizes },
      { name: 'quantity_sold', label: 'Quantity Sold', type: 'number' }
    ]
  },
  availability_entries: {
    title: 'Availability Template',
    table: 'availability_entries',
    duplicateFields: ['month', 'retail_name', 'brand_name'],
    defaultRow: { availability_status: 'Not Asked', remarks: '' },
    columns: [
      { name: 'month', label: 'Month', type: 'month', readOnly: true },
      { name: 'retail_name', label: 'Retail Name', readOnly: true },
      { name: 'brand_name', label: 'Brand Name', readOnly: true },
      { name: 'availability_status', label: 'Availability Status', type: 'select', options: ['Available', 'Not Available', 'Low Stock', 'Not Asked'] },
      { name: 'remarks', label: 'Remarks', type: 'text' }
    ]
  },
  opening_stock_entries: {
    title: 'Opening Stock Template',
    table: 'opening_stock_entries',
    duplicateFields: ['month', 'retail_name', 'brand_name'],
    defaultRow: { bottle_size: '750ml', opening_stock_quantity: 0 },
    columns: [
      { name: 'month', label: 'Month', type: 'month', readOnly: true },
      { name: 'retail_name', label: 'Retail Name', readOnly: true },
      { name: 'brand_name', label: 'Brand Name', readOnly: true },
      { name: 'bottle_size', label: 'Bottle Size', type: 'select', options: bottleSizes },
      { name: 'opening_stock_quantity', label: 'Opening Stock Quantity', type: 'number' }
    ]
  },
  scheme_projections: {
    title: 'Scheme Projection Template',
    table: 'scheme_projections',
    duplicateFields: ['month', 'retail_name', 'brand_name'],
    defaultRow: { scheme_name: '', target_quantity: 0, expected_sale: 0, actual_sale: 0 },
    columns: [
      { name: 'month', label: 'Month', type: 'month', readOnly: true },
      { name: 'retail_name', label: 'Retail Name', readOnly: true },
      { name: 'brand_name', label: 'Brand Name', readOnly: true },
      { name: 'scheme_name', label: 'Scheme Name', type: 'text' },
      { name: 'target_quantity', label: 'Target Quantity', type: 'number' },
      { name: 'expected_sale', label: 'Expected Sale', type: 'number' },
      { name: 'actual_sale', label: 'Actual Sale', type: 'number' }
    ]
  }
};

const excelTemplates = [
  {
    title: 'Retail List Import Template',
    columns: ['retail_name', 'license_code', 'shop_type', 'area', 'contact_person', 'phone', 'status'],
    sample: { retail_name: 'ABC Wine Shop', license_code: 'LIC-001', shop_type: 'Wine Shop', area: 'North Area', contact_person: 'Manager Name', phone: '9999999999', status: 'Active' }
  },
  {
    title: 'Brand List Import Template',
    columns: ['brand_name', 'category', 'status'],
    sample: { brand_name: 'Sample Whisky', category: 'Whisky', status: 'Active' }
  },
  {
    title: 'Brand MRP Import Template',
    columns: ['brand_name', 'category', 'bottle_size', 'mrp', 'effective_month', 'status'],
    sample: { brand_name: 'Sample Whisky', category: 'Whisky', bottle_size: '750ml', mrp: 750, effective_month: currentMonth(), status: 'Active' }
  },
  {
    title: 'SSS/Sales Entry Template',
    columns: ['month', 'retail_name', 'brand_name', 'bottle_size', 'quantity_sold'],
    sample: { month: currentMonth(), retail_name: 'ABC Wine Shop', brand_name: 'Sample Whisky', bottle_size: '750ml', quantity_sold: 12 }
  },
  {
    title: 'Availability Entry Template',
    columns: ['month', 'retail_name', 'brand_name', 'availability_status', 'remarks'],
    sample: { month: currentMonth(), retail_name: 'ABC Wine Shop', brand_name: 'Sample Whisky', availability_status: 'Not Asked', remarks: '' }
  },
  {
    title: 'Opening Stock Template',
    columns: ['month', 'retail_name', 'brand_name', 'bottle_size', 'opening_stock_quantity'],
    sample: { month: currentMonth(), retail_name: 'ABC Wine Shop', brand_name: 'Sample Whisky', bottle_size: '750ml', opening_stock_quantity: 24 }
  },
  {
    title: 'Scheme Projection Template',
    columns: ['month', 'retail_name', 'brand_name', 'scheme_name', 'target_quantity', 'expected_sale', 'actual_sale'],
    sample: { month: currentMonth(), retail_name: 'ABC Wine Shop', brand_name: 'Sample Whisky', scheme_name: 'Monthly Scheme', target_quantity: 50, expected_sale: 45, actual_sale: 0 }
  },
  {
    title: 'Spot Promotion Template',
    columns: ['promoter_name', 'month', 'date', 'retail_name', 'brand_name', 'bottle_size', 'quantity_sold', 'daily_rate'],
    sample: { promoter_name: 'Promoter Name', month: currentMonth(), date: new Date().toISOString().slice(0, 10), retail_name: 'ABC Wine Shop', brand_name: 'Sample Whisky', bottle_size: '750ml', quantity_sold: 12, daily_rate: 500 }
  },
  {
    title: 'Retail Visit Template',
    columns: ['visit_date', 'retail_name', 'brand_name', 'executive_name', 'area', 'visit_purpose', 'notes', 'next_follow_up_date', 'status'],
    sample: { visit_date: new Date().toISOString().slice(0, 10), retail_name: 'ABC Wine Shop', brand_name: 'Sample Whisky', executive_name: 'Executive Name', area: 'North Area', visit_purpose: 'Regular Visit', notes: '', next_follow_up_date: '', status: 'Pending' }
  },
  {
    title: 'PJP Template',
    columns: ['date', 'month', 'executive_name', 'area', 'planned_retail_name', 'brand_name', 'visit_status', 'remarks'],
    sample: { date: new Date().toISOString().slice(0, 10), month: currentMonth(), executive_name: 'Executive Name', area: 'North Area', planned_retail_name: 'ABC Wine Shop', brand_name: 'Sample Whisky', visit_status: 'Planned', remarks: '' }
  }
];

function rowKey(row, fields) {
  return fields.map((field) => String(row[field] || '').trim().toLowerCase()).join('|');
}

async function insertInChunks(table, rows) {
  const size = 500;
  for (let index = 0; index < rows.length; index += size) {
    const { error } = await supabase.from(table).insert(rows.slice(index, index + size));
    if (error) throw error;
  }
}

export default function ReportTemplates() {
  const { retailers, brands, loading } = useEntityOptions();
  const [templateKey, setTemplateKey] = useState('sss_sales_entries');
  const [month, setMonth] = useState(currentMonth());
  const [selectedRetailer, setSelectedRetailer] = useState('All Shops');
  const [selectedBrand, setSelectedBrand] = useState('All Brands');
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);

  const template = reportTemplates[templateKey];
  const retailOptions = useMemo(() => ['All Shops', ...retailers], [retailers]);
  const brandOptions = useMemo(() => ['All Brands', ...brands], [brands]);

  function generateRows() {
    if (!retailers.length) {
      toast.error('Retail List is empty. Import shop names first.');
      return;
    }
    if (!brands.length) {
      toast.error('Brand List is empty. Import brand names first.');
      return;
    }

    const selectedRetailers = selectedRetailer === 'All Shops' ? retailers : [selectedRetailer];
    const selectedBrands = selectedBrand === 'All Brands' ? brands : [selectedBrand];
    const generated = [];

    selectedRetailers.forEach((retail_name) => {
      selectedBrands.forEach((brand_name) => {
        generated.push({
          client_row_id: crypto.randomUUID(),
          month,
          retail_name,
          brand_name,
          ...template.defaultRow
        });
      });
    });

    setRows(generated);
    toast.success(`${generated.length} rows generated.`);
  }

  function updateRow(rowId, name, value) {
    setRows((current) =>
      current.map((row) =>
        row.client_row_id === rowId
          ? calculateRecord(templateKey, { ...row, [name]: value })
          : row
      )
    );
  }

  async function saveAll() {
    if (!rows.length || saving) return;
    setSaving(true);

    try {
      const { data, error } = await supabase
        .from(template.table)
        .select(template.duplicateFields.join(','))
        .eq('month', month)
        .limit(5000);
      if (error) throw error;

      const existing = new Set((data || []).map((row) => rowKey(row, template.duplicateFields)));
      const seen = new Set();
      const insertable = [];
      let skipped = 0;

      rows.forEach((row) => {
        const prepared = prepareForInsert(templateKey, row);
        const key = rowKey(prepared, template.duplicateFields);
        if (existing.has(key) || seen.has(key)) {
          skipped += 1;
          return;
        }
        seen.add(key);
        insertable.push(prepared);
      });

      if (insertable.length) {
        await insertInChunks(template.table, insertable);
      }

      toast.success(`${insertable.length} inserted, ${skipped} skipped as duplicates.`);
      setRows([]);
    } catch (error) {
      toast.error(`Save failed: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  function downloadBlankTemplate(item) {
    downloadExcel({
      title: item.title,
      columns: item.columns.map((name) => ({ name, label: name })),
      rows: [item.sample]
    });
    toast.success(`${item.title} downloaded.`);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg bg-[linear-gradient(135deg,#111827,#7f1d1d_58%,#f59e0b)] p-6 text-white shadow-soft">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-white/15 p-3">
            <LayoutTemplate size={24} />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-100">Support System</p>
            <h1 className="mt-1 text-3xl font-black">Report Templates</h1>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm text-slate-100">
          Generate shop-wise and brand-wise rows from master data, fill only the values, and save everything together.
        </p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label>Report</label>
            <select value={templateKey} onChange={(event) => { setTemplateKey(event.target.value); setRows([]); }}>
              {Object.entries(reportTemplates).map(([key, value]) => (
                <option key={key} value={key}>{value.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Month</label>
            <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </div>
          <div>
            <label>Shop</label>
            <SearchableSelect
              value={selectedRetailer}
              options={retailOptions}
              onChange={setSelectedRetailer}
              disabled={loading || !retailers.length}
              emptyMessage="Retail List is empty. Import shop names first."
            />
            {!loading && !retailers.length ? <p className="mt-1 text-xs font-semibold text-red-700">Retail List is empty. Import shop names first.</p> : null}
          </div>
          <div>
            <label>Brand</label>
            <SearchableSelect
              value={selectedBrand}
              options={brandOptions}
              onChange={setSelectedBrand}
              disabled={loading || !brands.length}
              emptyMessage="Brand List is empty. Import brand names first."
            />
            {!loading && !brands.length ? <p className="mt-1 text-xs font-semibold text-red-700">Brand List is empty. Import brand names first.</p> : null}
          </div>
          <div className="flex items-end">
            <button onClick={generateRows} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800">
              <Plus size={18} />
              Generate Rows
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-ink">{template.title}</h2>
            <p className="text-sm text-slate-500">{rows.length ? `${rows.length} generated rows ready for entry.` : 'Generate rows to start shop-wise quick entry.'}</p>
          </div>
          <button
            onClick={saveAll}
            disabled={!rows.length || saving}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-saffron px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            Save All
          </button>
        </div>

        <div className="table-scroll mt-5 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-ink text-white">
              <tr>
                {template.columns.map((column) => (
                  <th key={column.name} className="whitespace-nowrap px-3 py-2 text-left text-xs font-bold uppercase tracking-wide">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.length ? rows.map((row) => (
                <tr key={row.client_row_id}>
                  {template.columns.map((column) => (
                    <td key={column.name} className="min-w-36 px-3 py-2">
                      {column.readOnly ? (
                        <span className="font-semibold text-slate-700">{row[column.name]}</span>
                      ) : column.type === 'select' ? (
                        <select value={row[column.name] || ''} onChange={(event) => updateRow(row.client_row_id, column.name, event.target.value)}>
                          {column.options.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      ) : (
                        <input
                          type={column.type || 'text'}
                          value={row[column.name] ?? ''}
                          onChange={(event) => updateRow(row.client_row_id, column.name, column.type === 'number' ? Number(event.target.value) : event.target.value)}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              )) : (
                <tr>
                  <td colSpan={template.columns.length} className="px-4 py-10 text-center text-slate-500">
                    No template rows generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-black text-ink">Download blank Excel templates</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {excelTemplates.map((item) => (
            <button
              key={item.title}
              onClick={() => downloadBlankTemplate(item)}
              className="inline-flex items-center justify-between gap-3 rounded-md border border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              {item.title}
              <Download size={17} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function prepareForInsert(templateKey, row) {
  const { client_row_id, ...raw } = row;
  const payload = { ...raw };

  if (templateKey === 'opening_stock_entries') {
    payload.date = `${payload.month}-01`;
  }

  return calculateRecord(templateKey, payload);
}
