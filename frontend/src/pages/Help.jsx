import { CircleHelp } from 'lucide-react';

const steps = [
  ['Step 1', 'Add or import retailers from the Retail List or Import Data page.'],
  ['Step 2', 'Add or import brands from the Brand List or Import Data page.'],
  ['Step 3', 'Generate monthly report templates when many shops and brands need entry.'],
  ['Step 4', 'Enter daily sales, availability, stock, scheme, promotion, visit, and PJP reports.'],
  ['Step 5', 'Use the Excel button on each report page to download filtered reports.'],
  ['Step 6', 'Open Backup & Archive and take a monthly backup after reports are checked.'],
  ['Step 7', 'Upload the backup file to Telegram, Google Drive, or another safe place.']
];

export default function Help() {
  return (
    <div className="space-y-5">
      <section className="rounded-lg bg-[linear-gradient(135deg,#111827,#7f1d1d_58%,#f59e0b)] p-6 text-white shadow-soft">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-white/15 p-3">
            <CircleHelp size={24} />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-100">Support System</p>
            <h1 className="mt-1 text-3xl font-black">Help / Usage Guide</h1>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-xl font-black text-ink">Daily workflow</h2>
        <div className="mt-5 grid gap-3">
          {steps.map(([title, body]) => (
            <div key={title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black uppercase tracking-wide text-red-700">{title}</p>
              <p className="mt-1 text-slate-700">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
