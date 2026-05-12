import { CalendarDays, ClipboardCheck, Database, FileSpreadsheet, ImagePlus, LayoutTemplate, PackageCheck, PackagePlus, Percent, Store, Tags, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';
import ExportButton from '../components/ExportButton';
import { toast } from '../components/Toast';
import { downloadExcel } from '../lib/exportExcel';
import { currentMonth } from '../lib/format';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [summary, setSummary] = useState({
    retailers: 0,
    brands: 0,
    monthlySales: 0,
    todaysVisits: 0,
    availability: 0,
    spotPromotionEntries: 0,
    topBrands: [],
    recent: []
  });
  const month = useMemo(() => currentMonth(), []);

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().slice(0, 10);
      const [retailers, brands, sales, visits, availability, promoEntries, promos, recent] = await Promise.all([
        supabase.from('retailers').select('id', { count: 'exact', head: true }),
        supabase.from('brands').select('id', { count: 'exact', head: true }),
        supabase.from('sss_sales_entries').select('id', { count: 'exact', head: true }).eq('month', month),
        supabase.from('retail_visit_entries').select('id', { count: 'exact', head: true }).eq('visit_date', today),
        supabase.from('availability_entries').select('id', { count: 'exact', head: true }).eq('month', month),
        supabase.from('spot_promotion_entries').select('id', { count: 'exact', head: true }).eq('month', month),
        supabase.from('spot_promotion_entries').select('brand_name,quantity_sold').eq('month', month).limit(500),
        supabase.from('sss_sales_entries').select('retail_name,brand_name,quantity_sold,created_at').order('created_at', { ascending: false }).limit(6)
      ]);

      const totals = {};
      (promos.data || []).forEach((row) => {
        totals[row.brand_name] = (totals[row.brand_name] || 0) + Number(row.quantity_sold || 0);
      });

      setSummary({
        retailers: retailers.count || 0,
        brands: brands.count || 0,
        monthlySales: sales.count || 0,
        todaysVisits: visits.count || 0,
        availability: availability.count || 0,
        spotPromotionEntries: promoEntries.count || 0,
        topBrands: Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5),
        recent: recent.data || []
      });
    }

    load();
  }, [month]);

  function exportRecent() {
    downloadExcel({
      title: 'Dashboard Recent Entries',
      month,
      columns: [
        { name: 'retail_name', label: 'Retail Name' },
        { name: 'brand_name', label: 'Brand Name' },
        { name: 'quantity_sold', label: 'Quantity Sold' },
        { name: 'created_at', label: 'Created At' }
      ],
      rows: summary.recent
    });
    toast.success('Excel file downloaded!');
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-[linear-gradient(135deg,#111827,#7f1d1d_58%,#f59e0b)] p-6 text-white shadow-soft">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-100">Support System</p>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">Sales reporting dashboard</h1>
            <p className="mt-2 max-w-2xl text-slate-100">
              Track retail shops, brand sales, availability, schemes, market share, visit photos, and journey plans.
            </p>
          </div>
          <ExportButton onClick={exportRecent} disabled={!summary.recent.length} />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DashboardCard title="Total retailers" value={summary.retailers} icon={Store} tone="dark" />
        <DashboardCard title="Total brands" value={summary.brands} icon={Tags} tone="red" />
        <DashboardCard title="Monthly sales entries" value={summary.monthlySales} icon={FileSpreadsheet} tone="gold" />
        <DashboardCard title="Today's visits" value={summary.todaysVisits} icon={CalendarDays} tone="white" />
        <DashboardCard title="Availability entries" value={summary.availability} icon={PackageCheck} tone="white" />
        <DashboardCard title="Spot promotion entries" value={summary.spotPromotionEntries} icon={Percent} tone="dark" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-ink">Quick buttons</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link to="/sss-report" className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 hover:border-red-300 hover:bg-red-100">
              <FileSpreadsheet size={18} />
              Add Today's Sales
            </Link>
            <Link to="/availability-report" className="flex items-center gap-3 rounded-md border border-slate-200 p-3 text-sm font-bold text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700">
              <ClipboardCheck size={18} />
              Add Availability
            </Link>
            <Link to="/opening-stock" className="flex items-center gap-3 rounded-md border border-slate-200 p-3 text-sm font-bold text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700">
              <PackagePlus size={18} />
              Add Opening Stock
            </Link>
            <Link to="/retail-visits" className="flex items-center gap-3 rounded-md border border-slate-200 p-3 text-sm font-bold text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700">
              <ImagePlus size={18} />
              Add Retail Visit
            </Link>
            <Link to="/report-templates" className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800 hover:border-amber-300 hover:bg-amber-100">
              <LayoutTemplate size={18} />
              Generate Monthly Templates
            </Link>
            <Link to="/import-data" className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 hover:border-red-300 hover:bg-red-100">
              <Upload size={18} />
              Import Retail List
            </Link>
            <Link to="/import-data" className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 hover:border-red-300 hover:bg-red-100">
              <Tags size={18} />
              Import Brand List
            </Link>
            <Link to="/backup" className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800 hover:border-amber-300 hover:bg-amber-100">
              <Database size={18} />
              Backup Data
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-ink">Top selling brands</h2>
          <div className="mt-4 space-y-3">
            {summary.topBrands.length ? (
              summary.topBrands.map(([brand, total]) => (
                <div key={brand} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                  <span className="font-semibold text-slate-700">{brand}</span>
                  <span className="rounded bg-saffron px-2 py-1 text-xs font-bold text-slate-950">{total}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No promotion sales for this month yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-bold text-ink">Recent entries</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {summary.recent.length ? (
            summary.recent.map((entry) => (
              <div key={`${entry.created_at}-${entry.brand_name}`} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{entry.retail_name}</p>
                  <p className="text-sm text-slate-500">{entry.brand_name}</p>
                </div>
                <span className="text-sm font-bold text-red-700">{entry.quantity_sold} qty</span>
              </div>
            ))
          ) : (
            <p className="py-4 text-sm text-slate-500">No sales entries yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
