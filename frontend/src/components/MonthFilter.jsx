export default function MonthFilter({ value, onChange, disabled }) {
  return (
    <input
      type="month"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="w-full sm:w-44"
      aria-label="Month filter"
    />
  );
}
