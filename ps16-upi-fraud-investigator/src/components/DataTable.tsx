export default function DataTable({ columns, rows }: { columns: string[]; rows: any[] }) {
  return (
    <div className="overflow-auto">
      <table className="table">
        <thead><tr>{columns.map(c => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-slate-800/50">
              {columns.map(c => <td key={c}>{r[c]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}