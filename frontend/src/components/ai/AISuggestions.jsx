import React, { useContext, useMemo, useState } from 'react'
import { AIContext } from '../../context/AIContext'
import SuggestionCard from './SuggestionCard'
import RiskWarning from './RiskWarning'
import ExplanationPanel from './ExplanationPanel'

function extractRiskWarnings(text) {
  const warnings = []
  const normalized = (text || '').toLowerCase()
  if (normalized.includes('sole discretion')) warnings.push('Consider narrowing "sole discretion" language.')
  if (normalized.includes('unlimited liability')) warnings.push('Unlimited liability can materially increase risk.')
  if (!normalized.includes('termination')) warnings.push('Termination terms may be missing.')
  return warnings
}

export default function AISuggestions({ sourceText = '', onAcceptSuggestion }) {
  const { suggest } = useContext(AIContext)
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState('')
  const [explanation, setExplanation] = useState('')

  const warnings = useMemo(() => extractRiskWarnings(sourceText), [sourceText])

  const runSuggestion = async (mode) => {
    if (!sourceText.trim()) return
    setLoading(true)
    const result = await suggest(sourceText, mode)
    const value = result?.suggestion || JSON.stringify(result, null, 2)
    setSuggestion(value)
    setExplanation(`AI ${mode} generated from current draft text. Review before accepting.`)
    setLoading(false)
  }

  return (
    <div className="side-stack">
      <div className="card">
        <div className="panel-head">
          <h4>AI Assistant</h4>
        </div>
        <p className="muted-text">Generate and review assistive suggestions. Manual approval required.</p>
        <div className="suggest-actions">
          <button className="btn ghost" onClick={() => runSuggestion('summarize')} disabled={loading}>
            {loading ? 'Thinking...' : 'Summarize'}
          </button>
          <button className="btn" onClick={() => runSuggestion('edit')} disabled={loading}>
            {loading ? 'Thinking...' : 'Suggest edits'}
          </button>
        </div>
      </div>

      <SuggestionCard
        suggestion={suggestion}
        onAccept={(value) => onAcceptSuggestion?.(value)}
        onReject={() => setSuggestion('')}
      />
      <ExplanationPanel text={explanation} />
      <RiskWarning items={warnings} />
    </div>
  )
}
