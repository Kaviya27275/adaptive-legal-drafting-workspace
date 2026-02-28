import React, { useEffect, useState, useContext } from 'react'
import { DraftContext } from '../../context/DraftContext'
import { AIContext } from '../../context/AIContext'
import ComplianceReport from '../compliance/ComplianceReport'
import useValidation from '../../hooks/useValidation'
import DraftToolbar from './DraftToolbar'

export default function DraftEditor() {
  const { activeDraft, activeDraftId, saveDraft, removeDraft, setActiveDraftId } = useContext(DraftContext)
  const { suggest } = useContext(AIContext)
  const { report, loading: validating, error: validationError, runValidation, setReport } = useValidation()

  const [text, setText] = useState('')
  const [title, setTitle] = useState('Untitled Draft')
  const [documentType, setDocumentType] = useState('Service Agreement')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [latestSuggestion, setLatestSuggestion] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    if (activeDraft) {
      setTitle(activeDraft.title || 'Untitled Draft')
      setText(activeDraft.text || '')
      setDocumentType(activeDraft.documentType || 'Service Agreement')
    } else {
      setTitle('Untitled Draft')
      setText('')
      setDocumentType('Service Agreement')
      setReport(null)
    }
  }, [activeDraft, setReport])

  const handleSave = async () => {
    setSaving(true)
    setStatusMessage('')
    const saved = await saveDraft({
      id: activeDraftId || undefined,
      title,
      documentType,
      text,
      created: activeDraft?.created
    })
    const compliance = await runValidation({
      title,
      documentType,
      text
    })
    setSaving(false)
    if (!saved?.id) {
      setStatusMessage('Unable to save draft')
      return
    }
    if (compliance?.isCompliant) {
      setStatusMessage('Draft saved and compliance passed')
    } else {
      const count = compliance?.missingClauses?.length || 0
      setStatusMessage(`Draft saved with ${count} compliance warning${count === 1 ? '' : 's'}`)
    }
  }

  const handleDelete = async () => {
    if (!activeDraftId) return
    setDeleting(true)
    await removeDraft(activeDraftId)
    setDeleting(false)
    setActiveDraftId(null)
    setTitle('Untitled Draft')
    setText('')
    setStatusMessage('Draft deleted')
  }

  const handleCreateNew = () => {
    setActiveDraftId(null)
    setTitle('Untitled Draft')
    setText('')
    setDocumentType('Service Agreement')
    setLatestSuggestion('')
    setReport(null)
    setStatusMessage('Started a new draft')
  }

  const handleSuggest = async (mode = 'edit') => {
    if (!text.trim()) {
      setStatusMessage('Add draft text before requesting AI suggestions')
      return
    }
    setSuggesting(true)
    const res = await suggest(text,mode)
    setLatestSuggestion(res.suggestion || JSON.stringify(res, null, 2))
    setSuggesting(false)
  }

  const handleApplySuggestion = () => {
    if (latestSuggestion) {
      setText(latestSuggestion)
      setStatusMessage('AI suggestion applied to draft body')
    }
  }

  const handleExport = () => {
    const safeTitle = (title || 'untitled-draft').toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${safeTitle}.txt`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setStatusMessage('Draft exported as text file')
  }

  const handleRunCompliance = async () => {
    await runValidation({
      title,
      documentType,
      text
    })
  }

  return (
    <div className="card editor-shell">
      <div className="editor-main">
        <DraftToolbar
          title={title}
          documentType={documentType}
          onTitleChange={setTitle}
          onDocumentTypeChange={setDocumentType}
          onNew={handleCreateNew}
          onSave={handleSave}
          onExport={handleExport}
          onDelete={handleDelete}
          saving={saving}
          deleting={deleting}
          canDelete={Boolean(activeDraftId)}
          canEditTitle={!activeDraftId}
        />
        <textarea
          className="editor-textarea"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Draft your legal text here..."
        />
        <div className="editor-meta">
          <span>{activeDraftId ? `Editing: ${activeDraftId}` : 'Unsaved draft'}</span>
          <span>{text.trim().split(/\s+/).filter(Boolean).length} words</span>
        </div>
        {statusMessage ? <p className="status-note">{statusMessage}</p> : null}
      </div>
      <div className="side-stack">
        <div className="ai-panel card">
          <h4>AI Suggestions</h4>
          <p className="muted-text">Rewrite, summarize, or highlight risk language for your current draft.</p>
          <div className="suggest-actions">
            <button className="btn ghost" onClick={() => handleSuggest('summarize')} disabled={suggesting}>
              Summarize
            </button>
            <button className="btn" onClick={() => handleSuggest('edit')} disabled={suggesting}>
              {suggesting ? 'Thinking...' : 'Suggest edits'}
            </button>
          </div>
          <div className="suggestion-box">
            <strong>Latest suggestion</strong>
            <div className="suggestion-content">{latestSuggestion || 'No suggestions yet'}</div>
            <button className="btn ghost full-width" onClick={handleApplySuggestion} disabled={!latestSuggestion}>
              Apply suggestion to draft
            </button>
          </div>
        </div>

        <ComplianceReport
          report={report}
          loading={validating}
          error={validationError}
          onRunCheck={handleRunCompliance}
        />
      </div>
    </div>
  )
}
