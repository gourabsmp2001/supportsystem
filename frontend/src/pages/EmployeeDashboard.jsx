import { BarChart3, CalendarDays, ClipboardCheck, FileSpreadsheet, ImagePlus, MapPinned } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { currentMonth } from '../lib/format';
import { supabase } from '../lib/supabaseClient';

const quickLinks = [
  { to: '/sss-report', label: 'Add Sales Entry', icon: FileSpreadsheet },
  { to: '/availability-report', label: 'Add Availability', icon: ClipboardCheck },
  { to: '/spot-promotion-sale', label: 'Add Spot Promotion', icon: BarChart3 },
  { to: '/retail-visits', label: 'Add Retail Visit', icon: ImagePlus },
  { to: '/pjp', label: 'Add PJP', icon: MapPinned }
];

export default function EmployeeDashboard({ profile }) {
  const [counts, setCounts] = useState({
    sales: 0,
    availability: 0,
    spotPromotion: 0,
    visits: 0,
    pjp: 0
  });

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().slice(0, 10);
      const month = currentMonth();
      const [sales, availability, spotPromotion, visits, pjp] = await Promise.all([
        supabase.from('sss_sales_entries').select('id', { count: 'exact', head: true }).eq('month', month),
        supabase.from('availability_entries').select('id', { count: 'exact', head: true }).eq('month', month),
        supabase.from('spot_promotion_entries').select('id', { count: 'exact', head: true }).eq('date', today),
        supabase.from('retail_visit_entries').select('id', { count: 'exact', head: true }).eq('visit_date', today),
        supabase.from('pjp_entries').select('id', { count: 'exact', head: true }).eq('date', today)
      ]);

      setCounts({
        sales: sales.count || 0,
        availability: availability.count || 0,
        spotPromotion: spotPromotion.count || 0,
        visits: visits.count || 0,
        pjp: pjp.count || 0
      });
    }

    load();
  }, []);

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-saffron">Employee Home</p>
        <h1 className="mt-2 text-2xl font-black text-ink">Welcome, {profile?.full_name || 'Employee'}</h1>
        <p className="mt-2 text-sm text-slate-500">Your entries are private to your login. Admin can review all submitted work.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <EntryCard label="Monthly sales" value={counts.sales} icon={FileSpreadsheet} />
        <EntryCard label="Monthly availability" value={counts.availability} icon={ClipboardCheck} />
        <EntryCard label="Today's promotion" value={counts.spotPromotion} icon={BarChart3} />
        <EntryCard label="Today's visits" value={counts.visits} icon={ImagePlus} />
        <EntryCard label="Today's PJP" value={counts.pjp} icon={CalendarDays} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-bold text-ink">Daily entry shortcuts</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex items-center gap-3 rounded-md border border-slate-200 p-3 text-sm font-bold text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700">
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function EntryCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <Icon className="text-red-700" size={18} />
      </div>
      <p className="mt-3 text-3xl font-black text-ink">{value}</p>
    </div>
  );
}
