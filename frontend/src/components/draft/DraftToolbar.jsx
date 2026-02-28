import React from 'react'

export default function DraftToolbar({
  title,
  documentType,
  onTitleChange,
  onDocumentTypeChange,
  onNew,
  onSave,
  onExport,
  onDelete,
  saving,
  deleting,
  canDelete,
  canEditTitle = true
}) {
  return (
    <div className="editor-toolbar">
      <div className="editor-toolbar-fields">
        <input
          className="input"
          value={title}
          readOnly={!canEditTitle}
          onChange={(event) => onTitleChange?.(event.target.value)}
        />
        <select
          className="input doc-type-select"
          value={documentType}
          onChange={(event) => onDocumentTypeChange?.(event.target.value)}
        >
          <option value="Service Agreement">Service Agreement</option>
          <option value="Non Disclosure Agreement">Non Disclosure Agreement</option>
          <option value="Employment Contract">Employment Contract</option>
        </select>
      </div>
      <div className="editor-toolbar-actions">
        <button className="btn ghost" onClick={onNew}>
          New Draft
        </button>
        <button className="btn" onClick={onSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button className="btn ghost" onClick={onExport}>
          Export
        </button>
        <button className="btn danger" onClick={onDelete} disabled={!canDelete || deleting}>
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  )
}
