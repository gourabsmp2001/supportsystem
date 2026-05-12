export const currentMonth = () => new Date().toISOString().slice(0, 7);

export function formatValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'number') return Number.isInteger(value) ? value : value.toFixed(2);
  return value;
}
