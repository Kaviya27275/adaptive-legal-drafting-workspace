import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useWorkspace } from '../context/WorkspaceContext'
import {
  exportDraft,
  startSandbox,
  updateSandbox,
  commitSandbox
} from '../api/draftApi'
import { reviewDraft } from '../api/aiApi'

export default function DraftPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    clauseTypes,
    getDraftById,
    addClause,
    updateClause,
    deleteClause,
    deleteDraft,
    loadVersion,
    getCompliance,
    runComplianceCheck,
    getSuggestions,
    acceptSuggestion,
    refreshDrafts
  } = useWorkspace()

  const [saveState, setSaveState] = useState('')
  const [rejectedSuggestionType, setRejectedSuggestionType] = useState('')
  const [isComplianceOpen, setIsComplianceOpen] = useState(false)
  const [complianceResult, setComplianceResult] = useState(null)
  const [lastCheckedAt, setLastCheckedAt] = useState('')
  const [selectedWarningIndex, setSelectedWarningIndex] = useState(null)
  const [isAutoRemediating, setIsAutoRemediating] = useState(false)
  const [autoRemediationMessage, setAutoRemediationMessage] = useState('')
  const [draftTitle, setDraftTitle] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const [localClauses, setLocalClauses] = useState([])
  const [aiReview, setAiReview] = useState(null)
  const [aiReviewLoading, setAiReviewLoading] = useState(false)
  const [aiReviewError, setAiReviewError] = useState('')
  const [isAddingClause, setIsAddingClause] = useState(false)
  const [clauseError, setClauseError] = useState('')
  const [sandboxId, setSandboxId] = useState(null)
  const [sandboxLoading, setSandboxLoading] = useState(false)
  const [sandboxError, setSandboxError] = useState('')
  const draft = getDraftById(id)

  const compliance = useMemo(() => getCompliance(draft), [draft?.id, getCompliance])
  const suggestions = useMemo(() => getSuggestions(draft), [draft, getSuggestions])
  const visibleSuggestion = suggestions.find((item) => item.clauseType !== rejectedSuggestionType) || null

  useEffect(() => {
    setComplianceResult(null)
    setLastCheckedAt('')
    setIsComplianceOpen(false)
    setSelectedWarningIndex(null)
  }, [draft?.updatedAt])

  useEffect(() => {
    if (!draft) return
    setDraftTitle(draft.title || '')
    setDraftBody(draft.bodyText || '')
    setLocalClauses((draft.clauses || []).map((clause, index) => ({ ...clause, order: index })))
    setAiReview(null)
    setAiReviewError('')
    setClauseError('')
    setSandboxId(null)
    setSandboxError('')
  }, [draft?.id, draft?.updatedAt, draft?.clauses])

  useEffect(() => {
    if (!draft?.id) return
    let cancelled = false
    const initSandbox = async () => {
      setSandboxError('')
      setSandboxLoading(true)
      try {
        const res = await startSandbox(draft.id)
        if (cancelled) return
        const nextSandboxId = res?.sandbox?.id || null
        const nextContent = res?.sandbox?.sandbox_content
        setSandboxId(nextSandboxId)
        if (typeof nextContent === 'string') {
          setDraftBody(nextContent)
        }
      } catch (error) {
        if (!cancelled) {
          setSandboxError(error?.response?.data?.error || 'Unable to initialize adaptive sandbox.')
        }
      } finally {
        if (!cancelled) setSandboxLoading(false)
      }
    }
    initSandbox()
    return () => {
      cancelled = true
    }
  }, [draft?.id])

  const commitDraftBodyThroughSandbox = async (content) => {
    let activeSandboxId = sandboxId
    if (!activeSandboxId) {
      const started = await startSandbox(draft.id)
      activeSandboxId = started?.sandbox?.id || null
      setSandboxId(activeSandboxId)
    }
    if (!activeSandboxId) {
      throw new Error('Unable to start sandbox session.')
    }

    await updateSandbox(activeSandboxId, content)
    await commitSandbox(activeSandboxId)

    const next = await startSandbox(draft.id)
    setSandboxId(next?.sandbox?.id || null)
  }

  const hasPendingClauseChanges = () => {
    const serverClauses = draft?.clauses || []
    if (serverClauses.length !== localClauses.length) return true

    for (let i = 0; i < localClauses.length; i += 1) {
      const local = localClauses[i]
      const server = serverClauses.find((item) => item.id === local.id)
      if (!server) return true
      if ((local.title || '') !== (server.title || '')) return true
      if ((local.text || '') !== (server.text || '')) return true
      if ((local.type || '') !== (server.type || '')) return true
      if ((local.order ?? i) !== i) return true
    }
    return false
  }

  const persistClauseChanges = async () => {
    if (!hasPendingClauseChanges()) return
    const tasks = localClauses.map((clause, index) => {
      const server = (draft?.clauses || []).find((item) => item.id === clause.id)
      if (!server) return Promise.resolve()
      const changed =
        (clause.title || '') !== (server.title || '') ||
        (clause.text || '') !== (server.text || '') ||
        (clause.type || '') !== (server.type || '') ||
        index !== ((server.order ?? index))
      if (!changed) return Promise.resolve()
      return updateClause(draft.id, clause.id, {
        title: clause.title,
        text: clause.text,
        type: clause.type,
        order: index
      })
    })
    await Promise.all(tasks)
  }

  if (!draft) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-md">
        <p className="text-slate-600">Draft not found.</p>
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  const handleSave = async () => {
    setSaveState('Saving...')
    try {
      await persistClauseChanges()
      await commitDraftBodyThroughSandbox(draftBody)
      await refreshDrafts()
      setSaveState('Saved')
      setTimeout(() => setSaveState(''), 1200)
    } catch (error) {
      setSaveState('Save failed')
      setSandboxError(error?.response?.data?.error || error?.message || 'Unable to save sandbox draft.')
      setTimeout(() => setSaveState(''), 1600)
    }
  }

  const handleLoadVersion = async (versionId) => {
    await loadVersion(draft.id, versionId)
  }

  const handleComplianceCheck = async () => {
    try {
      await commitDraftBodyThroughSandbox(draftBody)
      await refreshDrafts()
    } catch (error) {
      setSandboxError(error?.response?.data?.error || error?.message || 'Unable to sync sandbox before compliance check.')
      return
    }
    const result = await runComplianceCheck(draft.id)
    setComplianceResult(result)
    setIsComplianceOpen(true)
    setLastCheckedAt(new Date().toLocaleTimeString())
    setSelectedWarningIndex(null)
  }

  const handleAIComplianceAutoRemediation = async () => {
    if (!draft || !complianceResult) return
    if (!complianceResult.warnings?.length && !complianceResult.missingClauses?.length) return

    setIsAutoRemediating(true)
    setAutoRemediationMessage('')

    try {
      const content = (draftBody || '').replace(/\r/g, '')
      const safeTitle = (draftTitle || draft.title || 'Consultancy Agreement').toUpperCase()
      const agreementDate = new Date().toISOString().slice(0, 10)
      const jurisdiction = draft.jurisdiction || 'India'

      const readLineValue = (label, fallback) => {
        const match = content.match(new RegExp(`^${label}\\s*:\\s*(.+)$`, 'im'))
        if (!match?.[1]) return fallback
        const value = match[1].trim()
        if (!value || value.includes('Insert')) return fallback
        return value
      }

      const clientName = readLineValue('Client', 'Client Organization')
      const consultantName = readLineValue('Consultant', 'Consultant Organization')
      const scopeSentence =
        content.match(/consultant shall provide[:\s]*(.+?)(?:\n|$)/i)?.[1]?.trim() ||
        'consultancy services described in Schedule A and mutually agreed statements of work.'
      const feeSentence =
        content.match(/client shall pay(.+?)(?:\n|$)/i)?.[0]?.trim() ||
        'Client shall pay professional fees as per agreed milestones and approved invoices.'

      const orderedTemplate = [
        `${safeTitle}`,
        `Date: ${agreementDate}`,
        `Jurisdiction: ${jurisdiction}`,
        '',
        'This Consultancy Agreement is made on the date above between:',
        `Client: ${clientName}`,
        `Consultant: ${consultantName}`,
        '',
        '1. Title and Parties',
        `This Agreement is entered into by and between ${clientName} and ${consultantName}.`,
        '',
        '2. Scope of Work',
        `Consultant shall provide ${scopeSentence}`,
        '',
        '3. Independent Contractor',
        'Consultant acts as an independent contractor and is not an employee, partner, or agent of the Client.',
        '',
        '4. Fees and Payment',
        `${feeSentence} Payments are due within 30 days from receipt of a valid invoice.`,
        '',
        '5. Intellectual Property',
        'Work product specifically created under this Agreement shall vest in the Client upon full payment, excluding Consultant pre-existing materials.',
        '',
        '6. Confidentiality',
        'Each party shall keep confidential information strictly confidential and use it only for performance of this Agreement.',
        '',
        '7. Term and Termination',
        `This Agreement starts on ${agreementDate} and continues until completion unless terminated earlier.`,
        'Either party may terminate by giving a Notice Period of 30 days in writing.',
        '',
        '8. Force Majeure',
        'Neither party is liable for delay or failure caused by events beyond reasonable control, provided prompt notice is given.',
        '',
        '9. Dispute Resolution and Arbitration',
        'Parties shall first attempt amicable resolution. Unresolved disputes shall be referred to Arbitration under applicable law in India.',
        '',
        '10. Indemnity',
        'Each party shall indemnify the other against losses arising from breach of obligations under this Agreement.',
        '',
        '11. Limitation of Liability',
        'Except for fraud, willful misconduct, and confidentiality breaches, total liability shall be limited to fees paid under this Agreement.',
        '',
        '12. Governing Law',
        `This Agreement is governed by the laws of ${jurisdiction}.`,
        '',
        '13. Notices',
        'All legal notices shall be in writing and delivered by email and registered post to authorized addresses of each party.',
        '',
        '14. Signatures',
        `Client: ${clientName}`,
        `Consultant: ${consultantName}`
      ].join('\n')

      setDraftBody(orderedTemplate)
      await commitDraftBodyThroughSandbox(orderedTemplate)

      await refreshDrafts()
      const refreshed = await runComplianceCheck(draft.id)
      setComplianceResult(refreshed)
      setLastCheckedAt(new Date().toLocaleTimeString())
      setAutoRemediationMessage('AI Compliance Auto-Remediation applied with ordered template fixes.')
    } catch (error) {
      setAutoRemediationMessage(
        error?.response?.data?.error || 'AI compliance auto-remediation failed. Please try again.'
      )
    } finally {
      setIsAutoRemediating(false)
    }
  }

  const getWarningInsight = (warning) => {
    const text = (warning || '').toLowerCase()
    if (text.includes('mandatory clause')) {
      return {
        error: warning,
        details: complianceResult?.missingClauses?.length
          ? `Missing clauses: ${complianceResult.missingClauses.join(', ')}.`
          : '',
        solution:
          'Add the listed mandatory clauses using the clause panel or AI suggestion panel, then run compliance check again.'
      }
    }
    if (text.includes('required legal term')) {
      return {
        error: warning,
        details: complianceResult?.missingLegalTerms?.length
          ? `Missing legal terms: ${complianceResult.missingLegalTerms.join(', ')}.`
          : '',
        solution:
          'Insert the missing legal terms in the relevant sections (governing law, notice, liability, etc.), then re-check.'
      }
    }
    if (text.includes('prohibited word')) {
      return {
        error: warning,
        details: complianceResult?.prohibitedWordsFound?.length
          ? `Prohibited words found: ${complianceResult.prohibitedWordsFound.join(', ')}.`
          : '',
        solution:
          'Replace prohibited words with approved legal wording and run compliance check again.'
      }
    }
    if (text.includes('structure violation')) {
      return {
        error: warning,
        details: complianceResult?.structureViolations?.length
          ? `Structure issues: ${complianceResult.structureViolations.join(', ')}.`
          : '',
        solution:
          'Reorder sections to match the required document structure and ensure all mandatory headings are present.'
      }
    }
    if (text.includes('missing value placeholder')) {
      return {
        error: warning,
        details: complianceResult?.missingValues?.length
          ? `Unfilled placeholders: ${complianceResult.missingValues.join(', ')}.`
          : '',
        solution:
          'Replace each placeholder with actual values (names, dates, amounts, addresses), then re-run compliance.'
      }
    }
    return {
      error: warning,
      details: '',
      solution: 'Review this warning, update the draft content accordingly, and run compliance check again.'
    }
  }

  const handleExportDraft = async (format) => {
    const safeTitle = (draftTitle || draft.title || 'draft')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    const content = [
      `Title: ${draftTitle || draft.title}`,
      `Document Type: ${draft.documentType}`,
      `Updated At: ${new Date(draft.updatedAt).toLocaleString()}`,
      '',
      'Draft Body',
      '----------',
      draftBody || '(empty)',
      '',
      'Clauses',
      '-------',
      ...(draft.clauses.length
        ? draft.clauses.map(
            (clause, index) =>
              `${index + 1}. [${clause.type}] ${clause.title || 'Untitled'}\n${clause.text || '(empty)'}`
          )
        : ['No clauses added.'])
    ].join('\n')

    if (format === 'txt') {
      const mime = 'text/plain;charset=utf-8'
      const extension = 'txt'
      const blob = new Blob([content], { type: mime })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${safeTitle || 'draft'}-export.${extension}`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      return
    }

    if (format === 'pdf' || format === 'docx' || format === 'doc') {
      try {
        const res = await exportDraft(draft.id, format)
        const contentType = res.headers['content-type'] || 'application/octet-stream'
        const blob = new Blob([res.data], { type: contentType })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `${safeTitle || 'draft'}-export.${format}`
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        URL.revokeObjectURL(url)
      } catch (error) {
        const message = error?.response?.data?.error || 'Export failed. Please try again.'
        alert(message)
      }
    }
  }


  const handleDeleteDraft = async () => {
    if (!draft) return
    const ok = window.confirm('Delete this draft? This action cannot be undone.')
    if (!ok) return
    await deleteDraft(draft.id)
    await refreshDrafts()
    navigate('/drafts')
  }

  const handleAiReview = async () => {
    setAiReviewLoading(true)
    setAiReviewError('')
    try {
      const res = await reviewDraft(draft.id)
      setAiReview(res.review || res)
    } catch (error) {
      setAiReviewError(error?.response?.data?.error || 'AI review failed.')
      setAiReview(null)
    } finally {
      setAiReviewLoading(false)
    }
  }

  const handleAddClause = async () => {
    setClauseError('')
    setIsAddingClause(true)
    try {
      await addClause(draft.id)
    } catch (error) {
      const apiMessage =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        error?.response?.data?.draft?.[0] ||
        error?.response?.data?.clause_type?.[0] ||
        ''
      if (error?.response?.status === 401) {
        setClauseError('Add Clause failed: session expired (401). Please login again.')
      } else {
        setClauseError(apiMessage || 'Add Clause failed. Please try again.')
      }
    } finally {
      setIsAddingClause(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_310px]">
      <section className="space-y-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">File Name</label>
              <input
                value={draftTitle}
                readOnly
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Document Type</label>
              <input
                value={draft.documentType}
                readOnly
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Version</label>
              <select
                onChange={(event) => handleLoadVersion(event.target.value)}
                className="mt-1 w-44 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                defaultValue=""
              >
                <option value="" disabled>
                  Select version
                </option>
                {draft.versions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={sandboxLoading}
              className="h-fit rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700"
            >
              {sandboxLoading ? 'Preparing Sandbox...' : 'Save Draft'}
            </button>

            <div className="flex items-center gap-2">
              <select
                onChange={(event) => {
                  if (event.target.value) handleExportDraft(event.target.value)
                  event.target.value = ''
                }}
                className="h-fit rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700"
                defaultValue=""
              >
                <option value="" disabled>
                  Export Draft
                </option>
                <option value="txt">Text (.txt)</option>
                <option value="pdf">PDF (.pdf)</option>
                <option value="docx">DOCX (.docx)</option>
              </select>
              <button
                type="button"
                onClick={handleDeleteDraft}
                className="h-fit rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Delete Draft
              </button>
            </div>
          </div>
          {saveState ? <p className="mt-1 text-xs font-medium text-emerald-600">{saveState}</p> : null}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Draft Body</h3>
            <span className="text-xs font-medium text-slate-500">Adaptive Sandbox Editor</span>
          </div>
          <textarea
            value={draftBody}
            onChange={(event) => setDraftBody(event.target.value)}
            rows={26}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            placeholder="Edit your draft here. This editor runs in adaptive sandbox mode."
          />
          {sandboxError ? <p className="mt-2 text-xs font-medium text-rose-600">{sandboxError}</p> : null}
        </article>
      </section>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <section className="order-3 rounded-xl border border-slate-200 bg-white p-3 shadow-md">
          <h3 className="text-sm font-semibold text-slate-900">AI Suggestion Panel</h3>

          {visibleSuggestion ? (
            <div className="mt-3 space-y-3">
              <div className="rounded-xl bg-slate-50 p-2">
                <p className="text-xs font-semibold text-slate-900">{visibleSuggestion.title}</p>
                <p className="mt-1 text-xs text-slate-600">{visibleSuggestion.explanation}</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    acceptSuggestion(draft.id, visibleSuggestion)
                    setRejectedSuggestionType('')
                  }}
                  className="flex-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white"
                  disabled={!visibleSuggestion.clauseType}
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => setRejectedSuggestionType(visibleSuggestion.clauseType)}
                  className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                >
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-600">No AI suggestions currently. Add or modify clauses to generate new suggestions.</p>
          )}

          <div className="mt-4 border-t border-slate-200 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">All AI Features</p>
            <ul className="mt-2 space-y-2">
              {suggestions.length ? (
                suggestions.map((item) => (
                  <li key={item.id} className="rounded-lg bg-slate-50 p-1.5">
                    <p className="text-[11px] font-semibold text-slate-800">{item.title}</p>
                    <p className="mt-1 text-[11px] text-slate-600">{item.explanation}</p>
                  </li>
                ))
              ) : (
                <li className="rounded-lg bg-slate-50 p-1.5 text-[11px] text-slate-600">
                  AI gap analysis and advisory recommendations will appear here.
                </li>
              )}
            </ul>
          </div>
        </section>

        <section className="order-1 rounded-xl border border-slate-200 bg-white p-3 shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">AI Draft Review</h3>
            <button
              type="button"
              onClick={handleAiReview}
              disabled={aiReviewLoading}
              className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-60"
            >
              {aiReviewLoading ? 'Reviewing...' : 'Run Review'}
            </button>
          </div>
          {aiReviewError ? <p className="mt-2 text-xs font-medium text-rose-600">{aiReviewError}</p> : null}
          {aiReview ? (
            <pre className="mt-3 max-h-56 overflow-y-auto rounded-lg bg-slate-50 p-2 text-[11px] text-slate-700">
              {JSON.stringify(aiReview, null, 2)}
            </pre>
          ) : (
            <p className="mt-2 text-xs text-slate-500">Run AI review to surface risks and improvement notes.</p>
          )}
        </section>

        <section className="order-2 rounded-xl border border-slate-200 bg-white p-3 shadow-md">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Clauses</h3>
            <button
              type="button"
              onClick={handleAddClause}
              disabled={isAddingClause}
              className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white"
            >
              {isAddingClause ? 'Adding...' : 'Add Clause'}
            </button>
          </div>
          {clauseError ? <p className="mb-2 text-xs font-medium text-rose-600">{clauseError}</p> : null}

          <div className="max-h-[42vh] space-y-3 overflow-y-auto pr-1">
            {localClauses.map((clause, index) => (
              <article key={clause.id} className="rounded-xl border border-slate-200 bg-white p-2">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setLocalClauses((prev) => {
                          const currentIndex = prev.findIndex((item) => item.id === clause.id)
                          if (currentIndex <= 0) return prev
                          const next = [...prev]
                          const [moved] = next.splice(currentIndex, 1)
                          next.splice(currentIndex - 1, 0, moved)
                          return next.map((item, order) => ({ ...item, order }))
                        })
                      }
                      disabled={index === 0}
                      className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 disabled:opacity-40"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setLocalClauses((prev) => {
                          const currentIndex = prev.findIndex((item) => item.id === clause.id)
                          if (currentIndex < 0 || currentIndex >= prev.length - 1) return prev
                          const next = [...prev]
                          const [moved] = next.splice(currentIndex, 1)
                          next.splice(currentIndex + 1, 0, moved)
                          return next.map((item, order) => ({ ...item, order }))
                        })
                      }
                      disabled={index === localClauses.length - 1}
                      className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 disabled:opacity-40"
                    >
                      Down
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteClause(draft.id, clause.id)}
                    className="rounded border border-rose-200 px-2 py-0.5 text-[10px] font-semibold text-rose-600"
                  >
                    Delete
                  </button>
                </div>

                <div className="grid gap-2">
                  <select
                    value={clause.type}
                    onChange={(event) =>
                      setLocalClauses((prev) =>
                        prev.map((item) =>
                          item.id === clause.id ? { ...item, type: event.target.value } : item
                        )
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-indigo-400"
                  >
                    {clauseTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <input
                    value={clause.title}
                    onChange={(event) =>
                      setLocalClauses((prev) =>
                        prev.map((item) =>
                          item.id === clause.id ? { ...item, title: event.target.value } : item
                        )
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-indigo-400"
                    placeholder="Clause heading"
                  />
                  <textarea
                    value={clause.text}
                    onChange={(event) =>
                      setLocalClauses((prev) =>
                        prev.map((item) =>
                          item.id === clause.id ? { ...item, text: event.target.value } : item
                        )
                      )
                    }
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-indigo-400"
                    placeholder="Draft your clause content"
                  />
                </div>
              </article>
            ))}

            {localClauses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-500">
                No clauses yet. Add a clause to start structuring your draft.
              </div>
            ) : (
              <></>
            )}
          </div>
        </section>

        <section className="order-4 rounded-xl border border-slate-200 bg-white p-3 shadow-md">
          <div className="flex w-full items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">Compliance Panel</span>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                {complianceResult ? `${complianceResult.score}%` : '--'}
              </span>
              <button
                type="button"
                onClick={handleComplianceCheck}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Check
              </button>
            </div>
          </div>
          {isComplianceOpen && complianceResult?.warnings?.length ? (
            <button
              type="button"
              onClick={handleAIComplianceAutoRemediation}
              disabled={isAutoRemediating}
              className="mt-2 w-full rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {isAutoRemediating ? 'Applying...' : 'AI Compliance Auto-Remediation'}
            </button>
          ) : null}
          {autoRemediationMessage ? (
            <p
              className={`mt-2 text-xs font-medium ${
                autoRemediationMessage.toLowerCase().includes('failed') ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {autoRemediationMessage}
            </p>
          ) : null}

          {!complianceResult ? (
            <p className="mt-3 text-xs text-slate-500">Run compliance check to view missing clauses and warnings.</p>
          ) : null}
          {lastCheckedAt ? <p className="mt-2 text-[11px] text-slate-500">Checked at {lastCheckedAt}</p> : null}

          {isComplianceOpen ? (
            <>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Missing Clauses</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {complianceResult.missingClauses.length ? (
                  complianceResult.missingClauses.map((missing) => (
                    <span key={missing} className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      {missing}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">No gaps detected</span>
                )}
              </div>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Validation Warnings</p>
              <ul className="mt-2 space-y-1">
                {complianceResult.warnings.length ? (
                  complianceResult.warnings.map((warning, index) => (
                    <li key={warning}>
                      <button
                        type="button"
                        onClick={() => setSelectedWarningIndex(index)}
                        className={`w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition ${
                          selectedWarningIndex === index
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {warning}
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700">
                    No validation warnings.
                  </li>
                )}
              </ul>

              {selectedWarningIndex !== null && complianceResult.warnings[selectedWarningIndex] ? (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Selected Error</p>
                  <p className="mt-1 text-xs font-semibold text-rose-700">
                    {getWarningInsight(complianceResult.warnings[selectedWarningIndex]).error}
                  </p>
                  {getWarningInsight(complianceResult.warnings[selectedWarningIndex]).details ? (
                    <p className="mt-2 text-xs text-slate-700">
                      {getWarningInsight(complianceResult.warnings[selectedWarningIndex]).details}
                    </p>
                  ) : null}
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Solution</p>
                  <p className="mt-1 text-xs text-slate-700">
                    {getWarningInsight(complianceResult.warnings[selectedWarningIndex]).solution}
                  </p>
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      </aside>
    </div>
  )
}
