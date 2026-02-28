import api from './axiosConfig'

export async function suggest(text, mode = 'edit') {
  if (!text?.trim()) {
    return { suggestion: 'No text provided for analysis.' }
  }

  try {
    const res = await api.post('/api/ai/clause-analyze/', { text })
    const analysis = res.data?.analysis || res.data
    const summary = typeof analysis === 'string'
      ? analysis
      : JSON.stringify(analysis, null, 2)
    return { suggestion: `[${mode}] ${summary}` }
  } catch (err) {
    return { suggestion: `AI analysis unavailable for ${mode} mode.` }
  }
}

export async function reviewDraft(draftId) {
  const res = await api.post(`/api/ai/draft-review/${draftId}/`)
  return res.data
}

