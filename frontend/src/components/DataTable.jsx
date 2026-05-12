import { Edit2, Trash2 } from 'lucide-react';
import { formatValue } from '../lib/format';

export default function DataTable({ columns, rows, onEdit, onDelete }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
      <div className="table-scroll overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-ink text-white">
            <tr>
              {columns.map((column) => (
                <th key={column.name} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">
                  {column.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  {columns.map((column) => (
                    <td key={column.name} className="max-w-[220px] whitespace-nowrap px-4 py-3 text-slate-700">
                      {column.name === 'photo_url' && row[column.name] ? (
                        <a className="font-semibold text-red-700 underline" href={row[column.name]} target="_blank" rel="noreferrer">
                          View photo
                        </a>
                      ) : (
                        <span className="block truncate">{formatValue(row[column.name])}</span>
                      )}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button className="mr-2 rounded-md p-2 text-slate-500 hover:bg-amber-50 hover:text-saffron" onClick={() => onEdit(row)} aria-label="Edit">
                      <Edit2 size={17} />
                    </button>
                    <button className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-700" onClick={() => onDelete(row)} aria-label="Delete">
                      <Trash2 size={17} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-slate-500">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
