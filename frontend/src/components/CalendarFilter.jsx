export default function CalendarFilter({ value, onChange, disabled, type = 'month' }) {
  return (
    <input
      type={type}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="w-full sm:w-48 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
      aria-label="Date filter"
    />
  );
}
