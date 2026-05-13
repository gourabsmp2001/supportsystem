import { Edit2, Plus, Save, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import CalendarFilter from '../components/CalendarFilter';
import SearchableSelect from '../components/SearchableSelect';
import { toast } from '../components/Toast';
import { useEntityOptions } from '../hooks/useEntityOptions';
import { downloadAvailabilityReport, downloadSpotPromotionReport, downloadSsReport } from '../lib/exportExcel';
import { currentMonth } from '../lib/format';
import {
  availabilityCodes,
  availabilityStatuses,
  emptySizeValues,
  flattenSpotBrands,
  sizeKeys,
  spotPromotionGroups,
  ssMarketShareCodes,
  ssReportBrands,
  sumBottles,
  sumCases
} from '../lib/reportDefinitions';
import { supabase } from '../lib/supabaseClient';

function inputNumber(value, onChange) {
  return (
    <input
      type="number"
      step="0.01"
      min="0"
      value={value ?? 0}
      onChange={(event) => onChange(Number(event.target.value))}
      className="min-w-20"
    />
  );
}

function totalFromGrid(grid) {
  const totals = Object.values(grid || {}).reduce(
    (acc, values) => {
      acc.bottles += sumBottles(values);
      acc.cases += sumCases(values);
      return acc;
    },
    { bottles: 0, cases: 0 }
  );
  return { bottles: Number(totals.bottles.toFixed(2)), cases: Number(totals.cases.toFixed(2)) };
}

function sizeTotalsFromGrid(grid) {
  const totals = emptySizeValues();
  Object.values(grid || {}).forEach((values) => {
    sizeKeys.forEach((size) => {
      totals[size] = Number((Number(totals[size] || 0) + Number(values?.[size] || 0)).toFixed(2));
    });
  });
  return totals;
}

function normalizeGrid(definitions, data) {
  return Object.fromEntries(
    definitions.map((item) => [item.code, { ...emptySizeValues(), ...(data?.[item.code] || {}) }])
  );
}

export default function WideReportPage({ moduleKey, config, profile, session }) {
  if (moduleKey === 'availability_entries') return <AvailabilityGridPage config={config} profile={profile} session={session} />;
  if (moduleKey === 'spot_promotion_entries') return <SpotPromotionGridPage config={config} profile={profile} session={session} />;
  return <SsGridPage config={config} profile={profile} session={session} />;
}

function PageShell({ config, children, onExport, disabledExport, filterValue, setFilterValue, filterType = 'month' }) {
  const Icon = config.icon;
  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-red-700 p-3 text-white">
                <Icon size={22} />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-saffron">Support System</p>
                <h1 className="text-2xl font-black text-ink">{config.title}</h1>
              </div>
            </div>
            <p className="mt-3 max-w-3xl text-sm text-slate-500">{config.description}</p>
          </div>
          <button
            onClick={onExport}
            disabled={disabledExport}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-saffron px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export Excel
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <CalendarFilter value={filterValue} onChange={setFilterValue} type={filterType} />
      </section>

      {children}
    </div>
  );
}

function SsGridPage({ config, profile, session }) {
  const [month, setMonth] = useState(currentMonth());
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [retailName, setRetailName] = useState('');
  const [executiveName, setExecutiveName] = useState('');
  const [area, setArea] = useState('');
  const [salesData, setSalesData] = useState(() => normalizeGrid(ssReportBrands, {}));
  const [marketShareData, setMarketShareData] = useState({});
  const { retailers, loading } = useEntityOptions();
  const totals = useMemo(() => totalFromGrid(salesData), [salesData]);
  const sizeTotals = useMemo(() => sizeTotalsFromGrid(salesData), [salesData]);

  const loadRows = useCallback(async () => {
    const { data, error } = await supabase.from('sss_sales_entries').select('*').eq('month', month).order('retail_name');
    if (error) {
      toast.error(`Failed to load SSS entries: ${error.message}`);
      setRows([]);
      return;
    }
    setRows(data || []);
  }, [month]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  function resetForm() {
    setEditing(null);
    setRetailName('');
    setExecutiveName('');
    setArea('');
    setSalesData(normalizeGrid(ssReportBrands, {}));
    setMarketShareData({});
  }

  function editRow(row) {
    setEditing(row);
    setRetailName(row.retail_name || '');
    setExecutiveName(row.executive_name || '');
    setArea(row.area || '');
    setSalesData(normalizeGrid(ssReportBrands, row.sales_data || legacySalesData(row)));
    setMarketShareData(row.market_share_data || {});
  }

  async function saveAll(event) {
    event.preventDefault();
    if (!retailName) {
      toast.error('Select a retail shop first.');
      return;
    }
    const payload = {
      month,
      retail_name: retailName,
      executive_name: executiveName,
      area,
      brand_name: 'MULTI BRAND',
      bottle_size: 'MULTI',
      quantity_sold: totals.bottles,
      qty_750ml: sizeTotals['750ml'],
      qty_500ml: sizeTotals['500ml'],
      qty_375ml: sizeTotals['375ml'],
      qty_180ml: sizeTotals['180ml'],
      qty_90ml: sizeTotals['90ml'],
      total_bottles: totals.bottles,
      total_cases: totals.cases,
      category: 'RUM',
      sales_data: salesData,
      market_share_data: marketShareData,
      created_by: editing?.created_by || session?.user?.id
    };
    const existing = !editing ? rows.find((row) => row.retail_name === retailName && row.brand_name === 'MULTI BRAND') : null;
    const request = editing || existing
      ? supabase.from('sss_sales_entries').update(payload).eq('id', editing?.id || existing.id)
      : supabase.from('sss_sales_entries').insert(payload);
    const { error } = await request;
    if (error) {
      toast.error(`Save failed: ${error.message}`);
      return;
    }
    toast.success('SSS report grid saved.');
    resetForm();
    loadRows();
  }

  async function remove(row) {
    if (!window.confirm(`Delete SSS entry for "${row.retail_name}"?`)) return;
    const { error } = await supabase.from('sss_sales_entries').delete().eq('id', row.id);
    if (error) toast.error(`Delete failed: ${error.message}`);
    else {
      toast.success('Entry deleted.');
      loadRows();
    }
  }

  return (
    <PageShell
      config={config}
      filterValue={month}
      setFilterValue={setMonth}
      disabledExport={!rows.length}
      onExport={() => downloadSsReport({
        rows,
        month,
        executiveName: executiveName || rows.find((row) => row.executive_name)?.executive_name || '',
        area: area || rows.find((row) => row.area)?.area || ''
      })}
    >
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <form onSubmit={saveAll} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label>Retail Shop</label>
              <SearchableSelect value={retailName} options={retailers} onChange={setRetailName} disabled={loading || !retailers.length} />
            </div>
            <div>
              <label>EXE NAME</label>
              <input value={executiveName} onChange={(event) => setExecutiveName(event.target.value)} />
            </div>
            <div>
              <label>Area</label>
              <input value={area} onChange={(event) => setArea(event.target.value)} />
            </div>
            <TotalPanel bottles={totals.bottles} cases={totals.cases} />
          </div>
          <SizeGrid definitions={ssReportBrands} data={salesData} onChange={setSalesData} />
          <MarketShareGrid data={marketShareData} onChange={setMarketShareData} />
          <FormActions editing={editing} onReset={resetForm} />
        </form>
      </section>
      <SavedRows rows={rows} onEdit={editRow} onDelete={remove} canDelete={profile?.role === 'admin'} />
    </PageShell>
  );
}

function AvailabilityGridPage({ config, profile, session }) {
  const [month, setMonth] = useState(currentMonth());
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [retailName, setRetailName] = useState('');
  const [executiveName, setExecutiveName] = useState('');
  const [category, setCategory] = useState('');
  const [depot, setDepot] = useState('');
  const [status, setStatus] = useState('Active');
  const [availabilityData, setAvailabilityData] = useState({});
  const { retailers, loading } = useEntityOptions();

  const loadRows = useCallback(async () => {
    const { data, error } = await supabase.from('availability_entries').select('*').eq('month', month).order('retail_name');
    if (error) {
      toast.error(`Failed to load availability: ${error.message}`);
      setRows([]);
    } else setRows(data || []);
  }, [month]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  function resetForm() {
    setEditing(null);
    setRetailName('');
    setExecutiveName('');
    setCategory('');
    setDepot('');
    setStatus('Active');
    setAvailabilityData({});
  }

  function editRow(row) {
    setEditing(row);
    setRetailName(row.retail_name || '');
    setExecutiveName(row.executive_name || '');
    setCategory(row.category || '');
    setDepot(row.depot || '');
    setStatus(row.status || 'Active');
    setAvailabilityData(row.availability_data || { [row.brand_name]: row.availability_status });
  }

  async function saveAll(event) {
    event.preventDefault();
    if (!retailName) {
      toast.error('Select a retail shop first.');
      return;
    }
    const payload = {
      month,
      retail_name: retailName,
      executive_name: executiveName,
      category,
      depot,
      status,
      brand_name: 'MULTI BRAND',
      availability_status: 'GRID',
      availability_data: Object.fromEntries(availabilityCodes.map((code) => [code, availabilityData[code] || 'Not Asked'])),
      created_by: editing?.created_by || session?.user?.id
    };
    const existing = !editing ? rows.find((row) => row.retail_name === retailName && row.brand_name === 'MULTI BRAND') : null;
    const request = editing || existing
      ? supabase.from('availability_entries').update(payload).eq('id', editing?.id || existing.id)
      : supabase.from('availability_entries').insert(payload);
    const { error } = await request;
    if (error) {
      toast.error(`Save failed: ${error.message}`);
      return;
    }
    toast.success('Availability grid saved.');
    resetForm();
    loadRows();
  }

  async function remove(row) {
    if (!window.confirm(`Delete availability entry for "${row.retail_name}"?`)) return;
    const { error } = await supabase.from('availability_entries').delete().eq('id', row.id);
    if (error) toast.error(`Delete failed: ${error.message}`);
    else {
      toast.success('Entry deleted.');
      loadRows();
    }
  }

  return (
    <PageShell
      config={config}
      filterValue={month}
      setFilterValue={setMonth}
      disabledExport={!rows.length}
      onExport={() => downloadAvailabilityReport({
        rows,
        month,
        executiveName: executiveName || rows.find((row) => row.executive_name)?.executive_name || '',
        area: ''
      })}
    >
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <form onSubmit={saveAll} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <label>Retail Shop</label>
              <SearchableSelect value={retailName} options={retailers} onChange={setRetailName} disabled={loading || !retailers.length} />
            </div>
            <div>
              <label>EXE</label>
              <input value={executiveName} onChange={(event) => setExecutiveName(event.target.value)} />
            </div>
            <div>
              <label>CAT</label>
              <input value={category} onChange={(event) => setCategory(event.target.value)} />
            </div>
            <div>
              <label>Depot</label>
              <input value={depot} onChange={(event) => setDepot(event.target.value)} />
            </div>
            <div>
              <label>Status</label>
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
          <div className="table-scroll overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-ink text-white">
                <tr>
                  {availabilityCodes.map((code) => (
                    <th key={code} className="whitespace-nowrap px-3 py-2 text-xs font-bold uppercase">{code}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {availabilityCodes.map((code) => (
                    <td key={code} className="min-w-36 px-2 py-2">
                      <select value={availabilityData[code] || 'Not Asked'} onChange={(event) => setAvailabilityData((current) => ({ ...current, [code]: event.target.value }))}>
                        {availabilityStatuses.map((option) => <option key={option}>{option}</option>)}
                      </select>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <FormActions editing={editing} onReset={resetForm} />
        </form>
      </section>
      <SavedRows rows={rows} onEdit={editRow} onDelete={remove} canDelete={profile?.role === 'admin'} />
    </PageShell>
  );
}

function SpotPromotionGridPage({ config, profile, session }) {
  const [month, setMonth] = useState(currentMonth());
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [retailName, setRetailName] = useState('');
  const [promotionData, setPromotionData] = useState(() => emptySpotData());
  const { retailers, loading } = useEntityOptions();
  const flatData = useMemo(() => Object.assign({}, ...Object.values(promotionData).map((group) => group || {})), [promotionData]);
  const totals = useMemo(() => totalFromGrid(flatData), [flatData]);
  const sizeTotals = useMemo(() => sizeTotalsFromGrid(flatData), [flatData]);

  const loadRows = useCallback(async () => {
    const { data, error } = await supabase.from('spot_promotion_entries').select('*').eq('month', month).order('date');
    if (error) {
      toast.error(`Failed to load spot promotion: ${error.message}`);
      setRows([]);
    } else setRows(data || []);
  }, [month]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  function resetForm() {
    setEditing(null);
    setDate(new Date().toISOString().slice(0, 10));
    setRetailName('');
    setPromotionData(emptySpotData());
  }

  function editRow(row) {
    setEditing(row);
    setDate(row.date || new Date().toISOString().slice(0, 10));
    setRetailName(row.retail_name || '');
    setPromotionData(normalizeSpotData(row.promotion_data || legacySalesData(row)));
  }

  async function saveAll(event) {
    event.preventDefault();
    if (!retailName) {
      toast.error('Select a retail shop first.');
      return;
    }
    const payload = {
      promoter_name: 'Spot Promotion',
      month,
      date,
      retail_name: retailName,
      brand_name: 'MULTI BRAND',
      bottle_size: 'MULTI',
      quantity_sold: totals.bottles,
      qty_750ml: sizeTotals['750ml'],
      qty_500ml: sizeTotals['500ml'],
      qty_375ml: sizeTotals['375ml'],
      qty_180ml: sizeTotals['180ml'],
      qty_90ml: sizeTotals['90ml'],
      total_bottles: totals.bottles,
      total_cases: totals.cases,
      promotion_data: promotionData,
      created_by: editing?.created_by || session?.user?.id
    };
    const existing = !editing ? rows.find((row) => row.retail_name === retailName && row.date === date && row.brand_name === 'MULTI BRAND') : null;
    const request = editing || existing
      ? supabase.from('spot_promotion_entries').update(payload).eq('id', editing?.id || existing.id)
      : supabase.from('spot_promotion_entries').insert(payload);
    const { error } = await request;
    if (error) {
      toast.error(`Save failed: ${error.message}`);
      return;
    }
    toast.success('Spot promotion sale grid saved.');
    resetForm();
    loadRows();
  }

  async function remove(row) {
    if (!window.confirm(`Delete spot promotion entry for "${row.retail_name}"?`)) return;
    const { error } = await supabase.from('spot_promotion_entries').delete().eq('id', row.id);
    if (error) toast.error(`Delete failed: ${error.message}`);
    else {
      toast.success('Entry deleted.');
      loadRows();
    }
  }

  return (
    <PageShell config={config} filterValue={month} setFilterValue={setMonth} disabledExport={!rows.length} onExport={() => downloadSpotPromotionReport({ rows, month })}>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <form onSubmit={saveAll} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label>Date</label>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div>
              <label>Retail Shop</label>
              <SearchableSelect value={retailName} options={retailers} onChange={setRetailName} disabled={loading || !retailers.length} />
            </div>
            <TotalPanel bottles={totals.bottles} cases={totals.cases} />
          </div>
          {spotPromotionGroups.map((group) => (
            <div key={group.category}>
              <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-red-700">{group.category}</h2>
              <SizeGrid
                definitions={group.brands}
                data={promotionData[group.category] || {}}
                onChange={(next) => setPromotionData((current) => ({ ...current, [group.category]: next }))}
              />
            </div>
          ))}
          <FormActions editing={editing} onReset={resetForm} />
        </form>
      </section>
      <SavedRows rows={rows} onEdit={editRow} onDelete={remove} showDate canDelete={profile?.role === 'admin'} />
    </PageShell>
  );
}

function SizeGrid({ definitions, data, onChange }) {
  function update(code, size, value) {
    onChange({
      ...data,
      [code]: {
        ...emptySizeValues(),
        ...(data[code] || {}),
        [size]: value
      }
    });
  }

  return (
    <div className="table-scroll overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-ink text-white">
          <tr>
            <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-bold uppercase">Brand / Variant</th>
            {sizeKeys.map((size) => (
              <th key={size} className="whitespace-nowrap px-3 py-2 text-xs font-bold uppercase">{size.replace('ml', ' ml')}</th>
            ))}
            <th className="whitespace-nowrap px-3 py-2 text-xs font-bold uppercase">Total Bottles</th>
            <th className="whitespace-nowrap px-3 py-2 text-xs font-bold uppercase">Total Cases</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {definitions.map((item) => {
            const values = { ...emptySizeValues(), ...(data[item.code] || {}) };
            return (
              <tr key={item.code}>
                <td className="min-w-56 px-3 py-2">
                  <p className="font-bold text-ink">{item.code}</p>
                  <p className="text-xs text-slate-500">{item.name}</p>
                </td>
                {sizeKeys.map((size) => (
                  <td key={size} className="px-2 py-2">
                    {item.sizes.includes(size) ? inputNumber(values[size], (value) => update(item.code, size, value)) : <span className="text-slate-300">-</span>}
                  </td>
                ))}
                <td className="px-3 py-2 text-center font-bold">{sumBottles(values)}</td>
                <td className="px-3 py-2 text-center font-bold">{sumCases(values)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MarketShareGrid({ data, onChange }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <h2 className="text-sm font-black uppercase tracking-wide text-red-700">Rum Market Share (%)</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ssMarketShareCodes.map((code) => (
          <div key={code}>
            <label>{code}</label>
            <input type="number" step="0.01" value={data[code] ?? ''} onChange={(event) => onChange({ ...data, [code]: event.target.value })} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TotalPanel({ bottles, cases }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Current totals</p>
      <p className="mt-1 text-sm font-black text-ink">{bottles} bottles</p>
      <p className="text-sm font-black text-ink">{cases} cases</p>
    </div>
  );
}

function FormActions({ editing, onReset }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <button type="button" onClick={onReset} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
        {editing ? 'Cancel Edit' : 'Clear'}
      </button>
      <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-md bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800">
        {editing ? <Edit2 size={18} /> : <Save size={18} />}
        {editing ? 'Update Entry' : 'Save All'}
      </button>
    </div>
  );
}

function SavedRows({ rows, onEdit, onDelete, showDate = false, canDelete = true }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-soft">
      <div className="table-scroll overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-ink text-white">
            <tr>
              {showDate ? <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase">Date</th> : null}
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase">Retail Name</th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase">Total Bottles</th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase">Total Cases</th>
              <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-bold uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.length ? rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                {showDate ? <td className="whitespace-nowrap px-4 py-3">{row.date || '-'}</td> : null}
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">{row.retail_name}</td>
                <td className="whitespace-nowrap px-4 py-3">{row.total_bottles || row.quantity_sold || '-'}</td>
                <td className="whitespace-nowrap px-4 py-3">{row.total_cases || '-'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button className="mr-2 rounded-md p-2 text-slate-500 hover:bg-amber-50 hover:text-saffron" onClick={() => onEdit(row)} aria-label="Edit">
                    <Edit2 size={17} />
                  </button>
                  {canDelete ? (
                    <button className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-700" onClick={() => onDelete(row)} aria-label="Delete">
                      <Trash2 size={17} />
                    </button>
                  ) : null}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={showDate ? 5 : 4} className="px-4 py-10 text-center text-slate-500">No entries found for this month.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function legacySalesData(row) {
  if (!row.brand_name || row.brand_name === 'MULTI BRAND') return {};
  return {
    [row.brand_name]: {
      ...emptySizeValues(),
      [row.bottle_size || '750ml']: Number(row.quantity_sold || 0)
    }
  };
}

function emptySpotData() {
  return Object.fromEntries(
    spotPromotionGroups.map((group) => [
      group.category,
      normalizeGrid(group.brands, {})
    ])
  );
}

function normalizeSpotData(data) {
  const next = emptySpotData();
  spotPromotionGroups.forEach((group) => {
    next[group.category] = normalizeGrid(group.brands, data?.[group.category] || data);
  });
  return next;
}
