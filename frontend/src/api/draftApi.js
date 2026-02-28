import api from './axiosConfig'

export async function fetchDrafts() {
  const res = await api.get('/api/drafts/')
  return Array.isArray(res.data) ? res.data : []
}

export async function createDraft(payload) {
  const res = await api.post('/api/drafts/', payload)
  return res.data
}

export async function updateDraft(id, payload) {
  const res = await api.patch(`/api/drafts/${id}/`, payload)
  return res.data
}

export async function getDraft(id) {
  const res = await api.get(`/api/drafts/${id}/`)
  return res.data
}

export async function deleteDraft(id) {
  await api.delete(`/api/drafts/${id}/`)
  return true
}

export async function fetchTrashDrafts() {
  const res = await api.get('/api/drafts/trash/')
  return Array.isArray(res.data) ? res.data : []
}

export async function restoreDraft(draftId) {
  const res = await api.post(`/api/drafts/trash/${draftId}/restore/`)
  return res.data
}

export async function deleteDraftPermanently(draftId) {
  const res = await api.delete(`/api/drafts/trash/${draftId}/delete/`)
  return res.data
}

export async function deleteAllTrash() {
  const res = await api.delete('/api/drafts/trash/delete-all/')
  return res.data
}

export async function renderTemplate(documentTypeId, jurisdiction = 'India') {
  const res = await api.get(`/api/drafts/templates/${documentTypeId}/render/`, {
    params: { jurisdiction }
  })
  return res.data
}

export async function fetchTemplates() {
  const res = await api.get('/api/drafts/templates/')
  return Array.isArray(res.data?.templates) ? res.data.templates : []
}

export async function generateAIDraft(documentTypeId, keyTerms = [], jurisdiction = 'India') {
  const res = await api.post('/api/drafts/ai-draft/', {
    document_type_id: documentTypeId,
    key_terms: keyTerms,
    jurisdiction
  })
  return res.data
}

export async function assistDraft(draftId, instruction = '', text) {
  const payload = { draft_id: draftId, instruction }
  if (text !== undefined) payload.text = text
  const res = await api.post('/api/drafts/assist/', payload)
  return res.data
}

export async function analyzeDocument(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await api.post('/api/drafts/analyze-document/', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

export async function extractDocumentPreview(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await api.post('/api/drafts/upload-analyze/', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

export async function exportDraft(draftId, format) {
  const res = await api.get(`/api/drafts/${draftId}/export/`, {
    params: { file_format: format },
    responseType: 'arraybuffer'
  })
  return res
}

export async function startSandbox(draftId) {
  const res = await api.post(`/api/drafts/sandbox/start/${draftId}/`)
  return res.data
}

export async function updateSandbox(sandboxId, sandboxContent) {
  const res = await api.patch(`/api/drafts/sandbox/${sandboxId}/update/`, {
    sandbox_content: sandboxContent
  })
  return res.data
}

export async function assistSandbox(sandboxId, instruction = '') {
  const res = await api.post(`/api/drafts/sandbox/${sandboxId}/assist/`, { instruction })
  return res.data
}

export async function commitSandbox(sandboxId) {
  const res = await api.post(`/api/drafts/sandbox/${sandboxId}/commit/`)
  return res.data
}

export async function discardSandbox(sandboxId) {
  const res = await api.post(`/api/drafts/sandbox/${sandboxId}/discard/`)
  return res.data
}
