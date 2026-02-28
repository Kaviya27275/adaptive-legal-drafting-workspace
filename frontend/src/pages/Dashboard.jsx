import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspace } from '../context/WorkspaceContext'

const draftingCards = [
  {
    key: 'create',
    title: 'Create New Draft',
    description: 'Start a structured legal draft with built-in compliance checks.'
  },
  {
    key: 'review',
    title: 'Review Existing Draft',
    description: 'Open and continue drafting from your existing documents.'
  },
  {
    key: 'upload',
    title: 'Upload Reference Document',
    description: 'Bring reference text to guide drafting and clause selection.'
  },
  {
    key: 'ai',
    title: 'AI Draft Assistance',
    description: 'Get drafting guidance, clause suggestions, and risk prompts.'
  }
]

const intelligenceCards = [
  {
    key: 'library',
    title: 'Precedent Library',
    description: 'Use precedent templates for faster and consistent drafting.'
  }
]

function CardIcon({ kind }) {
  const common = 'h-5 w-5'
  const icons = {
    create: (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
    review: (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5V4a2 2 0 0 1 2-2h8l6 6v11.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 19.5z" />
        <path d="M14 2v6h6" />
      </svg>
    ),
    upload: (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M5 20h14" />
      </svg>
    ),
    compliance: (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3 4 7v6c0 5 3.5 7.8 8 9 4.5-1.2 8-4 8-9V7l-8-4z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    ai: (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1 1 0 0 1 0 1.4l-1.3 1.3a1 1 0 0 1-1.4 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1 1 0 0 1-1 1h-1.8a1 1 0 0 1-1-1v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1 1 0 0 1-1.4 0L4.2 17.9a1 1 0 0 1 0-1.4l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H3.4a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1 1 0 0 1 0-1.4l1.3-1.3a1 1 0 0 1 1.4 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a1 1 0 0 1 1-1h1.8a1 1 0 0 1 1 1v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1 1 0 0 1 1.4 0l1.3 1.3a1 1 0 0 1 0 1.4l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2a1 1 0 0 1 1 1v1.8a1 1 0 0 1-1 1h-.2a1 1 0 0 0-.9.6z" />
      </svg>
    ),
    library: (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19a2 2 0 0 1 2-2h14" />
        <path d="M6 17V4a2 2 0 0 1 2-2h12v15" />
      </svg>
    )
  }

  return icons[kind] || icons.review
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { createDraft, documentTypes, drafts, fetchTemplateContent, generateDraftFromAI } = useWorkspace()
  const [showModal, setShowModal] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState({ title: '', documentType: documentTypes[0] || '' })
  const [templateContent, setTemplateContent] = useState('')
  const [templateLoading, setTemplateLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [aiForm, setAiForm] = useState({ title: '', documentType: documentTypes[0] || '', keywords: '' })
  const [aiTemplateContent, setAiTemplateContent] = useState('')
  const [aiTemplateLoading, setAiTemplateLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const extractApiMessage = (error, fallback) => {
    const payload = error?.response?.data
    if (!payload) return fallback
    if (typeof payload === 'string') return payload
    if (payload.error && typeof payload.error === 'string') return payload.error
    for (const value of Object.values(payload)) {
      if (Array.isArray(value) && value.length) return String(value[0])
      if (typeof value === 'string') return value
    }
    return fallback
  }

  const latestDraft = useMemo(() => drafts[0] || null, [drafts])

  useEffect(() => {
    if (!form.documentType && documentTypes.length) {
      setForm((prev) => ({ ...prev, documentType: documentTypes[0] }))
    }
  }, [documentTypes, form.documentType])

  useEffect(() => {
    if (!aiForm.documentType && documentTypes.length) {
      setAiForm((prev) => ({ ...prev, documentType: documentTypes[0] }))
    }
  }, [documentTypes, aiForm.documentType])

  useEffect(() => {
    let active = true
    const loadTemplate = async () => {
      if (!showAIModal || !aiForm.documentType) {
        if (active) {
          setAiTemplateLoading(false)
          setAiTemplateContent('')
        }
        return
      }
      setAiTemplateLoading(true)
      const content = await fetchTemplateContent(aiForm.documentType)
      if (!active) return
      setAiTemplateContent(content)
      setAiTemplateLoading(false)
    }
    loadTemplate()
    return () => {
      active = false
    }
  }, [showAIModal, aiForm.documentType, fetchTemplateContent])

  useEffect(() => {
    let active = true
    const loadTemplate = async () => {
      if (!showModal || !form.documentType) {
        if (active) {
          setTemplateLoading(false)
          setTemplateContent('')
        }
        return
      }
      setTemplateLoading(true)
      const content = await fetchTemplateContent(form.documentType)
      if (!active) return
      setTemplateContent(content)
      setTemplateLoading(false)
    }
    loadTemplate()
    return () => {
      active = false
    }
  }, [showModal, form.documentType, fetchTemplateContent])

  const handleCardClick = (key) => {
    if (key === 'create') {
      setShowModal(true)
      return
    }

    if (key === 'review' && latestDraft) {
      navigate(`/draft/${latestDraft.id}`)
      return
    }

    if (key === 'library') {
      navigate('/precedents')
      return
    }

    if (key === 'compliance') {
      navigate('/reports')
      return
    }

    if (key === 'upload') {
      navigate('/upload')
      return
    }

    if (key === 'ai') {
      setShowAIModal(true)
    }
  }

  const handleCreateDraft = async (event) => {
    event.preventDefault()
    const title = form.title.trim()
    if (!title) {
      setFormError('Please enter a draft title.')
      return
    }
    if (!form.documentType) {
      setFormError('Please select a document type.')
      return
    }
    setFormError('')

    setIsCreating(true)
    try {
      const content = templateContent
      const draft = await createDraft(title, form.documentType, content)
      setIsCreating(false)
      setShowModal(false)
      setForm({ title: '', documentType: documentTypes[0] || '' })
      setTemplateContent('')
      navigate(`/draft/${draft.id}`)
    } catch (error) {
      setIsCreating(false)
      const message = extractApiMessage(error, 'Unable to create draft. Please try again.')
      setFormError(Array.isArray(message) ? message[0] : message)
    }
  }

  const handleAIDraft = async (event) => {
    event.preventDefault()
    setAiError('')
    const title = aiForm.title.trim() || `AI Draft ${new Date().toLocaleString()}`
    if (!aiForm.documentType) {
      setAiError('Please select a document type.')
      return
    }
    setIsCreating(true)
    try {
      const terms = aiForm.keywords
        .split(',')
        .map((term) => term.trim())
        .filter(Boolean)
      const content = await generateDraftFromAI(aiForm.documentType, terms)
      const draft = await createDraft(title, aiForm.documentType, content)
      setIsCreating(false)
      setShowAIModal(false)
      setAiForm({ title: '', documentType: documentTypes[0] || '', keywords: '' })
      navigate(`/draft/${draft.id}`)
    } catch (error) {
      setIsCreating(false)
      const message = extractApiMessage(error, 'Unable to generate AI draft. Please try again.')
      setAiError(Array.isArray(message) ? message[0] : message)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="mt-2 text-slate-600">Manage drafting workflows and intelligence tools from one workspace.</p>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Drafting</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {draftingCards.map((card) => (
            <button
              key={card.key}
              type="button"
              onClick={() => handleCardClick(card.key)}
              className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-md transition hover:-translate-y-0.5 hover:border-indigo-300"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                <CardIcon kind={card.key} />
              </div>
              <h4 className="text-base font-semibold text-slate-900">{card.title}</h4>
              <p className="mt-2 text-sm text-slate-600">{card.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Intelligence</h3>
        <div className="grid gap-4 md:grid-cols-1">
          {intelligenceCards.map((card) => (
            <button
              key={card.key}
              type="button"
              onClick={() => handleCardClick(card.key)}
              className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-md transition hover:-translate-y-0.5 hover:border-indigo-300"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                <CardIcon kind={card.key} />
              </div>
              <h4 className="text-base font-semibold text-slate-900">{card.title}</h4>
              <p className="mt-2 text-sm text-slate-600">{card.description}</p>
            </button>
          ))}
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-md">
            <h3 className="text-xl font-semibold text-slate-900">Create New Draft</h3>
            <p className="mt-1 text-sm text-slate-600">Set a draft title and document type to start drafting.</p>

            <form className="mt-6 space-y-4" onSubmit={handleCreateDraft}>
              <div>
                <label className="block text-sm font-medium text-slate-700">Draft Title</label>
                <input
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-indigo-400"
                  placeholder="Enter draft title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Document Type</label>
                <select
                  value={form.documentType}
                  onChange={(event) => setForm((prev) => ({ ...prev, documentType: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-indigo-400"
                >
                  {!documentTypes.length ? (
                    <option value="">No document types available</option>
                  ) : null}
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Template Preview</label>
                <textarea
                  readOnly
                  value={
                    !form.documentType
                      ? 'Select a document type to load a template.'
                      : templateLoading
                        ? 'Loading template...'
                        : (templateContent || 'No template available.')
                  }
                  rows={8}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                />
              </div>

              {formError ? (
                <p className="text-sm font-medium text-rose-600">{formError}</p>
              ) : null}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !documentTypes.length}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isCreating ? 'Creating...' : 'Create Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-md">
            <h3 className="text-xl font-semibold text-slate-900">AI Draft Assistance</h3>
            <p className="mt-1 text-sm text-slate-600">
              Choose a document type and add key terms to generate a first draft.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleAIDraft}>
              <div>
                <label className="block text-sm font-medium text-slate-700">Draft Title</label>
                <input
                  value={aiForm.title}
                  onChange={(event) => setAiForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-indigo-400"
                  placeholder="AI Draft 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Document Type</label>
                <select
                  value={aiForm.documentType}
                  onChange={(event) => setAiForm((prev) => ({ ...prev, documentType: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-indigo-400"
                >
                  {!documentTypes.length ? (
                    <option value="">No document types available</option>
                  ) : null}
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Key Terms (comma-separated)</label>
                <input
                  value={aiForm.keywords}
                  onChange={(event) => setAiForm((prev) => ({ ...prev, keywords: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-indigo-400"
                  placeholder="e.g., payment schedule, confidentiality, termination notice"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Template Preview</label>
                <textarea
                  readOnly
                  value={
                    !aiForm.documentType
                      ? 'Select a document type to load a template.'
                      : aiTemplateLoading
                        ? 'Loading template...'
                        : (aiTemplateContent || 'No template available.')
                  }
                  rows={8}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                />
              </div>

              {aiError ? <p className="text-sm font-medium text-rose-600">{aiError}</p> : null}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAIModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !documentTypes.length}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isCreating ? 'Generating...' : 'Generate Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
