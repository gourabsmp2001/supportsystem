import { Search } from 'lucide-react';

export default function SearchFilter({ value, onChange }) {
  return (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search records"
        className="pl-9"
      />
    </div>
  );
}
