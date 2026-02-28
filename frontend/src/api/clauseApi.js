import api from './axiosConfig'

export async function fetchClauses({ draftId } = {}) {
  const res = await api.get('/api/clauses/', {
    params: draftId ? { draft: draftId } : undefined
  })
  return Array.isArray(res.data) ? res.data : []
}

export async function createClause(payload) {
  const res = await api.post('/api/clauses/', payload)
  return res.data
}

export async function updateClause(id, payload) {
  const res = await api.patch(`/api/clauses/${id}/`, payload)
  return res.data
}

export async function deleteClause(id) {
  await api.delete(`/api/clauses/${id}/`)
  return true
}

export async function reorderClauses(draftId, orderedIds) {
  const res = await api.post('/api/clauses/reorder/', {
    draft_id: draftId,
    ordered_clause_ids: orderedIds
  })
  return res.data
}

export async function fetchClauseLibraryByDocumentType(documentTypeId) {
  const res = await api.get('/api/clauses/library/by-document-type/', {
    params: { document_type_id: documentTypeId }
  })
  return Array.isArray(res.data) ? res.data : []
}

export async function fetchClauseLibraryAll() {
  const res = await api.get('/api/clauses/library/')
  return Array.isArray(res.data) ? res.data : []
}

export async function searchClauses(query, options = {}) {
  const params = { q: query, ...options }
  const res = await api.get('/api/clauses/library/semantic-search/', { params })
  return Array.isArray(res.data?.results) ? res.data.results : []
}
