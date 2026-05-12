import { Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import ExportButton from '../components/ExportButton';
import FormModal from '../components/FormModal';
import MonthFilter from '../components/MonthFilter';
import SearchFilter from '../components/SearchFilter';
import { toast } from '../components/Toast';
import { invalidateEntityCache } from '../hooks/useEntityOptions';
import { calculateRecord } from '../lib/calculations';
import { downloadExcel } from '../lib/exportExcel';
import { currentMonth } from '../lib/format';
import { supabase } from '../lib/supabaseClient';

const hiddenColumns = new Set(['photo_path', 'visit_month']);

export default function ReportPage({ moduleKey, config }) {
  const Icon = config.icon;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState(config.monthField ? currentMonth() : '');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const columns = useMemo(
    () => config.fields.filter((field) => !hiddenColumns.has(field.name) && field.type !== 'photo').map(({ name, label }) => ({ name, label })).concat(
      config.fields.some((field) => field.type === 'photo') ? [{ name: 'photo_url', label: 'Photo' }] : []
    ),
    [config.fields]
  );

  const searchColumns = useMemo(
    () => config.fields
      .filter((field) => ['text', 'select', 'tel', 'textarea'].includes(field.type))
      .map((field) => field.name)
      .filter((name) => !hiddenColumns.has(name)),
    [config.fields]
  );

  const loadRows = useCallback(async () => {
    setLoading(true);
    let query = supabase.from(moduleKey).select('*').order('created_at', { ascending: false }).limit(500);

    if (config.monthField && month) {
      query = query.eq(config.monthField, month);
    }

    if (search.trim() && searchColumns.length) {
      const term = search.trim().replaceAll(',', '\\,');
      query = query.or(searchColumns.map((column) => `${column}.ilike.%${term}%`).join(','));
    }

    const { data, error } = await query;
    if (error) {
      toast.error(`Failed to load data: ${error.message}`);
      setRows([]);
    } else {
      setRows(data || []);
    }
    setLoading(false);
  }, [config.monthField, moduleKey, month, search, searchColumns]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setModalOpen(true);
  }

  async function saveRecord(values) {
    const payload = calculateRecord(moduleKey, values);
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    const request = editing
      ? supabase.from(moduleKey).update(payload).eq('id', editing.id)
      : supabase.from(moduleKey).insert(payload);

    const { error } = await request;
    if (error) {
      toast.error(`Save failed: ${error.message}`);
      return;
    }

    toast.success(editing ? 'Record updated successfully!' : 'Record saved successfully!');
    setModalOpen(false);
    setEditing(null);

    // Invalidate entity cache when retailers or brands are modified
    if (config.isEntityTable) {
      invalidateEntityCache();
    }

    loadRows();
  }

  async function deleteRecord(row) {
    const label = row[config.primaryField] || 'this record';
    if (!window.confirm(`Delete "${label}"? This action cannot be undone.`)) return;

    // Photo cleanup: if this is a retail visit with a stored photo, delete the file first
    if (moduleKey === 'retail_visit_entries' && row.photo_path) {
      const { error: storageError } = await supabase.storage
        .from('retail-visit-photos')
        .remove([row.photo_path]);
      if (storageError) {
        toast.info(`Warning: Could not delete photo file (${storageError.message}). The record will still be deleted.`);
      }
    }

    const { error } = await supabase.from(moduleKey).delete().eq('id', row.id);
    if (error) {
      toast.error(`Delete failed: ${error.message}`);
      return;
    }

    toast.success(`"${label}" deleted.`);

    // Invalidate entity cache when retailers or brands are deleted
    if (config.isEntityTable) {
      invalidateEntityCache();
    }

    loadRows();
  }

  function exportRows() {
    downloadExcel({ title: config.title, columns, rows, month });
    toast.success('Excel file downloaded!');
  }

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
          <div className="flex flex-col gap-2 sm:flex-row">
            <ExportButton onClick={exportRows} disabled={!rows.length} />
            <button onClick={openNew} className="inline-flex items-center justify-center gap-2 rounded-md bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800">
              <Plus size={18} />
              Add Entry
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchFilter value={search} onChange={setSearch} />
          <MonthFilter value={month} onChange={setMonth} disabled={!config.monthField} />
        </div>
      </section>

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-10 text-center font-semibold text-slate-500 shadow-soft">Loading records...</div>
      ) : (
        <DataTable columns={columns} rows={rows} onEdit={openEdit} onDelete={deleteRecord} />
      )}

      <FormModal
        open={modalOpen}
        title={config.title}
        moduleKey={moduleKey}
        fields={config.fields}
        record={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={saveRecord}
      />
    </div>
  );
}
