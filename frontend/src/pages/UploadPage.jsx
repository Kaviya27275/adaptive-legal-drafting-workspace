import { useCallback, useMemo, useState } from 'react'
import { analyzeDocument, extractDocumentPreview } from '../api/draftApi'

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]

function formatSize(size) {
  if (!size && size !== 0) return '-'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadPage() {
  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [previewText, setPreviewText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = useCallback(async (next) => {
    if (!next) return
    if (!ACCEPTED_TYPES.includes(next.type)) {
      setError('Unsupported file type. Use PDF, DOC, DOCX, or TXT.')
      return
    }
    setFile(next)
    setAnalysis(null)
    setPreviewText('Loading preview...')
    setError('')

    if (next.type === 'text/plain') {
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewText(String(reader.result || ''))
      }
      reader.readAsText(next)
      return
    }

    try {
      const preview = await extractDocumentPreview(next)
      setPreviewText(preview.text_excerpt || 'Preview unavailable for this file type.')
    } catch (err) {
      setPreviewText('Preview unavailable. Please analyze the document.')
    }
  }, [])

  const onDrop = (event) => {
    event.preventDefault()
    setDragActive(false)
    const next = event.dataTransfer.files?.[0]
    if (next) handleFile(next)
  }

  const onBrowse = (event) => {
    const next = event.target.files?.[0]
    if (next) handleFile(next)
  }

  const analyze = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const result = await analyzeDocument(file)
      setAnalysis(result)
      setPreviewText(result.content || '')
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to analyze document.')
    } finally {
      setLoading(false)
    }
  }

  const riskBadge = useMemo(() => {
    const level = analysis?.analysis?.risk_level || ''
    if (level === 'high') return 'bg-rose-100 text-rose-700 border-rose-200'
    if (level === 'low') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    return 'bg-amber-100 text-amber-700 border-amber-200'
  }, [analysis])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Reference Document Analyzer</h2>
        <p className="mt-2 text-slate-600">
          Upload a document for AI-assisted legal analysis, clause extraction, and compliance insights.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        <div
          onDragOver={(event) => {
            event.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition ${
            dragActive ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <p className="text-sm font-semibold text-slate-800">Drag and drop a PDF, DOC, DOCX, or TXT file</p>
          <p className="text-xs text-slate-500">or</p>
          <label className="cursor-pointer rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md">
            Choose File
            <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={onBrowse} className="hidden" />
          </label>
        </div>

        {file ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">{file.name}</p>
              <p className="text-xs text-slate-500">Size: {formatSize(file.size)}</p>
            </div>
            <div className="flex gap-2">
              <label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">
                Replace
                <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={onBrowse} className="hidden" />
              </label>
              <button
                type="button"
                onClick={() => {
                  setFile(null)
                  setAnalysis(null)
                  setPreviewText('')
                }}
                className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={analyze}
                disabled={loading}
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md disabled:opacity-60"
              >
                {loading ? 'Analyzing...' : 'Analyze Document'}
              </button>
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="min-h-[70vh] rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Document Preview</h3>
            {analysis?.analysis?.detected_document_type ? (
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                {analysis.analysis.detected_document_type}
              </span>
            ) : null}
          </div>
          <div className="h-[62vh] overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
            {previewText || 'Upload a document to see the extracted text here.'}
          </div>
        </article>

        <aside className="min-h-[70vh] rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Analysis</h3>
            {analysis?.analysis?.risk_level ? (
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskBadge}`}>
                Risk: {analysis.analysis.risk_level}
              </span>
            ) : null}
          </div>

          {analysis ? (
            <div className="mt-4 space-y-4 text-sm text-slate-700">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Executive Summary</p>
                <p className="mt-1 text-slate-700">{analysis.analysis.executive_summary || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Overall Assessment</p>
                <p className="mt-1 text-slate-700">{analysis.analysis.overall_assessment || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Compliance Observations</p>
                <ul className="mt-1 space-y-1">
                  {(analysis.analysis.compliance_observations || []).map((item, idx) => (
                    <li key={`comp-${idx}`} className="rounded bg-slate-50 px-2 py-1 text-xs text-slate-700">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Key Legal Terms</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {(analysis.analysis.key_legal_terms || []).map((term, idx) => (
                    <span key={`term-${idx}`} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700">
                      {term}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Risks & Missing Provisions</p>
                <ul className="mt-1 space-y-1">
                  {(analysis.analysis.risks || []).map((item, idx) => (
                    <li key={`risk-${idx}`} className="rounded bg-rose-50 px-2 py-1 text-xs text-rose-700">
                      {item}
                    </li>
                  ))}
                  {(analysis.analysis.missing_provisions || []).map((item, idx) => (
                    <li key={`miss-${idx}`} className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Recommendations</p>
                <ul className="mt-1 space-y-1">
                  {(analysis.analysis.recommendations || []).map((item, idx) => (
                    <li key={`rec-${idx}`} className="rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Extracted Clauses</p>
                <div className="mt-2 space-y-2">
                  {(analysis.analysis.clauses || []).map((item, idx) => (
                    <div key={`clause-${idx}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <p className="text-xs font-semibold text-slate-800">{item.title || `Clause ${idx + 1}`}</p>
                      {item.summary ? <p className="mt-1 text-xs text-slate-600">{item.summary}</p> : null}
                      {item.risk_notes ? <p className="mt-1 text-xs text-rose-700">{item.risk_notes}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Run analysis to see AI insights here.</p>
          )}
        </aside>
      </section>
    </div>
  )
}
