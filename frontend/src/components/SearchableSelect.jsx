import { ChevronDown, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function SearchableSelect({ id, value, options, onChange, placeholder = 'Select...', required = false, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = query.trim()
    ? options.filter((opt) => opt.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function select(opt) {
    onChange(opt);
    setOpen(false);
    setQuery('');
  }

  function clear(e) {
    e.stopPropagation();
    onChange('');
    setQuery('');
  }

  function openDropdown() {
    if (disabled) return;
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden native input for HTML5 required validation */}
      {required && (
        <input
          tabIndex={-1}
          autoComplete="off"
          className="absolute left-0 top-0 h-0 w-0 opacity-0"
          value={value || ''}
          onChange={() => {}}
          required
          onInvalid={(e) => e.target.setCustomValidity('Please select a value')}
          onInput={(e) => e.target.setCustomValidity('')}
        />
      )}

      {/* Trigger button */}
      <button
        type="button"
        id={id}
        onClick={openDropdown}
        disabled={disabled}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
      >
        <span className={value ? 'truncate' : 'truncate text-slate-400'}>{value || placeholder}</span>
        <span className="flex flex-shrink-0 items-center gap-1">
          {value && (
            <span onClick={clear} className="rounded-full p-0.5 hover:bg-slate-200" role="button" aria-label="Clear">
              <X size={13} />
            </span>
          )}
          <ChevronDown size={15} className={`text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <Search size={14} className="flex-shrink-0 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search..."
              className="!border-0 !p-0 !ring-0 text-sm !shadow-none !outline-none"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length ? (
              filtered.map((opt) => (
                <li key={opt}>
                  <button
                    type="button"
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-red-50 hover:text-red-700 ${opt === value ? 'bg-red-50 font-semibold text-red-700' : 'text-slate-700'}`}
                    onClick={() => select(opt)}
                  >
                    {opt}
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-3 text-center text-sm text-slate-400">No matches found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
