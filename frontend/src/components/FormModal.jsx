import { Loader2, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useEntityOptions } from '../hooks/useEntityOptions';
import { calculateRecord } from '../lib/calculations';
import PhotoUploader from './PhotoUploader';
import SearchableSelect from './SearchableSelect';

function initialValues(fields) {
  return fields.reduce((acc, field) => {
    acc[field.name] = field.type === 'number' ? 0 : '';
    return acc;
  }, {});
}

export default function FormModal({ open, title, moduleKey, fields, record, onClose, onSubmit }) {
  const [values, setValues] = useState(initialValues(fields));
  const [saving, setSaving] = useState(false);
  const { retailers, brands } = useEntityOptions();

  useEffect(() => {
    const seed = record ? { ...initialValues(fields), ...record } : initialValues(fields);
    setValues(calculateRecord(moduleKey, seed));
    setSaving(false);
  }, [fields, moduleKey, record, open]);

  if (!open) return null;

  function getOptions(lookup) {
    if (lookup === 'retailer') return retailers;
    if (lookup === 'brand') return brands;
    return [];
  }

  function setValue(name, value) {
    setValues((current) => calculateRecord(moduleKey, { ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return; // prevent double-submit
    setSaving(true);
    try {
      await onSubmit(calculateRecord(moduleKey, values));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4">
      <form onSubmit={handleSubmit} className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-t-lg bg-white shadow-soft sm:rounded-lg">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-ink">{record ? `Edit ${title}` : `New ${title}`}</h2>
            <p className="text-sm text-slate-500">Enter details and save the record.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => (
            <div key={field.name} className={field.wide ? 'sm:col-span-2 lg:col-span-3' : ''}>
              <label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="ml-1 text-red-500">*</span>}
              </label>
              <div className="mt-1">
                {field.lookup ? (
                  <SearchableSelect
                    id={field.name}
                    value={values[field.name] || ''}
                    options={getOptions(field.lookup)}
                    onChange={(val) => setValue(field.name, val)}
                    placeholder={`Select ${field.label}...`}
                    required={field.required}
                  />
                ) : field.type === 'select' ? (
                  <select id={field.name} required={field.required} value={values[field.name] || ''} onChange={(event) => setValue(field.name, event.target.value)}>
                    <option value="">Select</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea id={field.name} rows={4} value={values[field.name] || ''} onChange={(event) => setValue(field.name, event.target.value)} />
                ) : field.type === 'photo' ? (
                  <PhotoUploader value={values.photo_url} onChange={(patch) => setValues((current) => ({ ...current, ...patch }))} />
                ) : (
                  <input
                    id={field.name}
                    type={field.type}
                    step={field.step}
                    required={field.required}
                    readOnly={field.readOnly}
                    value={values[field.name] ?? ''}
                    onChange={(event) => setValue(field.name, field.type === 'number' ? Number(event.target.value) : event.target.value)}
                    className={field.readOnly ? 'bg-slate-100 font-semibold text-slate-500' : ''}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
