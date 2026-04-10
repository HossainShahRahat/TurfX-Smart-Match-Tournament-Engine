export default function DataTable({ columns, rows, emptyMessage }) {
  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 p-8 text-sm text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-medium">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row, rowIndex) => (
              <tr key={row.id || rowIndex} className="text-slate-200">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3">
                    {row[column.key] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
