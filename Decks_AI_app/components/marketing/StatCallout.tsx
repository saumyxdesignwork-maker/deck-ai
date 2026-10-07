export function StatCallout({ value, label }: { value: string; label: string }) {
  return (
    <div className="m-stat">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  )
}
