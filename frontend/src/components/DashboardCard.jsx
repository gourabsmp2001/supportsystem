export default function DashboardCard({ title, value, icon: Icon, tone = 'dark' }) {
  const tones = {
    dark: 'bg-ink text-white',
    red: 'bg-red-700 text-white',
    gold: 'bg-saffron text-slate-950',
    white: 'bg-white text-ink'
  };

  return (
    <div className={`rounded-lg p-4 shadow-soft ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm opacity-75">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
        {Icon ? <Icon className="h-8 w-8 opacity-80" /> : null}
      </div>
    </div>
  );
}
