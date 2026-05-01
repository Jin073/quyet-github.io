import { useState } from 'react';
import { Download, Link, RotateCcw, Upload } from 'lucide-react';

const EXCEL_ACCEPT = '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel';

export function DataActions({
  onExport,
  onImport,
  onImportUrl,
  onReset,
  compact = false,
}) {
  const [importUrl, setImportUrl] = useState('');

  return (
    <div className={compact ? 'data-actions compact' : 'data-actions'}>
      <div className="data-action-buttons">
        <div className="data-action-primary">
          <button className="btn btn-ghost btn-sm" onClick={onExport}>
            <Download size={14} />
            Export
          </button>
          <label className="btn btn-ghost btn-sm">
            <Upload size={14} />
            Import
            <input hidden type="file" accept={EXCEL_ACCEPT} onChange={(event) => onImport(event.target.files[0])} />
          </label>
        <button className="btn btn-danger btn-sm data-reset-button" onClick={onReset}>
          <RotateCcw size={14} />
          Reset
        </button>
        </div>


      </div>

      <form
        className="import-link-form"
        onSubmit={(event) => {
          event.preventDefault();
          onImportUrl(importUrl);
        }}
      >
        <input
          className="field import-link-input"
          type="url"
          placeholder="Import Excel or Google Sheet link"
          value={importUrl}
          onChange={(event) => setImportUrl(event.target.value)}
        />
        <button className="btn btn-ghost btn-sm" type="submit">
          <Link size={14} />
          Import Link
        </button>
      </form>
    </div>
  );
}
