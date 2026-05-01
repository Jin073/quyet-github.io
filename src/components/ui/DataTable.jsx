import { Edit2, Trash2 } from 'lucide-react';

export function DataTable({ columns, rows, empty, getKey, onEdit, onDelete }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={{ textAlign: column.align || 'left', width: column.width }}>
                {column.label}
              </th>
            ))}
            {(onEdit || onDelete) && <th style={{ textAlign: 'right', width: 90 }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}>
                <div className="empty-state">{empty}</div>
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getKey(row)}>
                {columns.map((column) => (
                  <td key={column.key} style={{ textAlign: column.align || 'left' }}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td>
                    <div className="row-actions">
                      {onEdit && (
                        <button className="icon-btn" onClick={() => onEdit(row)} title="Edit">
                          <Edit2 size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button className="icon-btn" onClick={() => onDelete(row)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
